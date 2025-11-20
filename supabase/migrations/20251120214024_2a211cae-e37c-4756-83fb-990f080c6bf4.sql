-- Create storage buckets for vehicle images and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vehicle-images', 'vehicle-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vehicle-documents', 'vehicle-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('driver-documents', 'driver-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']);

-- RLS policies for vehicle-images bucket (public read, owner write)
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Vehicle owners can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Vehicle owners can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-images' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Vehicle owners can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-images' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

-- RLS policies for vehicle-documents bucket (owner and admin only)
CREATE POLICY "Vehicle owners can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vehicle-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Vehicle owners can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Vehicle owners can update their documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Vehicle owners can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

-- RLS policies for driver-documents bucket (driver and admin only)
CREATE POLICY "Drivers can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driver-documents' AND
  (auth.uid() = (name::text)::uuid OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Drivers can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Drivers can update their documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'driver-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Drivers can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'driver-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

-- Add image_url column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url text;