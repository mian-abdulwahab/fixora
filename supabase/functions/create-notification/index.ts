import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type?: string;
  relatedId?: string;
  relatedType?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the user's JWT to verify they're authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const body: NotificationRequest = await req.json();
    const { userId, title, message, type, relatedId, relatedType } = body;

    // Validate required fields
    if (!userId || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate title and message length
    if (title.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Title must be 200 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Message must be 1000 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization check: The caller must be related to the notification context
    // This prevents arbitrary users from sending notifications to anyone
    // Valid scenarios:
    // 1. Booking-related notifications: caller must be part of the booking
    // 2. System notifications: only through edge functions (this one)
    
    if (relatedType === 'booking' && relatedId) {
      // Verify the caller is related to this booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('user_id, provider_id')
        .eq('id', relatedId)
        .single();

      if (bookingError || !booking) {
        console.error('Booking not found:', bookingError);
        return new Response(
          JSON.stringify({ error: 'Related booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the provider's user_id
      const { data: provider } = await supabase
        .from('service_providers')
        .select('user_id')
        .eq('id', booking.provider_id)
        .single();

      const providerUserId = provider?.user_id;

      // Check if caller is either the customer or the provider of this booking
      const isCustomer = booking.user_id === user.id;
      const isProvider = providerUserId === user.id;
      
      if (!isCustomer && !isProvider) {
        console.error('Unauthorized: User not related to booking');
        return new Response(
          JSON.stringify({ error: 'You are not authorized to send notifications for this booking' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the target user is also related to this booking
      const validTargets = [booking.user_id, providerUserId].filter(Boolean);
      if (!validTargets.includes(userId)) {
        console.error('Invalid target: User not related to booking');
        return new Response(
          JSON.stringify({ error: 'Target user is not related to this booking' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert the notification using service role (bypasses RLS)
    const { data, error } = await supabase.from('notifications').insert({
      user_id: userId,
      title: title.trim(),
      message: message.trim(),
      type: type || 'info',
      related_id: relatedId || null,
      related_type: relatedType || null,
    }).select().single();

    if (error) {
      console.error('Failed to create notification:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Notification created: ${data.id} for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
