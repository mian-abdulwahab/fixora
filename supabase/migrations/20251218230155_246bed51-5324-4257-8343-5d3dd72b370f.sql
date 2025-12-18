-- Allow admins to view all bookings (current policy only allows users to see their own)
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update any booking
CREATE POLICY "Admins can update any booking"
ON public.bookings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update any provider (current policy only allows owner)
CREATE POLICY "Admins can update any provider"
ON public.service_providers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));