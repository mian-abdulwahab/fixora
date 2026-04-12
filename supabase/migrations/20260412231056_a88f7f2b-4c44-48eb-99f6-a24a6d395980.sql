
-- Add escrow fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS worker_share numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_otp text,
  ADD COLUMN IF NOT EXISTS otp_generated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Add wallet fields to service_providers
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS withdrawable_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_balance numeric DEFAULT 0;

-- Create function to generate 4-digit OTP for booking completion
CREATE OR REPLACE FUNCTION public.generate_completion_otp(booking_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  otp text;
BEGIN
  -- Generate random 4-digit OTP
  otp := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  
  -- Update the booking with the OTP
  UPDATE public.bookings
  SET completion_otp = otp, otp_generated_at = NOW()
  WHERE id = booking_id
    AND status = 'in_progress'
    AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM service_providers WHERE id = bookings.provider_id AND user_id = auth.uid()
    ));
  
  RETURN otp;
END;
$$;

-- Create function to verify OTP and release funds
CREATE OR REPLACE FUNCTION public.verify_completion_otp(p_booking_id uuid, p_otp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  IF v_booking.status != 'in_progress' THEN
    RAISE EXCEPTION 'Booking is not in progress';
  END IF;
  
  IF v_booking.completion_otp IS NULL THEN
    RAISE EXCEPTION 'No OTP generated for this booking';
  END IF;
  
  IF v_booking.completion_otp != p_otp THEN
    RETURN false;
  END IF;
  
  -- OTP matches - mark as completed and release funds
  UPDATE public.bookings
  SET status = 'completed',
      escrow_status = 'released',
      completed_at = NOW(),
      completion_otp = NULL
  WHERE id = p_booking_id;
  
  -- Credit worker's withdrawable balance
  UPDATE public.service_providers
  SET withdrawable_balance = withdrawable_balance + v_booking.worker_share,
      pending_balance = GREATEST(pending_balance - v_booking.worker_share, 0)
  WHERE id = v_booking.provider_id;
  
  RETURN true;
END;
$$;

-- Create function for auto-release (called by edge function cron)
CREATE OR REPLACE FUNCTION public.auto_release_escrow()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released_count integer := 0;
  v_booking RECORD;
BEGIN
  FOR v_booking IN
    SELECT * FROM public.bookings
    WHERE status = 'completed'
      AND escrow_status = 'held'
      AND completed_at IS NOT NULL
      AND completed_at < NOW() - INTERVAL '24 hours'
  LOOP
    UPDATE public.bookings
    SET escrow_status = 'released'
    WHERE id = v_booking.id;
    
    UPDATE public.service_providers
    SET withdrawable_balance = withdrawable_balance + v_booking.worker_share,
        pending_balance = GREATEST(pending_balance - v_booking.worker_share, 0)
    WHERE id = v_booking.provider_id;
    
    released_count := released_count + 1;
  END LOOP;
  
  RETURN released_count;
END;
$$;
