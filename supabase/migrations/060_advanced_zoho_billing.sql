-- =============================================
-- ADVANCED ZOHO CRM & BILLING INTEGRATION
-- Production-ready implementation
-- =============================================

-- =============================================
-- 1. ZOHO CRM CONNECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS zoho_crm_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES builders(id) ON DELETE CASCADE,
  
  -- OAuth Tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Zoho Account Info
  zoho_account_email TEXT NOT NULL,
  zoho_org_id TEXT NOT NULL,
  zoho_data_center TEXT NOT NULL DEFAULT 'in' CHECK (zoho_data_center IN ('com', 'eu', 'in', 'com.au', 'jp')),
  
  -- Connection Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disconnected', 'error')),
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Sync Configuration
  sync_settings JSONB DEFAULT '{
    "sync_leads": true,
    "sync_deals": true,
    "sync_contacts": true,
    "sync_activities": true,
    "auto_create_deals": true,
    "lead_assignment_rule": "round_robin",
    "deal_stage_mapping": {}
  }'::jsonb,
  
  -- Field Mappings
  field_mappings JSONB DEFAULT '{
    "lead_fields": {},
    "deal_fields": {},
    "contact_fields": {}
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(builder_id)
);

CREATE INDEX IF NOT EXISTS idx_zoho_connections_builder ON zoho_crm_connections(builder_id);
CREATE INDEX IF NOT EXISTS idx_zoho_connections_status ON zoho_crm_connections(status);

-- =============================================
-- 2. ZOHO SYNC LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS zoho_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES zoho_crm_connections(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL CHECK (sync_type IN ('lead', 'deal', 'contact', 'activity', 'note')),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('tharaga_to_zoho', 'zoho_to_tharaga', 'bidirectional')),
  
  -- Record Info
  tharaga_record_id UUID,
  tharaga_record_type TEXT,
  zoho_record_id TEXT,
  zoho_module TEXT,
  
  -- Sync Details
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'skipped')),
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  
  -- Performance
  sync_duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_connection ON zoho_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_status ON zoho_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_created ON zoho_sync_logs(created_at DESC);

