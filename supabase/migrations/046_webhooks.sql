-- =============================================
-- WEBHOOK MANAGEMENT SYSTEM
-- Incoming and outgoing webhooks with security
-- =============================================

-- Webhook endpoints (outgoing)
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['property.created', 'lead.generated']
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON public.webhook_endpoints(is_active, created_at DESC);

-- Webhook deliveries (outgoing)
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Webhook receipts (incoming)
CREATE TABLE IF NOT EXISTS public.webhook_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'twilio', 'resend', 'razorpay', etc.
  payload JSONB NOT NULL,
  signature TEXT,
  verified BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_receipts_provider ON public.webhook_receipts(provider, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_receipts_processed ON public.webhook_receipts(processed, received_at) WHERE processed = false;

-- RLS Policies
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_receipts ENABLE ROW LEVEL SECURITY;

-- Users can view their own webhook endpoints
DROP POLICY IF EXISTS "Users can view their webhooks" ON public.webhook_endpoints;
CREATE POLICY "Users can view their webhooks" ON public.webhook_endpoints
FOR SELECT
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create webhooks" ON public.webhook_endpoints;
CREATE POLICY "Users can create webhooks" ON public.webhook_endpoints
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can view their webhook deliveries
DROP POLICY IF EXISTS "Users can view their deliveries" ON public.webhook_deliveries;
CREATE POLICY "Users can view their deliveries" ON public.webhook_deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.webhook_endpoints
    WHERE id = endpoint_id
    AND created_by = auth.uid()
  )
);

-- Grant service role full access
GRANT ALL ON public.webhook_endpoints TO service_role;
GRANT ALL ON public.webhook_deliveries TO service_role;
GRANT ALL ON public.webhook_receipts TO service_role;

COMMENT ON TABLE public.webhook_endpoints IS 'Outgoing webhook endpoints';
COMMENT ON TABLE public.webhook_deliveries IS 'Webhook delivery logs';
COMMENT ON TABLE public.webhook_receipts IS 'Incoming webhook receipts';

