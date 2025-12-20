import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminKey, userId } = await req.json();
    const storedKey = Deno.env.get("ADMIN_REGISTRATION_KEY");

    if (!storedKey) {
      console.error("ADMIN_REGISTRATION_KEY not configured");
      return new Response(
        JSON.stringify({ valid: false, error: "Admin registration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = adminKey === storedKey;

    if (!isValid) {
      console.log("Invalid admin key provided");
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If userId is provided and key is valid, assign admin role server-side
    if (userId && isValid) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Insert admin role into user_roles table
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: userId, role: "admin" },
          { onConflict: "user_id,role" }
        );
      
      if (roleError) {
        console.error("Error assigning admin role:", roleError);
        return new Response(
          JSON.stringify({ valid: true, roleAssigned: false, error: roleError.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Admin role assigned successfully for user:", userId);
      return new Response(
        JSON.stringify({ valid: true, roleAssigned: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ valid: isValid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in verify-admin-key:", message);
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