-- =============================================
-- 3. ZOHO WEBHOOK EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS zoho_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES zoho_crm_connections(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  zoho_module TEXT NOT NULL,
  zoho_record_id TEXT NOT NULL,
  
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zoho_webhook_events_processed ON zoho_webhook_events(processed, created_at);

-- =============================================
-- 4. BILLING SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES builders(id) ON DELETE CASCADE,
  
  -- Razorpay Details
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_plan_id TEXT NOT NULL,
  razorpay_customer_id TEXT,
  
  -- Subscription Details
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  
  -- Pricing
  amount INTEGER NOT NULL, -- in paise
  currency TEXT DEFAULT 'INR',
  tax_percentage DECIMAL(5,2) DEFAULT 18.00, -- GST
  
  -- Status
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'authenticated', 'active', 'paused', 'cancelled', 'expired', 'failed')),
  
  -- Billing Dates
  current_start TIMESTAMPTZ,
  current_end TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Limits (based on plan)
  properties_limit INTEGER NOT NULL,
  leads_limit INTEGER NOT NULL,
  email_quota INTEGER NOT NULL,
  storage_gb INTEGER NOT NULL,
  team_members_limit INTEGER NOT NULL,
  
  -- Usage Tracking
  properties_used INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  
  -- Add-ons
  add_ons JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(builder_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_subs_builder ON billing_subscriptions(builder_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_status ON billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_subs_next_billing ON billing_subscriptions(next_billing_at);

-- =============================================
-- 5. BILLING INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES builders(id) ON DELETE CASCADE,
  
  -- Razorpay Details
  razorpay_invoice_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  
  -- Invoice Details
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL,
  tax_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  amount_due INTEGER NOT NULL,
  
  -- Line Items
  line_items JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'cancelled', 'refunded')),
  paid_at TIMESTAMPTZ,
  
  -- PDF
  pdf_url TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON billing_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_builder ON billing_invoices(builder_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON billing_invoices(invoice_date DESC);

-- =============================================
-- 6. BILLING PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES builders(id) ON DELETE CASCADE,
  
  -- Razorpay Details
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  
  -- Payment Details
  amount INTEGER NOT NULL, -- in paise
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'refunded', 'failed')),
  method TEXT, -- card, netbanking, upi, wallet
  
  -- Card/Bank Details (masked)
  card_last4 TEXT,
  card_brand TEXT,
  bank TEXT,
  wallet TEXT,
  vpa TEXT, -- UPI
  
  -- Timestamps
  authorized_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Error Details
  error_code TEXT,
  error_description TEXT,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON billing_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON billing_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_builder ON billing_payments(builder_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON billing_payments(status);

-- =============================================
-- 7. BILLING USAGE EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES builders(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('property_created', 'lead_generated', 'email_sent', 'storage_used', 'api_call')),
  quantity INTEGER DEFAULT 1,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_subscription ON billing_usage_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON billing_usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON billing_usage_events(created_at DESC);

-- =============================================
-- 8. UPDATED_AT TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION handle_zoho_crm_connections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_zoho_crm_connections_updated_at ON zoho_crm_connections;
CREATE TRIGGER on_zoho_crm_connections_updated_at
  BEFORE UPDATE ON zoho_crm_connections
  FOR EACH ROW
  EXECUTE FUNCTION handle_zoho_crm_connections_updated_at();

CREATE OR REPLACE FUNCTION handle_billing_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_billing_subscriptions_updated_at ON billing_subscriptions;
CREATE TRIGGER on_billing_subscriptions_updated_at
  BEFORE UPDATE ON billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_billing_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION handle_billing_invoices_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_billing_invoices_updated_at ON billing_invoices;
CREATE TRIGGER on_billing_invoices_updated_at
  BEFORE UPDATE ON billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_billing_invoices_updated_at();

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE zoho_crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoho_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoho_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_usage_events ENABLE ROW LEVEL SECURITY;

-- Zoho CRM Connections policies
CREATE POLICY "Builders can view their own Zoho connections"
  ON zoho_crm_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builders b
      WHERE b.id = zoho_crm_connections.builder_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Builders can manage their own Zoho connections"
  ON zoho_crm_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM builders b
      WHERE b.id = zoho_crm_connections.builder_id
      AND b.user_id = auth.uid()
    )
  );

-- Zoho Sync Logs policies
CREATE POLICY "Builders can view their own sync logs"
  ON zoho_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM zoho_crm_connections zc
      JOIN builders b ON b.id = zc.builder_id
      WHERE zc.id = zoho_sync_logs.connection_id
      AND b.user_id = auth.uid()
    )
  );

-- Billing Subscriptions policies
CREATE POLICY "Builders can view their own subscriptions"
  ON billing_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builders b
      WHERE b.id = billing_subscriptions.builder_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Builders can manage their own subscriptions"
  ON billing_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM builders b
      WHERE b.id = billing_subscriptions.builder_id
      AND b.user_id = auth.uid()
    )
  );

-- Billing Invoices policies
CREATE POLICY "Builders can view their own invoices"
  ON billing_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builders b
      WHERE b.id = billing_invoices.builder_id
      AND b.user_id = auth.uid()
    )
  );

-- Billing Payments policies
CREATE POLICY "Builders can view their own payments"
  ON billing_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builders b
      WHERE b.id = billing_payments.builder_id
      AND b.user_id = auth.uid()
    )
  );

-- Usage Events policies
CREATE POLICY "Builders can view their own usage events"
  ON billing_usage_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builders b
      WHERE b.id = billing_usage_events.builder_id
      AND b.user_id = auth.uid()
    )
  );

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION get_zoho_sync_stats(p_connection_id UUID)
RETURNS TABLE (
  total_syncs BIGINT,
  successful_syncs BIGINT,
  failed_syncs BIGINT,
  last_sync_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_syncs,
    COUNT(*) FILTER (WHERE status = 'success')::BIGINT as successful_syncs,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_syncs,
    MAX(created_at) as last_sync_at
  FROM zoho_sync_logs
  WHERE connection_id = p_connection_id;
END;
$$;

COMMENT ON FUNCTION get_zoho_sync_stats IS 'Get sync statistics for a Zoho connection';






