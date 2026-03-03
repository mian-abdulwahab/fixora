-- Allow providers to also create disputes
CREATE POLICY "Providers can create disputes"
ON public.disputes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_providers
    WHERE service_providers.id = disputes.provider_id
    AND service_providers.user_id = auth.uid()
  )
);