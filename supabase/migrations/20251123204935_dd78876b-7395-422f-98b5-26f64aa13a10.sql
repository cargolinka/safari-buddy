-- Create hero_slides table
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  button_text TEXT NOT NULL,
  button_link TEXT NOT NULL,
  secondary_button_text TEXT,
  secondary_button_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public can view active slides
CREATE POLICY "Anyone can view active hero slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true);

-- Admins can manage all slides
CREATE POLICY "Admins can insert hero slides"
ON public.hero_slides
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero slides"
ON public.hero_slides
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero slides"
ON public.hero_slides
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hero-images bucket
CREATE POLICY "Anyone can view hero images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can upload hero images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial slides with current text
INSERT INTO public.hero_slides (title, subtitle, description, image_url, button_text, button_link, secondary_button_text, secondary_button_link, display_order, is_active)
VALUES 
  ('Adventure Awaits', 'Premium Safari Vehicle Hire', 'Explore the wild with our top-quality safari vehicles. Professional drivers and well-maintained fleet for your unforgettable journey.', '/src/assets/hero-safari.jpg', 'Browse Vehicles', '/vehicles', 'Learn More', '/about', 1, true),
  ('Discover the Wilderness', 'Reliable Safari Transportation', 'Experience nature like never before with our comfortable and safe safari vehicles. Book now and start your adventure.', '/src/assets/hero-safari-2.jpg', 'Browse Vehicles', '/vehicles', 'Learn More', '/about', 2, true),
  ('Your Journey Begins Here', 'Professional Safari Services', 'From luxury to rugged terrain vehicles, we have everything you need for the perfect safari experience.', '/src/assets/hero-safari-3.jpg', 'Browse Vehicles', '/vehicles', 'Learn More', '/about', 3, true);