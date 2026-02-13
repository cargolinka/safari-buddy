
-- Add new columns to bid_requests
ALTER TABLE public.bid_requests 
  ADD COLUMN dropoff_location text,
  ADD COLUMN daily_itinerary jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN inclusives text[] DEFAULT '{}'::text[],
  ADD COLUMN general_comments text;

-- Remove with_driver default requirement (keep column for backward compat but default true)
COMMENT ON COLUMN public.bid_requests.with_driver IS 'Deprecated - all hires are chauffeur driven';
