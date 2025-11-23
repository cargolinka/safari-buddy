-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create alert_history table to track sent alerts and prevent duplicates
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('14_day', '7_day', '3_day', 'expired', 'post_expiry')),
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  days_until_expiry INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS alert_history_document_id_idx ON public.alert_history(document_id);
CREATE INDEX IF NOT EXISTS alert_history_sent_at_idx ON public.alert_history(sent_at);
CREATE INDEX IF NOT EXISTS alert_history_lookup_idx ON public.alert_history(document_id, alert_type, sent_to);

-- Enable RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_history
CREATE POLICY "Admins can view all alert history"
ON public.alert_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert alert history"
ON public.alert_history FOR INSERT
WITH CHECK (true);