-- Create empty legs table
CREATE TABLE public.empty_legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  discounted_rate NUMERIC NOT NULL,
  seats_available INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('available', 'booked', 'expired', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.empty_legs ENABLE ROW LEVEL SECURITY;

-- Drivers can create their own empty legs
CREATE POLICY "Drivers can create empty legs"
ON public.empty_legs
FOR INSERT
TO authenticated
WITH CHECK (
  driver_id IN (SELECT id FROM drivers WHERE id = auth.uid())
);

-- Drivers can view and update their own empty legs
CREATE POLICY "Drivers can manage their empty legs"
ON public.empty_legs
FOR ALL
TO authenticated
USING (
  driver_id IN (SELECT id FROM drivers WHERE id = auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Clients can view available empty legs
CREATE POLICY "Clients can view available empty legs"
ON public.empty_legs
FOR SELECT
TO authenticated
USING (status = 'available' AND departure_date >= CURRENT_DATE);

-- Admins can manage all empty legs
CREATE POLICY "Admins can manage all empty legs"
ON public.empty_legs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_empty_legs_updated_at
BEFORE UPDATE ON public.empty_legs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_empty_legs_driver ON public.empty_legs(driver_id);
CREATE INDEX idx_empty_legs_vehicle ON public.empty_legs(vehicle_id);
CREATE INDEX idx_empty_legs_departure ON public.empty_legs(departure_date);
CREATE INDEX idx_empty_legs_status ON public.empty_legs(status);