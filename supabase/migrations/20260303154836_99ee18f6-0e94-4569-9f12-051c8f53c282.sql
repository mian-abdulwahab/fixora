
-- 1. Booking status history table for real-time tracking
CREATE TABLE public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view status history"
ON public.booking_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_status_history.booking_id
    AND (bookings.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = bookings.provider_id
      AND service_providers.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Booking participants can insert status history"
ON public.booking_status_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_status_history.booking_id
    AND (bookings.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = bookings.provider_id
      AND service_providers.user_id = auth.uid()
    ))
  )
);

-- Admin can view all status history
CREATE POLICY "Admins can view all status history"
ON public.booking_status_history FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add payment fields to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_receipt_url text;

-- 3. Add sub-ratings to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS punctuality_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS quality_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS value_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS communication_rating integer;

-- 4. Create payment receipts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view payment receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

-- 5. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (booking_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_status_change_trigger
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

-- 6. Enable realtime for status history
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_status_history;
