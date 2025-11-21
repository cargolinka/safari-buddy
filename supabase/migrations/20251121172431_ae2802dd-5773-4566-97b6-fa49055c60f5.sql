-- Add registration number column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN registration_number text UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_vehicles_registration_number ON vehicles(registration_number);