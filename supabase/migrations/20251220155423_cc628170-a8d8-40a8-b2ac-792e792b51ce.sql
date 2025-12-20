-- Ensure provider total_jobs is always a valid number
ALTER TABLE public.service_providers
  ALTER COLUMN total_jobs SET DEFAULT 0;

UPDATE public.service_providers sp
SET total_jobs = COALESCE(t.completed_jobs, 0)
FROM (
  SELECT provider_id,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed_jobs
  FROM public.bookings
  GROUP BY provider_id
) t
WHERE sp.id = t.provider_id;

UPDATE public.service_providers
SET total_jobs = 0
WHERE total_jobs IS NULL;

ALTER TABLE public.service_providers
  ALTER COLUMN total_jobs SET NOT NULL;

-- Keep provider total_jobs in sync whenever bookings change
CREATE OR REPLACE FUNCTION public.sync_provider_total_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    pid := OLD.provider_id;

    IF pid IS NOT NULL THEN
      UPDATE public.service_providers
      SET total_jobs = (
        SELECT COUNT(*)
        FROM public.bookings
        WHERE provider_id = pid
          AND status = 'completed'
      )
      WHERE id = pid;
    END IF;

    RETURN OLD;
  END IF;

  -- INSERT or UPDATE
  pid := NEW.provider_id;
  IF pid IS NOT NULL THEN
    UPDATE public.service_providers
    SET total_jobs = (
      SELECT COUNT(*)
      FROM public.bookings
      WHERE provider_id = pid
        AND status = 'completed'
    )
    WHERE id = pid;
  END IF;

  -- If provider_id changed on UPDATE, also sync the old provider
  IF TG_OP = 'UPDATE' AND OLD.provider_id IS DISTINCT FROM NEW.provider_id THEN
    pid := OLD.provider_id;

    IF pid IS NOT NULL THEN
      UPDATE public.service_providers
      SET total_jobs = (
        SELECT COUNT(*)
        FROM public.bookings
        WHERE provider_id = pid
          AND status = 'completed'
      )
      WHERE id = pid;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_provider_total_jobs_on_bookings ON public.bookings;

CREATE TRIGGER sync_provider_total_jobs_on_bookings
AFTER INSERT OR UPDATE OF status, provider_id OR DELETE
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.sync_provider_total_jobs();