-- Fix 1: Secure the notifications table INSERT policy
-- Remove the permissive INSERT policy that allows anyone to create notifications for anyone

DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;

-- No INSERT policy for authenticated users means only service role (edge functions) can insert
-- This prevents users from creating fake notifications for other users

-- Fix 2: Restrict public access to service_providers
-- Remove the overly permissive SELECT policy and create more restrictive ones

DROP POLICY IF EXISTS "Service providers are viewable by everyone" ON public.service_providers;

-- Public can only see approved, verified, and active providers with limited exposure
-- Note: RLS cannot filter columns, but it can filter rows
-- Sensitive data (email, phone, application_status, rejection_reason) will be filtered in application code
CREATE POLICY "Public can view approved active providers"
ON public.service_providers
FOR SELECT
USING (
  application_status = 'approved' 
  AND verified = true 
  AND is_active = true
);

-- Providers can view their own full record
CREATE POLICY "Providers can view own full record"
ON public.service_providers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all providers (already exists but ensure it's there)
-- The existing "Admins can update any provider" policy is for UPDATE only
-- Add SELECT for admins
CREATE POLICY "Admins can view all providers"
ON public.service_providers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));