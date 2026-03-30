-- =============================================
-- WEBHOOK LOGS TABLE
-- Stores all incoming webhook events for audit trail
-- =============================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Webhook identification
  source TEXT NOT NULL, -- 'razorpay', 'zoho', 'twilio', 'resend', 'custom'
  event_type TEXT NOT NULL,
  event_id TEXT, -- External event ID from webhook provider
  
  -- Request details
  method TEXT NOT NULL DEFAULT 'POST',
  url TEXT NOT NULL,
  headers JSONB,
  body JSONB NOT NULL,
  query_params JSONB,
  
  -- Verification
  signature TEXT,
  signature_verified BOOLEAN DEFAULT false,
  verification_error TEXT,
  
  -- Processing
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'processed', 'failed', 'retry'
  processed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Trigger execution
  trigger_event_id UUID REFERENCES automation_trigger_events(id) ON DELETE SET NULL,
  triggered_automations TEXT[],
  
  -- Context (using builder_id instead of organization_id for compatibility)
  builder_id UUID, -- References auth.users(id) where user_type = 'builder'
  lead_id UUID, -- References auth.users(id) where user_type = 'buyer'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Error handling
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_builder ON webhook_logs(builder_id) WHERE builder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_retry ON webhook_logs(next_retry_at) WHERE status = 'retry';
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_lead ON webhook_logs(lead_id) WHERE lead_id IS NOT NULL;

-- =============================================
-- WEBHOOK ENDPOINTS TABLE
-- Custom webhook endpoints per builder
-- =============================================
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL, -- References auth.users(id) where user_type = 'builder'
  
  -- Endpoint configuration
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL, -- The webhook URL slug (e.g., '/api/webhooks/custom/{builder_id}/my-endpoint')
  webhook_secret TEXT NOT NULL, -- Secret for signature verification
  
  -- Event filtering
  allowed_events TEXT[], -- Specific event types this endpoint accepts
  event_mapping JSONB, -- Map external event names to internal event types
  
  -- Security
  require_signature BOOLEAN DEFAULT true,
  signature_header TEXT DEFAULT 'x-webhook-signature',
  signature_algorithm TEXT DEFAULT 'sha256', -- 'sha256', 'sha512', 'hmac-sha256'
  allowed_ips TEXT[], -- Whitelist of allowed IP addresses
  
  -- Rate limiting
  rate_limit_requests INTEGER DEFAULT 1000,
  rate_limit_window INTEGER DEFAULT 3600, -- In seconds
  
  -- State
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  
  -- Statistics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint on builder_id + url combination
  UNIQUE(builder_id, url)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_builder ON webhook_endpoints(builder_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_url ON webhook_endpoints(url);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON webhook_endpoints(is_active, is_paused);

-- =============================================
-- UPDATE TIMESTAMP TRIGGERS
-- =============================================
CREATE TRIGGER update_webhook_logs_updated_at
  BEFORE UPDATE ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Webhook logs policies
CREATE POLICY "Builders can view their webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    builder_id = auth.uid() OR
    builder_id IS NULL -- Allow system logs
  );

CREATE POLICY "System can insert webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhook logs"
  ON webhook_logs FOR UPDATE
  USING (true);

-- Webhook endpoints policies
CREATE POLICY "Builders can view their webhook endpoints"
  ON webhook_endpoints FOR SELECT
  USING (builder_id = auth.uid());

CREATE POLICY "Builders can manage their webhook endpoints"
  ON webhook_endpoints FOR ALL
  USING (builder_id = auth.uid())
  WITH CHECK (builder_id = auth.uid());

-- =============================================
-- HELPER FUNCTIONS
-- =============================================
-- Function to clean up old webhook logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND status IN ('processed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update webhook endpoint statistics
CREATE OR REPLACE FUNCTION update_webhook_endpoint_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if we can find the endpoint by URL pattern
  -- This is a simplified version - in production, you might want to store endpoint_id in webhook_logs
  IF NEW.status = 'processed' AND (OLD.status IS NULL OR OLD.status != 'processed') THEN
    -- Update endpoint stats if URL matches
    UPDATE webhook_endpoints
    SET 
      total_requests = total_requests + 1,
      successful_requests = successful_requests + 1,
      last_request_at = NOW(),
      updated_at = NOW()
    WHERE url = ANY(
      SELECT url FROM webhook_endpoints 
      WHERE NEW.url LIKE '%' || url || '%'
      LIMIT 1
    );
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    -- Update endpoint stats for failed requests
    UPDATE webhook_endpoints
    SET 
      total_requests = total_requests + 1,
      failed_requests = failed_requests + 1,
      last_request_at = NOW(),
      updated_at = NOW()
    WHERE url = ANY(
      SELECT url FROM webhook_endpoints 
      WHERE NEW.url LIKE '%' || url || '%'
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_log_update_stats
  AFTER UPDATE ON webhook_logs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_webhook_endpoint_stats();

