-- Create OTP verification table
CREATE TABLE public.email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Users can only view their own OTPs
CREATE POLICY "Users can view their own OTPs"
ON public.email_otps
FOR SELECT
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_email_otps_user_email ON public.email_otps(user_id, email);
CREATE INDEX idx_email_otps_expires ON public.email_otps(expires_at);