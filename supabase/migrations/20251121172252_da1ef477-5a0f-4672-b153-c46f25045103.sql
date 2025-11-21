-- Add TSV/PSV licence expiry date column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN tsv_psv_licence_expiry date;

-- Update the compliance check trigger to include TSV/PSV licence
CREATE OR REPLACE FUNCTION public.update_vehicle_compliance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.is_compliant := (
    NEW.insurance_expiry >= CURRENT_DATE AND 
    NEW.inspection_expiry >= CURRENT_DATE AND 
    NEW.road_license_expiry >= CURRENT_DATE AND
    (NEW.tsv_psv_licence_expiry IS NULL OR NEW.tsv_psv_licence_expiry >= CURRENT_DATE)
  );
  
  IF NEW.is_compliant = false AND NEW.status = 'available' THEN
    NEW.status := 'unavailable';
  END IF;
  
  RETURN NEW;
END;
$$;