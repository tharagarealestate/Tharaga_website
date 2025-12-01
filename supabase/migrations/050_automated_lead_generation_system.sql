-- =============================================
-- AUTOMATED LEAD GENERATION SYSTEM
-- Complete database schema for magic automation
-- =============================================

-- Table 1: Enhanced properties table (if not exists, add columns)
DO $$
BEGIN
  -- Add processing status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE properties ADD COLUMN processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;

  -- Add processing metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'processing_metadata'
  ) THEN
    ALTER TABLE properties ADD COLUMN processing_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add property_name if not exists (alias for title)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'property_name'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_name TEXT;
    -- Copy from title if title exists
    UPDATE properties SET property_name = title WHERE property_name IS NULL AND title IS NOT NULL;
  END IF;
END $$;

-- Table 2: Enhanced builder_subscriptions (add lead generation fields)
DO $$
BEGIN
  -- Add leads_per_property if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'builder_subscriptions' 
    AND column_name = 'leads_per_property'
  ) THEN
    ALTER TABLE builder_subscriptions ADD COLUMN leads_per_property INTEGER DEFAULT 50;
  END IF;

  -- Add email_template_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'builder_subscriptions' 
    AND column_name = 'email_template_id'
  ) THEN
    ALTER TABLE builder_subscriptions ADD COLUMN email_template_id UUID;
  END IF;

  -- Add sms_enabled if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'builder_subscriptions' 
    AND column_name = 'sms_enabled'
  ) THEN
    ALTER TABLE builder_subscriptions ADD COLUMN sms_enabled BOOLEAN DEFAULT false;
  END IF;

  -- Add ai_features_enabled if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'builder_subscriptions' 
    AND column_name = 'ai_features_enabled'
  ) THEN
    ALTER TABLE builder_subscriptions ADD COLUMN ai_features_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Add features JSONB if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'builder_subscriptions' 
    AND column_name = 'features'
  ) THEN
    ALTER TABLE builder_subscriptions ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Set tier-based defaults
  UPDATE builder_subscriptions 
  SET 
    leads_per_property = CASE 
      WHEN tier = 'starter' OR tier = 'trial' THEN 50
      WHEN tier = 'professional' OR tier = 'growth' THEN 200
      WHEN tier = 'enterprise' OR tier = 'pro' THEN 500
      ELSE 50
    END,
    sms_enabled = CASE 
      WHEN tier IN ('professional', 'enterprise', 'growth', 'pro') THEN true
      ELSE false
    END,
    ai_features_enabled = true
  WHERE leads_per_property IS NULL;
END $$;

-- Table 3: Generated leads (separate from regular leads)
CREATE TABLE IF NOT EXISTS public.generated_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lead information
  lead_buyer_name TEXT NOT NULL,
  lead_buyer_email TEXT,
  lead_buyer_phone TEXT,
  lead_quality_score INTEGER NOT NULL DEFAULT 50 CHECK (lead_quality_score >= 0 AND lead_quality_score <= 100),
  
  -- Lead metadata
  interest_level TEXT CHECK (interest_level IN ('high', 'medium', 'low')),
  estimated_budget NUMERIC,
  timeline TEXT CHECK (timeline IN ('immediate', '3months', '6months', '1year')),
  preferred_location TEXT,
  property_type_preference TEXT,
  
  -- Status tracking
  lead_status TEXT NOT NULL DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  
  -- Notification tracking
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  builder_notified_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for generated_leads
CREATE INDEX IF NOT EXISTS idx_generated_leads_property ON public.generated_leads(property_id);
CREATE INDEX IF NOT EXISTS idx_generated_leads_builder ON public.generated_leads(builder_id);
CREATE INDEX IF NOT EXISTS idx_generated_leads_status ON public.generated_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_generated_leads_score ON public.generated_leads(lead_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_generated_leads_created ON public.generated_leads(created_at DESC);

-- Table 4: Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'trial', 'professional', 'growth', 'enterprise', 'pro')),
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_tier ON public.email_templates(tier, is_active);

