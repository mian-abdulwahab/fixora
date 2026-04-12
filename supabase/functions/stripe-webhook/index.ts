import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    
    // For test mode, we'll parse the event directly
    // In production, verify with webhook secret
    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      
      if (!bookingId) {
        console.error("No booking_id in session metadata");
        return new Response("OK", { status: 200 });
      }

      const platformFee = Number(session.metadata?.platform_fee || 0);
      const workerShare = Number(session.metadata?.worker_share || 0);

      // Update booking: payment confirmed, escrow held
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          escrow_status: "held",
          platform_fee: platformFee,
          worker_share: workerShare,
          payment_intent_id: session.payment_intent as string,
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        throw updateError;
      }

      // Update provider pending balance
      const { data: booking } = await supabase
        .from("bookings")
        .select("provider_id")
        .eq("id", bookingId)
        .single();

      if (booking) {
        // Increment pending_balance
        const { data: provider } = await supabase
          .from("service_providers")
          .select("pending_balance")
          .eq("id", booking.provider_id)
          .single();

        if (provider) {
          await supabase
            .from("service_providers")
            .update({
              pending_balance: Number(provider.pending_balance || 0) + workerShare,
            })
            .eq("id", booking.provider_id);
        }

        // Notify provider
        const { data: providerData } = await supabase
          .from("service_providers")
          .select("user_id, business_name")
          .eq("id", booking.provider_id)
          .single();

        if (providerData) {
          await supabase.from("notifications").insert({
            user_id: providerData.user_id,
            title: "Payment Received! 💰",
            message: `Customer paid Rs.${Number(session.amount_total || 0) / 100} for their booking. Funds are held in escrow until job completion.`,
            type: "success",
            related_id: bookingId,
            related_type: "booking",
          });
        }

        // Notify customer
        const { data: bookingFull } = await supabase
          .from("bookings")
          .select("user_id")
          .eq("id", bookingId)
          .single();

        if (bookingFull) {
          await supabase.from("notifications").insert({
            user_id: bookingFull.user_id,
            title: "Payment Confirmed ✅",
            message: `Your payment of Rs.${Number(session.amount_total || 0) / 100} is secured in escrow. Funds will be released to the provider upon job completion.`,
            type: "success",
            related_id: bookingId,
            related_type: "booking",
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
