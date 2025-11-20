-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'driver', 'client_individual', 'client_corporate');
CREATE TYPE public.vehicle_type AS ENUM ('land_cruiser', 'tour_van', 'bus', 'saloon');
CREATE TYPE public.vehicle_status AS ENUM ('available', 'booked', 'maintenance', 'unavailable');
CREATE TYPE public.driver_status AS ENUM ('available', 'on_trip', 'unavailable');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.document_type AS ENUM ('insurance', 'inspection', 'road_license', 'logbook', 'driver_license', 'ntsa_verification');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type vehicle_type NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  features TEXT[] DEFAULT '{}',
  daily_rate DECIMAL(10,2) NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'available',
  insurance_expiry DATE NOT NULL,
  inspection_expiry DATE NOT NULL,
  road_license_expiry DATE NOT NULL,
  is_compliant BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view available compliant vehicles"
  ON public.vehicles FOR SELECT
  USING (status = 'available' AND is_compliant = true);

CREATE POLICY "Owners can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to update vehicle compliance status
CREATE OR REPLACE FUNCTION public.update_vehicle_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_compliant := (
    NEW.insurance_expiry >= CURRENT_DATE AND 
    NEW.inspection_expiry >= CURRENT_DATE AND 
    NEW.road_license_expiry >= CURRENT_DATE
  );
  
  -- Auto-mark as unavailable if not compliant
  IF NEW.is_compliant = false AND NEW.status = 'available' THEN
    NEW.status := 'unavailable';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_vehicle_compliance
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_compliance();

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  ntsa_verified BOOLEAN DEFAULT false,
  status driver_status NOT NULL DEFAULT 'available',
  is_compliant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can insert their own profile"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Drivers can update their own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage drivers"
  ON public.drivers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to update driver compliance status
CREATE OR REPLACE FUNCTION public.update_driver_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_compliant := (
    NEW.license_expiry >= CURRENT_DATE AND 
    NEW.ntsa_verified = true
  );
  
  -- Auto-mark as unavailable if not compliant
  IF NEW.is_compliant = false AND NEW.status = 'available' THEN
    NEW.status := 'unavailable';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_driver_compliance
  BEFORE INSERT OR UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_compliance();

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  pickup_date DATE NOT NULL,
  dropoff_date DATE NOT NULL,
  destination TEXT NOT NULL,
  with_driver BOOLEAN NOT NULL DEFAULT false,
  status booking_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view their assigned bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Vehicle owners can view bookings for their vehicles"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = bookings.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  document_type document_type NOT NULL,
  file_path TEXT NOT NULL,
  expiry_date DATE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (
    (entity_type = 'vehicle' AND EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = documents.entity_id
      AND vehicles.owner_id = auth.uid()
    )) OR
    (entity_type = 'driver' AND entity_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    (entity_type = 'vehicle' AND EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = documents.entity_id
      AND vehicles.owner_id = auth.uid()
    )) OR
    (entity_type = 'driver' AND entity_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();