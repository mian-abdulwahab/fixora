-- SECURITY FIX: Restrict profile access to authenticated users only
-- The current policy "Authenticated users can view other profiles names" uses USING(true)
-- which exposes all PII to unauthenticated users

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view other profiles names" ON public.profiles;

-- Create a new policy that actually requires authentication
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);