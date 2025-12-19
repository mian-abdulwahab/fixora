-- Add application_status column to service_providers for verification workflow
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected'));

-- Add rejection_reason column for admin feedback
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing providers to be approved if they are verified
UPDATE public.service_providers 
SET application_status = 'approved' 
WHERE verified = true;

-- Create index for faster queries on application status
CREATE INDEX IF NOT EXISTS idx_service_providers_application_status 
ON public.service_providers(application_status);

-- Make sure only approved providers are visible to customers
-- This is enforced at the application level by checking is_active AND verified