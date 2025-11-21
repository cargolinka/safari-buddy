-- Add image_urls array column and migrate existing data
ALTER TABLE vehicles ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing single image_url to image_urls array
UPDATE vehicles 
SET image_urls = ARRAY[image_url]::text[]
WHERE image_url IS NOT NULL AND image_url != '';

-- Keep image_url for backward compatibility during transition
-- We'll deprecate it later once all code is updated