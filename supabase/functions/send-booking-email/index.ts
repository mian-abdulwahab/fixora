import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    const { type, bookingId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        services:service_id(title, price),
        service_providers:provider_id(business_name, email)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Fetch customer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", booking.user_id)
      .single();

    const customerEmail = profile?.email;
    const customerName = profile?.name || "Customer";
    const serviceName = booking.services?.title || "Service";
    const providerName = booking.service_providers?.business_name || "Provider";
    const scheduledDate = booking.scheduled_date;
    const scheduledTime = booking.scheduled_time;
    const amount = booking.total_amount;

    if (!customerEmail) {
      throw new Error("Customer email not found");
    }

    let subject = "";
    let htmlContent = "";

    const baseStyle = `
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 30px;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    `;

    const headerStyle = `
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #0d9488;
      margin-bottom: 24px;
    `;

    const buttonStyle = `
      display: inline-block;
      padding: 12px 32px;
      background-color: #0d9488;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 16px;
    `;

    switch (type) {
      case "booking_confirmation":
        subject = `✅ Booking Confirmed - ${serviceName}`;
        htmlContent = `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #0d9488; margin: 0; font-size: 24px;">🔧 Fixora</h1>
            </div>
            <h2 style="color: #1f2937;">Booking Confirmed! 🎉</h2>
            <p style="color: #6b7280;">Hi ${customerName},</p>
            <p style="color: #6b7280;">Your booking has been confirmed. Here are the details:</p>
            <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0; color: #1f2937;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Provider:</strong> ${providerName}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Date:</strong> ${scheduledDate}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Time:</strong> ${scheduledTime}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Amount:</strong> Rs. ${amount}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Payment:</strong> ${booking.payment_method || 'Cash'}</p>
            </div>
            <p style="color: #6b7280;">The provider will arrive at your scheduled time. Thank you for choosing Fixora!</p>
          </div>
        `;
        break;

      case "booking_reminder":
        subject = `⏰ Reminder: ${serviceName} Tomorrow`;
        htmlContent = `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #0d9488; margin: 0; font-size: 24px;">🔧 Fixora</h1>
            </div>
            <h2 style="color: #1f2937;">Booking Reminder ⏰</h2>
            <p style="color: #6b7280;">Hi ${customerName},</p>
            <p style="color: #6b7280;">This is a friendly reminder that your service is scheduled for <strong>tomorrow</strong>.</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0; color: #1f2937;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Provider:</strong> ${providerName}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Date:</strong> ${scheduledDate}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Time:</strong> ${scheduledTime}</p>
            </div>
            <p style="color: #6b7280;">Please make sure you're available at the scheduled time. See you tomorrow!</p>
          </div>
        `;
        break;

      case "booking_completed":
        subject = `✨ Service Completed - ${serviceName}`;
        htmlContent = `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #0d9488; margin: 0; font-size: 24px;">🔧 Fixora</h1>
            </div>
            <h2 style="color: #1f2937;">Service Completed! ✨</h2>
            <p style="color: #6b7280;">Hi ${customerName},</p>
            <p style="color: #6b7280;">Your service has been completed. Here's your receipt:</p>
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 16px 0; border: 1px solid #a7f3d0;">
              <p style="margin: 8px 0; color: #1f2937;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Provider:</strong> ${providerName}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Date:</strong> ${scheduledDate}</p>
              <p style="margin: 8px 0; color: #1f2937; font-size: 18px;"><strong>Total Paid:</strong> Rs. ${amount}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Payment Method:</strong> ${booking.payment_method || 'Cash'}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Status:</strong> ✅ Completed</p>
            </div>
            <p style="color: #6b7280;">We'd love to hear about your experience! Please leave a review for ${providerName}.</p>
            <p style="color: #6b7280; margin-top: 16px;">Thank you for choosing Fixora! 🙏</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Send via SendGrid
    const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: customerEmail, name: customerName }] }],
        from: { email: "mianawphenomenal@gmail.com", name: "Fixora" },
        subject,
        content: [{ type: "text/html", value: htmlContent }],
      }),
    });

    if (!sgResponse.ok) {
      const errorText = await sgResponse.text();
      throw new Error(`SendGrid error [${sgResponse.status}]: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `${type} email sent` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
