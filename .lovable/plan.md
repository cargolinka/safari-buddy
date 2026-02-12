

## Database Migration Plan for Your New Supabase Project

You need to run the following SQL in your new Supabase project's SQL Editor (Dashboard > SQL Editor). The entire database schema has been consolidated from 40 migration files into a single script you can run in order.

### How to Execute

1. Go to your new Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL below in **3 parts** (to avoid timeout issues with large scripts)

---

### Part 1: ENUMs, Functions, and Core Tables

Run this first - it creates all types, utility functions, and the foundational tables:

```sql
-- =============================================
-- PART 1: ENUMs, FUNCTIONS, AND CORE TABLES
-- =============================================

-- 1. Create custom ENUMs
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'driver', 'client_individual', 'client_corporate');
CREATE TYPE public.vehicle_type AS ENUM ('land_cruiser', 'tour_van', 'bus', 'saloon');
CREATE TYPE public.vehicle_status AS ENUM ('available', 'booked', 'maintenance', 'unavailable');
CREATE TYPE public.driver_status AS ENUM ('available', 'on_trip', 'unavailable');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.document_type AS ENUM ('insurance', 'inspection', 'road_license', 'logbook', 'driver_license', 'ntsa_verification', 'national_id');

-- 2. Create utility functions

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.is_user_suspended(user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT account_status = 'suspended' FROM public.profiles WHERE id = user_id), false)
$$;

CREATE OR REPLACE FUNCTION public.update_vehicle_compliance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.is_compliant := (
    NEW.insurance_expiry >= CURRENT_DATE AND 
    NEW.inspection_expiry >= CURRENT_DATE AND 
    NEW.road_license_expiry >= CURRENT_DATE AND
    (NEW.tsv_psv_licence_expiry IS NULL OR NEW.tsv_psv_licence_expiry >= CURRENT_DATE)
  );
  IF NEW.is_compliant = false AND NEW.status = 'available' THEN
    NEW.status := 'unavailable';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_driver_compliance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.is_compliant := (
    NEW.license_expiry >= CURRENT_DATE AND NEW.ntsa_verified = true
  );
  IF NEW.is_compliant = false AND NEW.status = 'available' THEN
    NEW.status := 'unavailable';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_owner_suspension()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_status = 'suspended' AND OLD.account_status != 'suspended' THEN
    UPDATE public.vehicles SET status = 'unavailable'
    WHERE owner_id = NEW.id AND status != 'unavailable';
  END IF;
  IF NEW.account_status = 'active' AND OLD.account_status = 'suspended' THEN
    UPDATE public.vehicles SET status = 'available'
    WHERE owner_id = NEW.id AND is_compliant = true AND status = 'unavailable';
    NEW.suspension_reason := NULL;
    NEW.suspension_notes := NULL;
    NEW.suspended_at := NULL;
    NEW.suspended_by := NULL;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.check_company_driver_constraint()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.entity_type = 'company' THEN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id AND role = 'driver'::app_role) THEN
      RAISE EXCEPTION 'Companies cannot register as drivers';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  entity_type TEXT,
  company_name TEXT,
  company_registration_number TEXT,
  company_pin TEXT,
  country TEXT,
  is_fleet_owner BOOLEAN DEFAULT false,
  account_status TEXT DEFAULT 'active',
  suspension_reason TEXT,
  suspension_notes TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert any profile" ON public.profiles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX idx_profiles_country ON public.profiles(country);

-- 4. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- 5. Create vehicle_categories table
CREATE TABLE public.vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'Car',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle categories" ON public.vehicle_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert vehicle categories" ON public.vehicle_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update vehicle categories" ON public.vehicle_categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete vehicle categories" ON public.vehicle_categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_vehicle_categories_is_active ON public.vehicle_categories(is_active);

-- 6. Create vehicle_subcategories table
CREATE TABLE public.vehicle_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.vehicle_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT DEFAULT 'Car',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle subcategories" ON public.vehicle_subcategories FOR SELECT USING (true);
CREATE POLICY "Admins can insert vehicle subcategories" ON public.vehicle_subcategories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update vehicle subcategories" ON public.vehicle_subcategories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete vehicle subcategories" ON public.vehicle_subcategories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES public.vehicle_subcategories(id) ON DELETE SET NULL,
  type vehicle_type NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  daily_rate NUMERIC NOT NULL,
  registration_number TEXT UNIQUE,
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  status vehicle_status NOT NULL DEFAULT 'available',
  insurance_expiry DATE NOT NULL,
  inspection_expiry DATE NOT NULL,
  road_license_expiry DATE NOT NULL,
  tsv_psv_licence_expiry DATE,
  is_compliant BOOLEAN DEFAULT true,
  min_advance_booking_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view available compliant vehicles" ON public.vehicles FOR SELECT USING (status = 'available' AND is_compliant = true);
CREATE POLICY "Owners can view their own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can insert their own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins can insert vehicles for any owner" ON public.vehicles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vehicles" ON public.vehicles FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX idx_vehicles_registration_number ON public.vehicles(registration_number);

-- 8. Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  id_number TEXT,
  ntsa_badge_number TEXT,
  ntsa_verified BOOLEAN DEFAULT false,
  is_vehicle_owner BOOLEAN DEFAULT false,
  status driver_status NOT NULL DEFAULT 'available',
  is_compliant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own profile" ON public.drivers FOR SELECT USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers can insert their own profile" ON public.drivers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Drivers can update their own profile" ON public.drivers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage drivers" ON public.drivers FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

### Part 2: Remaining Tables (Bookings, Bids, Content, etc.)

```sql
-- =============================================
-- PART 2: REMAINING TABLES
-- =============================================

