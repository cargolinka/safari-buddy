-- Drop the existing foreign key constraint that references auth.users
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_owner_id_fkey;

-- Add new foreign key constraint that references profiles(id)
ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Create index on owner_id for query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);