-- Table 5: Processing jobs (for tracking background jobs)
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Job details
  job_type TEXT NOT NULL DEFAULT 'lead_generation' CHECK (job_type IN ('lead_generation', 'email_send', 'sms_send')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Results
  result_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  error_stack TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_property ON public.processing_jobs(property_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_builder ON public.processing_jobs(builder_id);

-- Table 6: Email delivery logs
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email details
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  
  -- Delivery status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  provider_message_id TEXT,
  provider_response JSONB,
  
  -- Timing
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_builder ON public.email_delivery_logs(builder_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status ON public.email_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_created ON public.email_delivery_logs(created_at DESC);

-- Table 7: SMS delivery logs
CREATE TABLE IF NOT EXISTS public.sms_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- SMS details
  recipient_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  
  -- Delivery status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_message_id TEXT,
  provider_response JSONB,
  
  -- Timing
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_logs_builder ON public.sms_delivery_logs(builder_id);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_logs_status ON public.sms_delivery_logs(status);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_generated_leads_updated_at ON public.generated_leads;
CREATE TRIGGER update_generated_leads_updated_at
  BEFORE UPDATE ON public.generated_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_processing_jobs_updated_at ON public.processing_jobs;
CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get builder email
CREATE OR REPLACE FUNCTION get_builder_email(p_builder_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_builder_id;
  
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get builder name
CREATE OR REPLACE FUNCTION get_builder_name(p_builder_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT 
    COALESCE(
      (SELECT full_name FROM public.profiles WHERE user_id = p_builder_id),
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = p_builder_id),
      (SELECT email FROM auth.users WHERE id = p_builder_id)
    ) INTO v_name;
  
  RETURN v_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Generated leads RLS
ALTER TABLE public.generated_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their generated leads" ON public.generated_leads;
CREATE POLICY "Builders can view their generated leads"
  ON public.generated_leads FOR SELECT
  USING (builder_id = auth.uid());

DROP POLICY IF EXISTS "System can insert generated leads" ON public.generated_leads;
CREATE POLICY "System can insert generated leads"
  ON public.generated_leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Builders can update their generated leads" ON public.generated_leads;
CREATE POLICY "Builders can update their generated leads"
  ON public.generated_leads FOR UPDATE
  USING (builder_id = auth.uid());

-- Email templates RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active email templates" ON public.email_templates;
CREATE POLICY "Everyone can view active email templates"
  ON public.email_templates FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Processing jobs RLS
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their processing jobs" ON public.processing_jobs;
CREATE POLICY "Builders can view their processing jobs"
  ON public.processing_jobs FOR SELECT
  USING (builder_id = auth.uid());

DROP POLICY IF EXISTS "System can manage processing jobs" ON public.processing_jobs;
CREATE POLICY "System can manage processing jobs"
  ON public.processing_jobs FOR ALL
  WITH CHECK (true);

-- Email delivery logs RLS
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their email logs" ON public.email_delivery_logs;
CREATE POLICY "Builders can view their email logs"
  ON public.email_delivery_logs FOR SELECT
  USING (builder_id = auth.uid());

DROP POLICY IF EXISTS "System can insert email logs" ON public.email_delivery_logs;
CREATE POLICY "System can insert email logs"
  ON public.email_delivery_logs FOR INSERT
  WITH CHECK (true);

-- SMS delivery logs RLS
ALTER TABLE public.sms_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their SMS logs" ON public.sms_delivery_logs;
CREATE POLICY "Builders can view their SMS logs"
  ON public.sms_delivery_logs FOR SELECT
  USING (builder_id = auth.uid());

DROP POLICY IF EXISTS "System can insert SMS logs" ON public.sms_delivery_logs;
CREATE POLICY "System can insert SMS logs"
  ON public.sms_delivery_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- SEED DATA: Default email templates
-- =============================================

-- Starter/Trial tier template
INSERT INTO public.email_templates (tier, template_name, subject, html_body, text_body)
VALUES (
  'starter',
  'New Leads Generated - Starter',
  '🎉 {{leadCount}} New Leads Generated for {{propertyName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Leads Generated</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2563eb; margin-top: 0;">New Leads Generated! 🎉</h2>
    
    <p>Hi {{builderName}},</p>
    
    <p>Your property <strong>{{propertyName}}</strong> has been analyzed by our AI. 
    We found <strong>{{leadCount}}</strong> interested buyers.</p>
    
    <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e40af;">Top Quality Leads (Score > 70)</h3>
      <p style="font-size: 18px; font-weight: bold; color: #2563eb;">{{qualityLeads}} high-quality leads</p>
      <p style="margin-bottom: 0;">These leads have shown strong interest and match your property criteria.</p>
    </div>
    
    <h3 style="color: #1e40af;">All Leads Summary</h3>
    {{leadsTable}}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <h3 style="color: #1e40af;">Next Steps</h3>
      <ul style="line-height: 1.8;">
        <li>Review leads in your <a href="https://tharaga.co.in/dashboard/leads" style="color: #2563eb;">Tharaga dashboard</a></li>
        <li>Use templates to reach out to buyers</li>
        <li>Track responses and conversions</li>
      </ul>
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Questions? <a href="mailto:support@tharaga.co.in" style="color: #2563eb;">Contact us</a>
      </p>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      - Tharaga Team<br>
      <a href="https://tharaga.co.in" style="color: #2563eb;">tharaga.co.in</a>
    </p>
  </div>
</body>
</html>',
  'New Leads Generated!\n\nHi {{builderName}},\n\nYour property {{propertyName}} has been analyzed by our AI. We found {{leadCount}} interested buyers.\n\nTop Quality Leads: {{qualityLeads}} high-quality leads\n\nView all leads: https://tharaga.co.in/dashboard/leads\n\n- Tharaga Team'
)
ON CONFLICT DO NOTHING;

-- Professional/Growth tier template
INSERT INTO public.email_templates (tier, template_name, subject, html_body, text_body)
VALUES (
  'professional',
  'New Leads Generated - Professional',
  '🚀 {{leadCount}} Quality Leads Ready for {{propertyName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Leads Generated</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2563eb; margin-top: 0;">🚀 Quality Leads Ready!</h2>
    
    <p>Hi {{builderName}},</p>
    
    <p>Great news! Your property <strong>{{propertyName}}</strong> has generated <strong>{{leadCount}}</strong> qualified buyer leads.</p>
    
    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e40af;">Lead Quality Breakdown</h3>
      <p style="font-size: 16px; margin: 5px 0;"><strong>High Quality (80+):</strong> {{highQualityLeads}} leads</p>
      <p style="font-size: 16px; margin: 5px 0;"><strong>Medium Quality (50-79):</strong> {{mediumQualityLeads}} leads</p>
      <p style="font-size: 16px; margin: 5px 0;"><strong>Total Quality Leads (70+):</strong> {{qualityLeads}} leads</p>
    </div>
    
    <h3 style="color: #1e40af;">Top 10 Leads Preview</h3>
    {{leadsTable}}
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="https://tharaga.co.in/dashboard/leads" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View All Leads in Dashboard</a>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <h3 style="color: #1e40af;">Pro Tips</h3>
      <ul style="line-height: 1.8;">
        <li>Contact high-quality leads within 24 hours for best conversion</li>
        <li>Use our AI-powered messaging templates</li>
        <li>Track engagement in your dashboard</li>
      </ul>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      - Tharaga Team<br>
      <a href="https://tharaga.co.in" style="color: #2563eb;">tharaga.co.in</a>
    </p>
  </div>
</body>
</html>',
  'Quality Leads Ready!\n\nHi {{builderName}},\n\nYour property {{propertyName}} has generated {{leadCount}} qualified buyer leads.\n\nHigh Quality (80+): {{highQualityLeads}}\nMedium Quality (50-79): {{mediumQualityLeads}}\nTotal Quality Leads (70+): {{qualityLeads}}\n\nView all leads: https://tharaga.co.in/dashboard/leads\n\n- Tharaga Team'
)
ON CONFLICT DO NOTHING;

-- Enterprise/Pro tier template
INSERT INTO public.email_templates (tier, template_name, subject, html_body, text_body)
VALUES (
  'enterprise',
  'New Leads Generated - Enterprise',
  '⚡ {{leadCount}} Premium Leads Generated - Action Required',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Leads Generated</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2563eb; margin-top: 0;">⚡ Premium Leads Generated!</h2>
    
    <p>Hi {{builderName}},</p>
    
    <p>Excellent! Our AI has analyzed your property <strong>{{propertyName}}</strong> and generated <strong>{{leadCount}}</strong> premium buyer leads.</p>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: white;">Lead Quality Analytics</h3>
      <div style="display: flex; justify-content: space-between; margin-top: 15px;">
        <div>
          <p style="font-size: 24px; font-weight: bold; margin: 0;">{{highQualityLeads}}</p>
          <p style="margin: 0; font-size: 14px;">Premium (80+)</p>
        </div>
        <div>
          <p style="font-size: 24px; font-weight: bold; margin: 0;">{{mediumQualityLeads}}</p>
          <p style="margin: 0; font-size: 14px;">Good (50-79)</p>
        </div>
        <div>
          <p style="font-size: 24px; font-weight: bold; margin: 0;">{{qualityLeads}}</p>
          <p style="margin: 0; font-size: 14px;">Total (70+)</p>
        </div>
      </div>
    </div>
    
    <h3 style="color: #1e40af;">Top 15 Premium Leads</h3>
    {{leadsTable}}
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="https://tharaga.co.in/dashboard/leads" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Access Full Lead Dashboard</a>
    </div>
    
    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #15803d;">Enterprise Features Active</h3>
      <ul style="line-height: 1.8; margin-bottom: 0;">
        <li>AI-powered lead scoring and prioritization</li>
        <li>Automated follow-up sequences</li>
        <li>CRM integration ready</li>
        <li>Advanced analytics and insights</li>
      </ul>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Need help? Contact your dedicated account manager or <a href="mailto:support@tharaga.co.in" style="color: #2563eb;">support@tharaga.co.in</a>
      </p>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      - Tharaga Enterprise Team<br>
      <a href="https://tharaga.co.in" style="color: #2563eb;">tharaga.co.in</a>
    </p>
  </div>
</body>
</html>',
  'Premium Leads Generated!\n\nHi {{builderName}},\n\nOur AI has analyzed your property {{propertyName}} and generated {{leadCount}} premium buyer leads.\n\nLead Quality:\n- Premium (80+): {{highQualityLeads}}\n- Good (50-79): {{mediumQualityLeads}}\n- Total Quality (70+): {{qualityLeads}}\n\nAccess full dashboard: https://tharaga.co.in/dashboard/leads\n\n- Tharaga Enterprise Team'
)
ON CONFLICT DO NOTHING;

-- Also insert for 'trial', 'growth', 'pro' tiers (map to appropriate templates)
INSERT INTO public.email_templates (tier, template_name, subject, html_body, text_body)
SELECT 
  'trial' as tier,
  template_name,
  subject,
  html_body,
  text_body
FROM public.email_templates
WHERE tier = 'starter'
ON CONFLICT DO NOTHING;

INSERT INTO public.email_templates (tier, template_name, subject, html_body, text_body)
SELECT 
  'growth' as tier,
  template_name,
  subject,
  html_body,
  text_body
FROM public.email_templates
WHERE tier = 'professional'
ON CONFLICT DO NOTHING;

INSERT INTO public.email_templates (tier, template_name, subject, html_body, text_body)
SELECT 
  'pro' as tier,
  template_name,
  subject,
  html_body,
  text_body
FROM public.email_templates
WHERE tier = 'enterprise'
ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.generated_leads IS 'AI-generated leads for properties, separate from buyer-submitted leads';
COMMENT ON TABLE public.email_templates IS 'Email templates for different subscription tiers';
COMMENT ON TABLE public.processing_jobs IS 'Background job tracking for property processing';
COMMENT ON TABLE public.email_delivery_logs IS 'Logs of all emails sent to builders';
COMMENT ON TABLE public.sms_delivery_logs IS 'Logs of all SMS sent to builders';

