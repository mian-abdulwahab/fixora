import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const PLATFORM_FEE_PERCENT = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { bookingId, successUrl, cancelUrl } = await req.json();
    if (!bookingId) throw new Error("bookingId is required");

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, services:service_id(title, price)")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");
    if (booking.payment_status === "paid") throw new Error("Already paid");

    const amount = Number(booking.total_amount);
    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
    const workerShare = amount - platformFee;

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "pkr",
            product_data: {
              name: booking.services?.title || "Service Booking",
              description: `Booking #${bookingId.slice(0, 8)} - Funds held in escrow`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses smallest currency unit
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        platform_fee: platformFee.toString(),
        worker_share: workerShare.toString(),
      },
      success_url: successUrl || `${req.headers.get("origin")}/dashboard/bookings?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/dashboard/bookings?payment=cancelled`,
    });

    // Update booking with stripe session and commission breakdown
    await supabase
      .from("bookings")
      .update({
        stripe_session_id: session.id,
        platform_fee: platformFee,
        worker_share: workerShare,
        payment_method: "stripe",
      })
      .eq("id", bookingId);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
