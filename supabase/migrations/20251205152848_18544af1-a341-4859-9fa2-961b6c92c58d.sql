-- Add image position columns to hero_slides table
ALTER TABLE public.hero_slides 
ADD COLUMN image_position_x integer NOT NULL DEFAULT 50,
ADD COLUMN image_position_y integer NOT NULL DEFAULT 50;

-- Add check constraints for valid percentage range
ALTER TABLE public.hero_slides
ADD CONSTRAINT hero_slides_image_position_x_check CHECK (image_position_x >= 0 AND image_position_x <= 100),
ADD CONSTRAINT hero_slides_image_position_y_check CHECK (image_position_y >= 0 AND image_position_y <= 100);