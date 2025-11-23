-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false);

-- RLS policies for company documents bucket
CREATE POLICY "Companies can upload their documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Companies can view their documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all company documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update company documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);