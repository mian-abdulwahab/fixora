-- Add experience and skills columns to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_service_providers_application_status ON public.service_providers(application_status);
CREATE INDEX IF NOT EXISTS idx_service_providers_verified ON public.service_providers(verified);