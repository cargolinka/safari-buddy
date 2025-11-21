-- Create vehicle_categories table
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon_name text NOT NULL DEFAULT 'Car',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vehicle_categories
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view categories
CREATE POLICY "Anyone can view vehicle categories"
ON public.vehicle_categories
FOR SELECT
USING (true);

-- Only admins can insert categories
CREATE POLICY "Admins can insert vehicle categories"
ON public.vehicle_categories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update categories
CREATE POLICY "Admins can update vehicle categories"
ON public.vehicle_categories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete categories
CREATE POLICY "Admins can delete vehicle categories"
ON public.vehicle_categories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed with existing vehicle types
INSERT INTO public.vehicle_categories (slug, name, description, icon_name)
VALUES 
  ('land_cruiser', 'Land Cruiser', 'Robust 4x4 for safari adventures', 'Car'),
  ('tour_van', 'Tour Van', 'Spacious vans for group tours', 'Truck'),
  ('bus', 'Bus', 'Large capacity for big groups', 'Bus'),
  ('saloon', 'Saloon', 'Comfortable sedans for city travel', 'Home')
ON CONFLICT (slug) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_vehicle_categories_updated_at
BEFORE UPDATE ON public.vehicle_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add policy for admins to insert vehicles with any owner_id
CREATE POLICY "Admins can insert vehicles for any owner"
ON public.vehicles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));