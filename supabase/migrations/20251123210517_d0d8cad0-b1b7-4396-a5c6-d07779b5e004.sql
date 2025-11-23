-- Create function to update vehicle status when owner is suspended/activated
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
  
  -- When owner is activated, restore vehicles to available only if they are compliant
  IF NEW.account_status = 'active' AND OLD.account_status = 'suspended' THEN
    UPDATE public.vehicles
    SET status = 'available'
    WHERE owner_id = NEW.id
    AND is_compliant = true
    AND status = 'unavailable';
    
    RAISE NOTICE 'Restored available status for compliant vehicles of owner: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_owner_suspension ON public.profiles;
CREATE TRIGGER trigger_owner_suspension
  AFTER UPDATE OF account_status ON public.profiles
  FOR EACH ROW
  WHEN (OLD.account_status IS DISTINCT FROM NEW.account_status)
  EXECUTE FUNCTION public.handle_owner_suspension();

-- Add comment to explain the trigger
COMMENT ON FUNCTION public.handle_owner_suspension() IS 'Automatically updates vehicle availability when fleet owner account status changes. Suspended owners have all vehicles marked unavailable. Reactivated owners have compliant vehicles restored to available.';