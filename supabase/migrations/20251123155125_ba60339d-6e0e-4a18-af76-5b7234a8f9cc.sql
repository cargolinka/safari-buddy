-- Add country column to profiles table
ALTER TABLE public.profiles
ADD COLUMN country text;

-- Add index for country filtering
CREATE INDEX idx_profiles_country ON public.profiles(country);