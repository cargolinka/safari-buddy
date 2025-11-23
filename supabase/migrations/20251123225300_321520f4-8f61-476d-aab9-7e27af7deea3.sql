-- Create bid requests table
CREATE TABLE public.bid_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('open', 'closed', 'awarded', 'cancelled'))
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_request_id UUID NOT NULL REFERENCES public.bid_requests(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  bid_amount NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_bid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'))
);

-- Enable RLS
ALTER TABLE public.bid_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bid_requests

-- Clients can create their own bid requests
CREATE POLICY "Clients can create bid requests"
ON public.bid_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

-- Clients can view their own bid requests
CREATE POLICY "Clients can view their bid requests"
ON public.bid_requests
FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- Clients can update their own bid requests
CREATE POLICY "Clients can update their bid requests"
ON public.bid_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = client_id);

-- Drivers and owners can view open bid requests
CREATE POLICY "Drivers and owners can view open requests"
ON public.bid_requests
FOR SELECT
TO authenticated
USING (
  status = 'open' AND 
  (has_role(auth.uid(), 'driver'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);

-- Admins can manage all bid requests
CREATE POLICY "Admins can manage bid requests"
ON public.bid_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for bids

-- Users can create bids for open requests
CREATE POLICY "Users can create bids"
ON public.bids
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = bidder_id AND
  EXISTS (
    SELECT 1 FROM bid_requests 
    WHERE id = bid_request_id AND status = 'open'
  )
);

-- Bidders can view their own bids
CREATE POLICY "Bidders can view their bids"
ON public.bids
FOR SELECT
TO authenticated
USING (auth.uid() = bidder_id);

-- Clients can view bids on their requests
CREATE POLICY "Clients can view bids on their requests"
ON public.bids
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bid_requests 
    WHERE id = bid_request_id AND client_id = auth.uid()
  )
);

-- Clients can update bid status (accept/reject)
CREATE POLICY "Clients can update bids"
ON public.bids
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bid_requests 
    WHERE id = bid_request_id AND client_id = auth.uid()
  )
);

-- Bidders can update their own bids
CREATE POLICY "Bidders can update their bids"
ON public.bids
FOR UPDATE
TO authenticated
USING (auth.uid() = bidder_id);

-- Admins can manage all bids
CREATE POLICY "Admins can manage bids"
ON public.bids
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_bid_requests_updated_at
BEFORE UPDATE ON public.bid_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_bid_requests_client ON public.bid_requests(client_id);
CREATE INDEX idx_bid_requests_status ON public.bid_requests(status);
CREATE INDEX idx_bid_requests_pickup_date ON public.bid_requests(pickup_date);
CREATE INDEX idx_bids_request ON public.bids(bid_request_id);
CREATE INDEX idx_bids_bidder ON public.bids(bidder_id);
CREATE INDEX idx_bids_status ON public.bids(status);