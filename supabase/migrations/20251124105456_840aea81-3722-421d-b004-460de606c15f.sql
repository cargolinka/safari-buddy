-- Create vehicle subcategories table
CREATE TABLE IF NOT EXISTS public.vehicle_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.vehicle_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT DEFAULT 'Car',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view vehicle subcategories"
ON public.vehicle_subcategories
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert vehicle subcategories"
ON public.vehicle_subcategories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update vehicle subcategories"
ON public.vehicle_subcategories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vehicle subcategories"
ON public.vehicle_subcategories
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_vehicle_subcategories_updated_at
BEFORE UPDATE ON public.vehicle_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add subcategory_id to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.vehicle_subcategories(id) ON DELETE SET NULL;

-- Insert some sample subcategories for each vehicle type
INSERT INTO public.vehicle_subcategories (category_id, name, slug, description, icon_name)
SELECT 
  vc.id,
  'Standard',
  vc.slug || '-standard',
  'Standard ' || vc.name || ' for everyday use',
  vc.icon_name
FROM public.vehicle_categories vc
WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_subcategories WHERE slug = vc.slug || '-standard');

INSERT INTO public.vehicle_subcategories (category_id, name, slug, description, icon_name)
SELECT 
  vc.id,
  'Premium',
  vc.slug || '-premium',
  'Premium ' || vc.name || ' with luxury features',
  vc.icon_name
FROM public.vehicle_categories vc
WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_subcategories WHERE slug = vc.slug || '-premium');

INSERT INTO public.vehicle_subcategories (category_id, name, slug, description, icon_name)
SELECT 
  vc.id,
  'Extended',
  vc.slug || '-extended',
  'Extended ' || vc.name || ' with more capacity',
  vc.icon_name
FROM public.vehicle_categories vc
WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_subcategories WHERE slug = vc.slug || '-extended');