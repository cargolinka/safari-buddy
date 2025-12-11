-- Add minimum advance booking days column to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN min_advance_booking_days integer NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.vehicles.min_advance_booking_days IS 'Minimum days in advance required for booking. 0 = real-time/same-day booking allowed.';