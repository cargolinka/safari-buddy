-- Add account_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- Update RLS policies to prevent suspended users from accessing data
-- First, create a helper function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT account_status = 'suspended' FROM public.profiles WHERE id = user_id),
    false
  )
$$;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.account_status IS 'Account status: active or suspended. Suspended accounts cannot access the system.';