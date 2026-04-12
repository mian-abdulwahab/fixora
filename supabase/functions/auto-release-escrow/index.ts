import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Call the database function to auto-release escrow
    const { data, error } = await supabase.rpc("auto_release_escrow");

    if (error) throw error;

    // Notify workers whose funds were released
    const { data: releasedBookings } = await supabase
      .from("bookings")
      .select("id, provider_id, worker_share, service_providers!inner(user_id)")
      .eq("escrow_status", "released")
      .not("completed_at", "is", null)
      .gte("completed_at", new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
      .lte("completed_at", new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString());

    if (releasedBookings) {
      for (const booking of releasedBookings) {
        const providerUserId = (booking as any).service_providers?.user_id;
        if (providerUserId) {
          await supabase.from("notifications").insert({
            user_id: providerUserId,
            title: "Funds Released! 🎉",
            message: `Rs.${Number(booking.worker_share).toLocaleString()} has been added to your withdrawable balance.`,
            type: "success",
            related_id: booking.id,
            related_type: "booking",
          });
        }
      }
    }

    return new Response(JSON.stringify({ released: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
