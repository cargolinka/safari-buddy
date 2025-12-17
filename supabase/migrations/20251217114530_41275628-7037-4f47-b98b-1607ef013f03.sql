-- Add is_active column to vehicle_categories for publish/hide functionality
ALTER TABLE public.vehicle_categories
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for filtering active categories
CREATE INDEX idx_vehicle_categories_is_active ON public.vehicle_categories(is_active);