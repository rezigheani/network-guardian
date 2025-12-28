-- Create routers table
CREATE TABLE public.routers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  community_string TEXT NOT NULL DEFAULT 'public',
  oid_interface_in TEXT,
  oid_interface_out TEXT,
  oid_sfp_rx TEXT,
  status TEXT NOT NULL DEFAULT 'DOWN' CHECK (status IN ('UP', 'DOWN')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create traffic_logs table
CREATE TABLE public.traffic_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  router_id UUID NOT NULL REFERENCES public.routers(id) ON DELETE CASCADE,
  rx_bps BIGINT NOT NULL DEFAULT 0,
  tx_bps BIGINT NOT NULL DEFAULT 0,
  sfp_rx_dbm REAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routers (authenticated users can CRUD)
CREATE POLICY "Authenticated users can read routers"
ON public.routers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert routers"
ON public.routers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update routers"
ON public.routers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete routers"
ON public.routers FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for traffic_logs (authenticated users can read/insert)
CREATE POLICY "Authenticated users can read traffic_logs"
ON public.traffic_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert traffic_logs"
ON public.traffic_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for traffic_logs (for real-time graphs later)
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_logs;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on routers
CREATE TRIGGER update_routers_updated_at
BEFORE UPDATE ON public.routers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_traffic_logs_router_id ON public.traffic_logs(router_id);
CREATE INDEX idx_traffic_logs_created_at ON public.traffic_logs(created_at DESC);