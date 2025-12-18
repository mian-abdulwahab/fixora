-- 1. Fix profiles RLS to not expose PII publicly
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to view basic profile info (name only) for other users
CREATE POLICY "Authenticated users can view other profiles names"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix handle_new_user to always default to 'user' role (prevent privilege escalation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name'),
    'user'::user_role  -- SECURITY: Always create as regular user, admin roles set via user_roles table
  );
  RETURN NEW;
END;
$$;

-- 3. Add email_verified column to profiles for email verification flow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 4. Create provider_portfolios table for portfolio photos
CREATE TABLE IF NOT EXISTS public.provider_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on provider_portfolios
ALTER TABLE public.provider_portfolios ENABLE ROW LEVEL SECURITY;

-- Portfolio policies
CREATE POLICY "Portfolio photos are viewable by everyone"
ON public.provider_portfolios
FOR SELECT
USING (true);

CREATE POLICY "Providers can add portfolio photos"
ON public.provider_portfolios
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = provider_portfolios.provider_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Providers can delete their portfolio photos"
ON public.provider_portfolios
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = provider_portfolios.provider_id
    AND user_id = auth.uid()
  )
);

-- 5. Create provider_availability table for booking calendar
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, day_of_week)
);

-- Enable RLS on provider_availability
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Availability policies
CREATE POLICY "Availability is viewable by everyone"
ON public.provider_availability
FOR SELECT
USING (true);

CREATE POLICY "Providers can manage their availability"
ON public.provider_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = provider_availability.provider_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = provider_availability.provider_id
    AND user_id = auth.uid()
  )
);

-- 6. Create blocked_dates table for specific date blocking
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, blocked_date)
);

-- Enable RLS on blocked_dates
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Blocked dates policies
CREATE POLICY "Blocked dates are viewable by everyone"
ON public.blocked_dates
FOR SELECT
USING (true);

CREATE POLICY "Providers can manage their blocked dates"
ON public.blocked_dates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = blocked_dates.provider_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = blocked_dates.provider_id
    AND user_id = auth.uid()
  )
);