-- Fix search_path for trigger functions
CREATE OR REPLACE FUNCTION public.update_vehicle_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_compliant := (
    NEW.insurance_expiry >= CURRENT_DATE AND 
    NEW.inspection_expiry >= CURRENT_DATE AND 
    NEW.road_license_expiry >= CURRENT_DATE
  );
  
  IF NEW.is_compliant = false AND NEW.status = 'available' THEN
    NEW.status := 'unavailable';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_driver_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_compliant := (
    NEW.license_expiry >= CURRENT_DATE AND 
    NEW.ntsa_verified = true
  );
  
  IF NEW.is_compliant = false AND NEW.status = 'available' THEN
    NEW.status := 'unavailable';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;