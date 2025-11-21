-- Add image_url column to vehicle_categories table
ALTER TABLE vehicle_categories ADD COLUMN image_url text;

-- Create storage bucket for category images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for category images
CREATE POLICY "Category images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));