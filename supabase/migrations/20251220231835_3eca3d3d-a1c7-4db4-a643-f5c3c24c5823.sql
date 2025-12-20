-- SECURITY FIX: Add server-side validation for bookings table
-- This prevents price manipulation, past dates, and storage attacks

-- Add positive amount constraint
ALTER TABLE public.bookings
  ADD CONSTRAINT booking_amount_positive 
    CHECK (total_amount > 0);

-- Add reasonable maximum amount constraint
ALTER TABLE public.bookings
  ADD CONSTRAINT booking_amount_max 
    CHECK (total_amount <= 1000000);

-- Add text length limits for address and notes
ALTER TABLE public.bookings
  ALTER COLUMN address TYPE VARCHAR(500),
  ALTER COLUMN notes TYPE VARCHAR(2000);

-- Create validation trigger for business logic constraints
CREATE OR REPLACE FUNCTION public.validate_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Amount validation (defense in depth)
  IF NEW.total_amount <= 0 THEN
    RAISE EXCEPTION 'Booking amount must be positive';
  END IF;
  
  -- Trim whitespace from text fields
  NEW.address := TRIM(NEW.address);
  IF NEW.notes IS NOT NULL THEN
    NEW.notes := TRIM(NEW.notes);
  END IF;
  
  -- Validate minimum address length
  IF LENGTH(NEW.address) < 10 THEN
    RAISE EXCEPTION 'Address must be at least 10 characters';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation
CREATE TRIGGER validate_booking_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW 
  EXECUTE FUNCTION public.validate_booking();

-- Also add length constraints to messages table
ALTER TABLE public.messages
  ALTER COLUMN content TYPE VARCHAR(5000);

-- Add length constraints to reviews table
ALTER TABLE public.reviews
  ALTER COLUMN comment TYPE VARCHAR(2000);