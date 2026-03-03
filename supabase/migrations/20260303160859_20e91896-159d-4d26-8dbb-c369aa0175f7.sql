
-- Disputes table for customer complaints with admin mediation
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.service_providers(id),
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  admin_notes text,
  resolution text,
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their disputes" ON public.disputes
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create disputes" ON public.disputes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update disputes" ON public.disputes
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Providers can view disputes about them
CREATE POLICY "Providers can view their disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE service_providers.id = disputes.provider_id
    AND service_providers.user_id = auth.uid()
  ));

-- Referral system
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referral_code text NOT NULL,
  credits_earned numeric DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(referred_id)
);

CREATE TABLE public.referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL,
  description text,
  referral_id uuid REFERENCES public.referrals(id),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create referral code" ON public.referral_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "Users can view own credits" ON public.referral_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can view all referral data
CREATE POLICY "Admins can view all referral codes" ON public.referral_codes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage referral credits" ON public.referral_credits
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
