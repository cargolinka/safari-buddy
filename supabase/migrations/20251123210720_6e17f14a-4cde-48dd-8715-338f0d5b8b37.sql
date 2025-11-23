-- Add suspension tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspension_notes TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_by ON public.profiles(suspended_by);

-- Add comments to explain the columns
COMMENT ON COLUMN public.profiles.suspension_reason IS 'Reason for account suspension (e.g., "Policy Violation", "Payment Issues")';
COMMENT ON COLUMN public.profiles.suspension_notes IS 'Detailed notes about the suspension';
COMMENT ON COLUMN public.profiles.suspended_at IS 'Timestamp when the account was suspended';
COMMENT ON COLUMN public.profiles.suspended_by IS 'Admin user ID who suspended the account';

-- Update the handle_owner_suspension function to track suspension details
CREATE OR REPLACE FUNCTION public.handle_owner_suspension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When owner is suspended, mark all their vehicles as unavailable
  IF NEW.account_status = 'suspended' AND OLD.account_status != 'suspended' THEN
    UPDATE public.vehicles
    SET status = 'unavailable'
    WHERE owner_id = NEW.id
    AND status != 'unavailable';
    
    RAISE NOTICE 'Marked vehicles as unavailable for suspended owner: %', NEW.id;
  END IF;
  
  -- When owner is activated, restore vehicles and clear suspension details
  IF NEW.account_status = 'active' AND OLD.account_status = 'suspended' THEN
    -- Restore compliant vehicles
    UPDATE public.vehicles
    SET status = 'available'
    WHERE owner_id = NEW.id
    AND is_compliant = true
    AND status = 'unavailable';
    
    -- Clear suspension tracking fields
    NEW.suspension_reason := NULL;
    NEW.suspension_notes := NULL;
    NEW.suspended_at := NULL;
    NEW.suspended_by := NULL;
    
    RAISE NOTICE 'Restored available status for compliant vehicles of owner: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;