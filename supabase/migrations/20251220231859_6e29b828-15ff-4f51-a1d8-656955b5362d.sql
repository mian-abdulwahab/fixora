-- SECURITY FIX: Add complete RLS protection for email_otps table
-- Currently only SELECT policy exists, allowing potential manipulation

-- Deny user INSERT (only service role via Edge Functions can insert)
CREATE POLICY "Only service role can insert OTPs"
ON public.email_otps
FOR INSERT
WITH CHECK (false);

-- Deny user UPDATE (only service role via Edge Functions can update)
CREATE POLICY "Only service role can update OTPs"
ON public.email_otps
FOR UPDATE
USING (false);

-- Deny user DELETE (only service role via Edge Functions can delete)
CREATE POLICY "Only service role can delete OTPs"
ON public.email_otps
FOR DELETE
USING (false);

-- Note: Service role operations (used by Edge Functions) bypass RLS
-- so send-otp and verify-otp will continue to work