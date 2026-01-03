-- =============================================
-- EMAIL MARKETING AUTOMATION SYSTEM
-- Comprehensive tables and functions for n8n workflows
-- =============================================

-- Extend email_delivery_logs with tracking fields
ALTER TABLE public.email_delivery_logs 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounce_type TEXT CHECK (bounce_type IN ('hard', 'soft', 'spam', 'unknown')),
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS retry_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_opened ON public.email_delivery_logs(opened_at) WHERE opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_clicked ON public.email_delivery_logs(clicked_at) WHERE clicked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_retry ON public.email_delivery_logs(retry_scheduled_at) WHERE retry_scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_lead ON public.email_delivery_logs(lead_id) WHERE lead_id IS NOT NULL;

-- Email sequences for scheduled campaigns (different from template sequences)
CREATE TABLE IF NOT EXISTS public.email_sequence_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- Sequence details
  sequence_position INTEGER NOT NULL DEFAULT 1,
  scheduled_for TIMESTAMPTZ NOT NULL,
  
  -- Email content
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  cta TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'cancelled', 'paused', 'deferred')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  
  -- Retry logic
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  paused_reason TEXT,
  paused_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sequence_queue_scheduled ON public.email_sequence_queue(scheduled_for, status) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_email_sequence_queue_lead ON public.email_sequence_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_queue_builder ON public.email_sequence_queue(builder_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_queue_status ON public.email_sequence_queue(status, created_at);

-- Scheduled reminders for property viewings
CREATE TABLE IF NOT EXISTS public.scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewing_id UUID, -- References property_viewings if exists
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reminder details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h_before', '2h_before', '30min_before', 'custom')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  template_type TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'skipped')),
  sent_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_due ON public.scheduled_reminders(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_lead ON public.scheduled_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_viewing ON public.scheduled_reminders(viewing_id) WHERE viewing_id IS NOT NULL;

-- Campaign emails for tracking marketing campaigns
CREATE TABLE IF NOT EXISTS public.campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('reengagement', 'nurture', 'promotional', 'transactional', 'weekly_digest')),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- Campaign details
  variant TEXT, -- For A/B testing
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_emails_type ON public.campaign_emails(campaign_type, sent_at);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_lead ON public.campaign_emails(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_emails_builder ON public.campaign_emails(builder_id);

-- Email analytics aggregation table
CREATE TABLE IF NOT EXISTS public.email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Metrics
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Calculated rates
  delivery_rate NUMERIC(5,2),
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  bounce_rate NUMERIC(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(builder_id, property_id, email_type, date)
);

CREATE INDEX IF NOT EXISTS idx_email_analytics_builder_date ON public.email_analytics(builder_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_email_analytics_type ON public.email_analytics(email_type, date DESC);

-- Email health metrics for monitoring
CREATE TABLE IF NOT EXISTS public.email_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metrics
  total_sent INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  stuck_count INTEGER DEFAULT 0,
  
  -- Rates
  bounce_rate NUMERIC(5,2),
  failure_rate NUMERIC(5,2),
  delivery_rate NUMERIC(5,2),
  
  -- Performance
  avg_delivery_time_seconds NUMERIC(10,2),
  p95_delivery_time_seconds NUMERIC(10,2),
  
  -- Issues
  issues JSONB DEFAULT '[]'::jsonb,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_health_metrics_builder ON public.email_health_metrics(builder_id, measurement_time DESC);
CREATE INDEX IF NOT EXISTS idx_email_health_metrics_severity ON public.email_health_metrics(severity, measurement_time DESC) WHERE severity IS NOT NULL;

-- Builder alerts for quota warnings and issues
CREATE TABLE IF NOT EXISTS public.builder_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('quota_warning', 'quota_critical', 'bounce_rate_high', 'delivery_issue', 'sequence_paused')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_alerts_builder ON public.builder_alerts(builder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builder_alerts_unacknowledged ON public.builder_alerts(builder_id, acknowledged) WHERE acknowledged = false;

-- Extend builder_subscriptions with email quota tracking
ALTER TABLE public.builder_subscriptions
ADD COLUMN IF NOT EXISTS email_quota INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS emails_sent_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_warning_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_quota_reset_at TIMESTAMPTZ;

-- Property viewings table (if not exists)
CREATE TABLE IF NOT EXISTS public.property_viewings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Viewing details
  scheduled_at TIMESTAMPTZ NOT NULL,
  viewing_type TEXT CHECK (viewing_type IN ('in_person', 'virtual', 'video_call')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Contact info
  meeting_link TEXT,
  location_address TEXT,
  google_maps_link TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_viewings_scheduled ON public.property_viewings(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_property_viewings_lead ON public.property_viewings(lead_id);
CREATE INDEX IF NOT EXISTS idx_property_viewings_property ON public.property_viewings(property_id);

-- Lead interactions table extension (if needed)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'lead_interactions' AND column_name = 'type') THEN
    ALTER TABLE public.lead_interactions 
    ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Function to reset monthly email quota (run on 1st of each month)
CREATE OR REPLACE FUNCTION public.reset_monthly_email_quota()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.builder_subscriptions
  SET 
    emails_sent_this_month = 0,
    last_quota_reset_at = NOW()
  WHERE status = 'active';
END;
$$;

-- Function to update email analytics
CREATE OR REPLACE FUNCTION public.update_email_analytics(
  p_builder_id UUID,
  p_property_id UUID,
  p_email_type TEXT,
  p_date DATE,
  p_sent INTEGER DEFAULT 0,
  p_delivered INTEGER DEFAULT 0,
  p_opened INTEGER DEFAULT 0,
  p_clicked INTEGER DEFAULT 0,
  p_bounced INTEGER DEFAULT 0,
  p_failed INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER;
  v_delivery_rate NUMERIC(5,2);
  v_open_rate NUMERIC(5,2);
  v_click_rate NUMERIC(5,2);
  v_bounce_rate NUMERIC(5,2);
BEGIN
  v_total := p_sent;
  
  IF v_total > 0 THEN
    v_delivery_rate := (p_delivered::NUMERIC / v_total) * 100;
    v_open_rate := (p_opened::NUMERIC / NULLIF(p_delivered, 0)) * 100;
    v_click_rate := (p_clicked::NUMERIC / NULLIF(p_delivered, 0)) * 100;
    v_bounce_rate := (p_bounced::NUMERIC / v_total) * 100;
  END IF;
  
  INSERT INTO public.email_analytics (
    builder_id,
    property_id,
    email_type,
    date,
    sent_count,
    delivered_count,
    opened_count,
    clicked_count,
    bounced_count,
    failed_count,
    delivery_rate,
    open_rate,
    click_rate,
    bounce_rate
  ) VALUES (
    p_builder_id,
    p_property_id,
    p_email_type,
    p_date,
    p_sent,
    p_delivered,
    p_opened,
    p_clicked,
    p_bounced,
    p_failed,
    v_delivery_rate,
    v_open_rate,
    v_click_rate,
    v_bounce_rate
  )
  ON CONFLICT (builder_id, property_id, email_type, date)
  DO UPDATE SET
    sent_count = email_analytics.sent_count + EXCLUDED.sent_count,
    delivered_count = email_analytics.delivered_count + EXCLUDED.delivered_count,
    opened_count = email_analytics.opened_count + EXCLUDED.opened_count,
    clicked_count = email_analytics.clicked_count + EXCLUDED.clicked_count,
    bounced_count = email_analytics.bounced_count + EXCLUDED.bounced_count,
    failed_count = email_analytics.failed_count + EXCLUDED.failed_count,
    delivery_rate = CASE 
      WHEN email_analytics.sent_count + EXCLUDED.sent_count > 0 
      THEN ((email_analytics.delivered_count + EXCLUDED.delivered_count)::NUMERIC / 
            (email_analytics.sent_count + EXCLUDED.sent_count)) * 100
      ELSE NULL
    END,
    open_rate = CASE 
      WHEN email_analytics.delivered_count + EXCLUDED.delivered_count > 0
      THEN ((email_analytics.opened_count + EXCLUDED.opened_count)::NUMERIC / 
            (email_analytics.delivered_count + EXCLUDED.delivered_count)) * 100
      ELSE NULL
    END,
    click_rate = CASE 
      WHEN email_analytics.delivered_count + EXCLUDED.delivered_count > 0
      THEN ((email_analytics.clicked_count + EXCLUDED.clicked_count)::NUMERIC / 
            (email_analytics.delivered_count + EXCLUDED.delivered_count)) * 100
      ELSE NULL
    END,
    bounce_rate = CASE 
      WHEN email_analytics.sent_count + EXCLUDED.sent_count > 0
      THEN ((email_analytics.bounced_count + EXCLUDED.bounced_count)::NUMERIC / 
            (email_analytics.sent_count + EXCLUDED.sent_count)) * 100
      ELSE NULL
    END,
    updated_at = NOW();
END;
$$;

-- RLS Policies
ALTER TABLE public.email_sequence_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_viewings ENABLE ROW LEVEL SECURITY;

-- Builders can view their own data
CREATE POLICY "Builders can view own email sequences" ON public.email_sequence_queue
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can view own reminders" ON public.scheduled_reminders
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can view own campaigns" ON public.campaign_emails
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can view own analytics" ON public.email_analytics
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can view own health metrics" ON public.email_health_metrics
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can view own alerts" ON public.builder_alerts
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can view own viewings" ON public.property_viewings
  FOR SELECT USING (auth.uid() = builder_id);

-- Service role can insert/update (for API usage)
CREATE POLICY "Service role can manage email sequences" ON public.email_sequence_queue
  FOR ALL USING (true);

CREATE POLICY "Service role can manage reminders" ON public.scheduled_reminders
  FOR ALL USING (true);

CREATE POLICY "Service role can manage campaigns" ON public.campaign_emails
  FOR ALL USING (true);

CREATE POLICY "Service role can manage analytics" ON public.email_analytics
  FOR ALL USING (true);

CREATE POLICY "Service role can manage health metrics" ON public.email_health_metrics
  FOR ALL USING (true);

CREATE POLICY "Service role can manage alerts" ON public.builder_alerts
  FOR ALL USING (true);

CREATE POLICY "Service role can manage viewings" ON public.property_viewings
  FOR ALL USING (true);

-- Comments
COMMENT ON TABLE public.email_sequence_queue IS 'Scheduled email sequences for lead nurturing campaigns';
COMMENT ON TABLE public.scheduled_reminders IS 'Scheduled reminders for property viewings and events';
COMMENT ON TABLE public.campaign_emails IS 'Marketing campaign email tracking with A/B testing support';
COMMENT ON TABLE public.email_analytics IS 'Aggregated email performance metrics by builder, property, and type';
COMMENT ON TABLE public.email_health_metrics IS 'Email delivery health monitoring and alerting';
COMMENT ON TABLE public.builder_alerts IS 'Alerts and notifications for builders (quota, delivery issues, etc.)';
COMMENT ON TABLE public.property_viewings IS 'Scheduled property viewings with reminder automation';





































