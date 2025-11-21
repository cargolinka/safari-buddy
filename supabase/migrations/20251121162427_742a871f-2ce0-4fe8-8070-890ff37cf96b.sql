-- Add index for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);