-- 9. Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  destination TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  dropoff_date DATE NOT NULL,
  with_driver BOOLEAN NOT NULL DEFAULT false,
  total_amount NUMERIC NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = client_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers can view their assigned bookings" ON public.bookings FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Vehicle owners can view bookings for their vehicles" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = bookings.vehicle_id AND vehicles.owner_id = auth.uid()));
CREATE POLICY "Clients can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 10. Create documents table
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

CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (
  (entity_type = 'vehicle' AND EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = documents.entity_id AND vehicles.owner_id = auth.uid()))
  OR (entity_type = 'driver' AND entity_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users can insert their own documents" ON public.documents FOR INSERT WITH CHECK (
  (entity_type = 'vehicle' AND EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = documents.entity_id AND vehicles.owner_id = auth.uid()))
  OR (entity_type = 'driver' AND entity_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- 11. Create company tables
CREATE TABLE public.company_directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.company_directors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can insert directors" ON company_directors FOR INSERT WITH CHECK (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Companies can view their directors" ON company_directors FOR SELECT USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Companies can update their directors" ON company_directors FOR UPDATE USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Companies can delete their directors" ON company_directors FOR DELETE USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by_admin BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ
);
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can insert their documents" ON company_documents FOR INSERT WITH CHECK (company_id = auth.uid());
CREATE POLICY "Companies and admins can view documents" ON company_documents FOR SELECT USING (company_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update documents" ON company_documents FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.driver_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fleet_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  permissions JSONB DEFAULT '{"can_add_vehicles": false, "can_edit_vehicles": false, "can_view_earnings": false, "can_manage_drivers": false}'::jsonb,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
ALTER TABLE public.driver_vehicle_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fleet owners can create assignments" ON driver_vehicle_assignments FOR INSERT WITH CHECK (fleet_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Fleet owners and drivers can view assignments" ON driver_vehicle_assignments FOR SELECT USING (fleet_owner_id = auth.uid() OR driver_id IN (SELECT id FROM drivers WHERE id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Fleet owners can update assignments" ON driver_vehicle_assignments FOR UPDATE USING (fleet_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Drivers can update their assignment status" ON driver_vehicle_assignments FOR UPDATE USING (driver_id IN (SELECT id FROM drivers WHERE id = auth.uid()));
CREATE POLICY "Fleet owners can delete assignments" ON driver_vehicle_assignments FOR DELETE USING (fleet_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 12. Create alert_history table
CREATE TABLE public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  days_until_expiry INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all alert history" ON public.alert_history FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert alert history" ON public.alert_history FOR INSERT WITH CHECK (true);
CREATE INDEX alert_history_document_id_idx ON public.alert_history(document_id);
CREATE INDEX alert_history_sent_at_idx ON public.alert_history(sent_at);
CREATE INDEX alert_history_lookup_idx ON public.alert_history(document_id, alert_type, sent_to);

-- 13. Create driver_requirements table
CREATE TABLE public.driver_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT NOT NULL DEFAULT 'certification',
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active requirements" ON public.driver_requirements FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert requirements" ON public.driver_requirements FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update requirements" ON public.driver_requirements FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete requirements" ON public.driver_requirements FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. Create empty_legs table
CREATE TABLE public.empty_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.empty_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can create empty legs" ON public.empty_legs FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE id = auth.uid()));
CREATE POLICY "Drivers can manage their empty legs" ON public.empty_legs FOR ALL USING (driver_id IN (SELECT id FROM drivers WHERE id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clients can view available empty legs" ON public.empty_legs FOR SELECT USING (status = 'available' AND departure_date >= CURRENT_DATE);
CREATE POLICY "Admins can manage all empty legs" ON public.empty_legs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_empty_legs_driver ON public.empty_legs(driver_id);
CREATE INDEX idx_empty_legs_vehicle ON public.empty_legs(vehicle_id);
CREATE INDEX idx_empty_legs_departure ON public.empty_legs(departure_date);
CREATE INDEX idx_empty_legs_status ON public.empty_legs(status);

-- 15. Create bid_requests table
CREATE TABLE public.bid_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  return_date DATE,
  return_time TIME,
  vehicle_type TEXT,
  passengers INTEGER NOT NULL,
  with_driver BOOLEAN NOT NULL DEFAULT true,
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'open',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.bid_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can create bid requests" ON public.bid_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can view their bid requests" ON public.bid_requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can update their bid requests" ON public.bid_requests FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Drivers and owners can view open requests" ON public.bid_requests FOR SELECT USING (status = 'open' AND (has_role(auth.uid(), 'driver'::app_role) OR has_role(auth.uid(), 'owner'::app_role)));
CREATE POLICY "Admins can manage bid requests" ON public.bid_requests FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_bid_requests_client ON public.bid_requests(client_id);
CREATE INDEX idx_bid_requests_status ON public.bid_requests(status);

-- 16. Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_request_id UUID NOT NULL REFERENCES public.bid_requests(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  bid_amount NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = bidder_id AND EXISTS (SELECT 1 FROM bid_requests WHERE id = bid_request_id AND status = 'open'));
CREATE POLICY "Bidders can view their bids" ON public.bids FOR SELECT USING (auth.uid() = bidder_id);
CREATE POLICY "Clients can view bids on their requests" ON public.bids FOR SELECT USING (EXISTS (SELECT 1 FROM bid_requests WHERE id = bid_request_id AND client_id = auth.uid()));
CREATE POLICY "Clients can update bids" ON public.bids FOR UPDATE USING (EXISTS (SELECT 1 FROM bid_requests WHERE id = bid_request_id AND client_id = auth.uid()));
CREATE POLICY "Bidders can update their bids" ON public.bids FOR UPDATE USING (auth.uid() = bidder_id);
CREATE POLICY "Admins can manage bids" ON public.bids FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_bids_request ON public.bids(bid_request_id);
CREATE INDEX idx_bids_bidder ON public.bids(bidder_id);

-- 17. Content tables

-- Blog categories
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.blog_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.blog_categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.blog_categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Blog posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL, content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ, is_published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0, reading_time INTEGER DEFAULT 5,
  meta_title TEXT, meta_description TEXT, meta_keywords TEXT[] DEFAULT '{}',
  canonical_url TEXT, og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert posts" ON public.blog_posts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update posts" ON public.blog_posts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete posts" ON public.blog_posts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Hero slides
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, subtitle TEXT NOT NULL, description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_position_x INTEGER NOT NULL DEFAULT 50,
  image_position_y INTEGER NOT NULL DEFAULT 50,
  button_text TEXT NOT NULL, button_link TEXT NOT NULL,
  secondary_button_text TEXT, secondary_button_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hero_slides_image_position_x_check CHECK (image_position_x >= 0 AND image_position_x <= 100),
  CONSTRAINT hero_slides_image_position_y_check CHECK (image_position_y >= 0 AND image_position_y <= 100)
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active hero slides" ON public.hero_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert hero slides" ON public.hero_slides FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hero slides" ON public.hero_slides FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hero slides" ON public.hero_slides FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Gallery images
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, image_url TEXT NOT NULL,
  category_id UUID REFERENCES public.vehicle_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active gallery images" ON public.gallery_images FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Newsletter subscriptions
CREATE TABLE public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view subscriptions" ON public.newsletter_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage subscriptions" ON public.newsletter_subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Countries
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active countries" ON public.countries FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all countries" ON public.countries FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update countries" ON public.countries FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert countries" ON public.countries FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete countries" ON public.countries FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_countries_is_active ON public.countries(is_active);
CREATE INDEX idx_countries_code ON public.countries(code);

-- Auth token tables
CREATE TABLE public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL, token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);

CREATE TABLE public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL, verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage verification tokens" ON public.email_verification_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
```

---

### Part 3: Triggers, Storage Buckets, and Seed Data

```sql
-- =============================================
-- PART 3: TRIGGERS, STORAGE, AND SEED DATA
-- =============================================

-- Triggers
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicle_categories_updated_at BEFORE UPDATE ON public.vehicle_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicle_subcategories_updated_at BEFORE UPDATE ON public.vehicle_subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_empty_legs_updated_at BEFORE UPDATE ON public.empty_legs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bid_requests_updated_at BEFORE UPDATE ON public.bid_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_driver_requirements_updated_at BEFORE UPDATE ON public.driver_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER check_vehicle_compliance BEFORE INSERT OR UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_compliance();
CREATE TRIGGER check_driver_compliance BEFORE INSERT OR UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_driver_compliance();

CREATE TRIGGER trigger_owner_suspension AFTER UPDATE OF account_status ON public.profiles FOR EACH ROW WHEN (OLD.account_status IS DISTINCT FROM NEW.account_status) EXECUTE FUNCTION public.handle_owner_suspension();
CREATE TRIGGER prevent_company_driver BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION check_company_driver_constraint();

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('vehicle-images', 'vehicle-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vehicle-documents', 'vehicle-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('driver-documents', 'driver-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']);
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('category-images', 'category-images', true),
  ('hero-images', 'hero-images', true),
  ('company-documents', 'company-documents', false),
  ('gallery-images', 'gallery-images', true);

-- Storage RLS Policies

-- vehicle-images
CREATE POLICY "Anyone can view vehicle images" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-images');
CREATE POLICY "Vehicle owners can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Vehicle owners can update their images" ON storage.objects FOR UPDATE USING (bucket_id = 'vehicle-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Vehicle owners can delete their images" ON storage.objects FOR DELETE USING (bucket_id = 'vehicle-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));

-- vehicle-documents
CREATE POLICY "Vehicle owners can view their documents" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Vehicle owners can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Vehicle owners can update their documents" ON storage.objects FOR UPDATE USING (bucket_id = 'vehicle-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Vehicle owners can delete their documents" ON storage.objects FOR DELETE USING (bucket_id = 'vehicle-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));

-- driver-documents
CREATE POLICY "Drivers can view their documents" ON storage.objects FOR SELECT USING (bucket_id = 'driver-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Drivers can upload their documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'driver-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Drivers can update their documents" ON storage.objects FOR UPDATE USING (bucket_id = 'driver-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Drivers can delete their documents" ON storage.objects FOR DELETE USING (bucket_id = 'driver-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));

-- category-images
CREATE POLICY "Category images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "Admins can upload category images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update category images" ON storage.objects FOR UPDATE USING (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete category images" ON storage.objects FOR DELETE USING (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));

-- hero-images
CREATE POLICY "Anyone can view hero images" ON storage.objects FOR SELECT USING (bucket_id = 'hero-images');
CREATE POLICY "Admins can upload hero images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hero images" ON storage.objects FOR UPDATE USING (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hero images" ON storage.objects FOR DELETE USING (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'));

-- company-documents
CREATE POLICY "Companies can upload their documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Companies can view their documents" ON storage.objects FOR SELECT USING (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all company documents" ON storage.objects FOR SELECT USING (bucket_id = 'company-documents' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update company documents" ON storage.objects FOR UPDATE USING (bucket_id = 'company-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- gallery-images
CREATE POLICY "Gallery images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-images');
CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update gallery images" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'gallery-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed Data

-- Vehicle categories
INSERT INTO public.vehicle_categories (slug, name, description, icon_name) VALUES 
  ('land_cruiser', 'Land Cruiser', 'Robust 4x4 for safari adventures', 'Car'),
  ('tour_van', 'Tour Van', 'Spacious vans for group tours', 'Truck'),
  ('bus', 'Bus', 'Large capacity for big groups', 'Bus'),
  ('saloon', 'Saloon', 'Comfortable sedans for city travel', 'Home')
ON CONFLICT (slug) DO NOTHING;

-- Subcategories (Standard, Premium, Extended for each category)
INSERT INTO public.vehicle_subcategories (category_id, name, slug, description, icon_name)
SELECT vc.id, 'Standard', vc.slug || '-standard', 'Standard ' || vc.name, vc.icon_name FROM vehicle_categories vc ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.vehicle_subcategories (category_id, name, slug, description, icon_name)
SELECT vc.id, 'Premium', vc.slug || '-premium', 'Premium ' || vc.name, vc.icon_name FROM vehicle_categories vc ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.vehicle_subcategories (category_id, name, slug, description, icon_name)
SELECT vc.id, 'Extended', vc.slug || '-extended', 'Extended ' || vc.name, vc.icon_name FROM vehicle_categories vc ON CONFLICT (slug) DO NOTHING;

-- Blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Travel Tips', 'travel-tips', 'Essential tips for planning your perfect safari adventure'),
  ('Vehicle Guide', 'vehicle-guide', 'Expert guides on choosing the right safari vehicle'),
  ('Photography', 'photography', 'Capture stunning wildlife and landscape photos'),
  ('Wildlife & Nature', 'wildlife-nature', 'Discover the amazing wildlife of East Africa'),
  ('Safari Planning', 'safari-planning', 'Complete guides for planning your safari'),
  ('Destination Spotlights', 'destination-spotlights', 'Featured safari destinations and parks');

-- Hero slides
INSERT INTO public.hero_slides (title, subtitle, description, image_url, button_text, button_link, secondary_button_text, secondary_button_link, display_order, is_active) VALUES 
  ('Adventure Awaits', 'Premium Safari Vehicle Hire', 'Explore the wild with our top-quality safari vehicles.', '/src/assets/hero-safari.jpg', 'Browse Vehicles', '/safari-vehicles', 'Learn More', '/about', 1, true),
  ('Discover the Wilderness', 'Reliable Safari Transportation', 'Experience nature like never before with our comfortable and safe safari vehicles.', '/src/assets/hero-safari-2.jpg', 'Browse Vehicles', '/safari-vehicles', 'Learn More', '/about', 2, true),
  ('Your Journey Begins Here', 'Professional Safari Services', 'From luxury to rugged terrain vehicles, we have everything you need.', '/src/assets/hero-safari-3.jpg', 'Browse Vehicles', '/safari-vehicles', 'Learn More', '/about', 3, true);

-- Driver requirements
INSERT INTO public.driver_requirements (name, description, requirement_type, is_mandatory) VALUES
  ('Valid Driver License', 'Must have a valid driving license', 'document', true),
  ('NTSA Badge', 'National Transport and Safety Authority badge', 'document', true),
  ('National ID', 'Valid national identification document', 'document', true),
  ('First Aid Certificate', 'Basic first aid training certification', 'certification', false),
  ('Tour Guide License', 'Licensed tour guide certification', 'certification', false),
  ('Commercial Driver License', 'CDL for commercial vehicle operation', 'certification', false),
  ('Defensive Driving Course', 'Completed defensive driving training', 'qualification', false);

-- Countries (Kenya active, all others inactive) - truncated for brevity, full list in migration
INSERT INTO public.countries (code, name, is_active) VALUES
  ('KE', 'Kenya', true), ('TZ', 'Tanzania', false), ('UG', 'Uganda', false),
  ('RW', 'Rwanda', false), ('ET', 'Ethiopia', false), ('ZA', 'South Africa', false),
  ('NG', 'Nigeria', false), ('GH', 'Ghana', false), ('US', 'United States', false),
  ('GB', 'United Kingdom', false), ('DE', 'Germany', false), ('FR', 'France', false),
  ('AU', 'Australia', false), ('CA', 'Canada', false), ('IN', 'India', false),
  ('CN', 'China', false), ('JP', 'Japan', false), ('BR', 'Brazil', false)
ON CONFLICT (code) DO NOTHING;
```

### After Running the SQL

1. **Update your .env file** in the new project with the new Supabase URL and anon key
2. **Configure secrets** in Supabase Dashboard > Settings > Edge Functions: `RESEND_API_KEY`
3. **Deploy edge functions** from the codebase (they deploy automatically with Lovable)
4. **Create your first admin user**: Sign up, then manually insert into user_roles: `INSERT INTO user_roles (user_id, role) VALUES ('your-user-uuid', 'admin');`

### Important Notes

- Run Part 1 first, then Part 2, then Part 3 (they depend on each other)
- The countries seed data shown above is abbreviated - copy the full list from the migration file `20251217115018` for all 200+ countries
- The `pg_cron` and `pg_net` extensions may need to be enabled separately in your Supabase dashboard under Database > Extensions
