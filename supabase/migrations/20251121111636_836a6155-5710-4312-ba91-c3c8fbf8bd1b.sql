-- Update profiles table for entity types and company info
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS entity_type TEXT CHECK (entity_type IN ('individual', 'company')),
ADD COLUMN IF NOT EXISTS company_registration_number TEXT,
ADD COLUMN IF NOT EXISTS company_pin TEXT,
ADD COLUMN IF NOT EXISTS is_fleet_owner BOOLEAN DEFAULT false;

-- Update drivers table for enhanced information
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS ntsa_badge_number TEXT,
ADD COLUMN IF NOT EXISTS is_vehicle_owner BOOLEAN DEFAULT false;

-- Create company_directors table
CREATE TABLE IF NOT EXISTS company_directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE company_directors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can insert directors"
ON company_directors FOR INSERT
WITH CHECK (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can view their directors"
ON company_directors FOR SELECT
USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can update their directors"
ON company_directors FOR UPDATE
USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can delete their directors"
ON company_directors FOR DELETE
USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Create driver_vehicle_assignments table for authorized drivers
CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fleet_owner_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  permissions JSONB DEFAULT '{"can_add_vehicles": false, "can_edit_vehicles": false, "can_view_earnings": false, "can_manage_drivers": false}'::jsonb,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(driver_id, vehicle_id)
);

ALTER TABLE driver_vehicle_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fleet owners can create assignments"
ON driver_vehicle_assignments FOR INSERT
WITH CHECK (fleet_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Fleet owners and drivers can view assignments"
ON driver_vehicle_assignments FOR SELECT
USING (
  fleet_owner_id = auth.uid() 
  OR driver_id IN (SELECT id FROM drivers WHERE id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Fleet owners can update assignments"
ON driver_vehicle_assignments FOR UPDATE
USING (fleet_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Drivers can update their assignment status"
ON driver_vehicle_assignments FOR UPDATE
USING (driver_id IN (SELECT id FROM drivers WHERE id = auth.uid()));

CREATE POLICY "Fleet owners can delete assignments"
ON driver_vehicle_assignments FOR DELETE
USING (fleet_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Create company_documents table
CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('registration_certificate', 'pin_certificate', 'business_license')),
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by_admin BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can insert their documents"
ON company_documents FOR INSERT
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Companies and admins can view documents"
ON company_documents FOR SELECT
USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents"
ON company_documents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent companies from being assigned driver role
CREATE OR REPLACE FUNCTION check_company_driver_constraint()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entity_type = 'company' THEN
    IF EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = NEW.id AND role = 'driver'::app_role
    ) THEN
      RAISE EXCEPTION 'Companies cannot register as drivers';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_company_driver ON profiles;
CREATE TRIGGER prevent_company_driver
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_company_driver_constraint();