-- Create driver requirements table for configurable requirements
CREATE TABLE public.driver_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT NOT NULL DEFAULT 'certification', -- certification, document, qualification
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active requirements"
ON public.driver_requirements
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert requirements"
ON public.driver_requirements
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requirements"
ON public.driver_requirements
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete requirements"
ON public.driver_requirements
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_driver_requirements_updated_at
BEFORE UPDATE ON public.driver_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some default requirements
INSERT INTO public.driver_requirements (name, description, requirement_type, is_mandatory) VALUES
('Valid Driver License', 'Must have a valid driving license', 'document', true),
('NTSA Badge', 'National Transport and Safety Authority badge', 'document', true),
('National ID', 'Valid national identification document', 'document', true),
('First Aid Certificate', 'Basic first aid training certification', 'certification', false),
('Tour Guide License', 'Licensed tour guide certification', 'certification', false),
('Commercial Driver License', 'CDL for commercial vehicle operation', 'certification', false),
('Defensive Driving Course', 'Completed defensive driving training', 'qualification', false);