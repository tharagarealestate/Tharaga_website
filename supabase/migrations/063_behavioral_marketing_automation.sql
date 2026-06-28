-- =============================================
-- BEHAVIORAL MARKETING AUTOMATION ENGINE
-- Advanced Psychology-Driven Lead Generation & Automation System
-- =============================================

-- =============================================
-- 1. BUYER_BEHAVIORAL_SIGNALS TABLE
-- Tracks every micro-interaction across the platform
-- =============================================
CREATE TABLE IF NOT EXISTS public.buyer_behavioral_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Event Classification
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'page_view', 'property_view', 'property_favorite',
    'calculator_use', 'document_download', 'image_view', 'image_zoom',
    'amenity_check', 'location_search', 'map_interaction',
    'pricing_check', 'emi_calculation', 'roi_analysis',
    'testimonial_view', 'video_view', 'comparison_action',
    'search_refinement', 'filter_application', 'share_action',
    'contact_builder_click', 'schedule_visit_click', 'chat_initiated'
  )),
  
  -- Rich Event Metadata
  event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Context
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  builder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser VARCHAR(50),
  location_city VARCHAR(100),
  time_of_day TIME,
  
  -- Scoring
  signal_weight INTEGER DEFAULT 0,
  cumulative_session_score INTEGER DEFAULT 0,
  
  -- Indexing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buyer_signals_buyer_id ON public.buyer_behavioral_signals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_signals_timestamp ON public.buyer_behavioral_signals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_buyer_signals_event_type ON public.buyer_behavioral_signals(event_type);
CREATE INDEX IF NOT EXISTS idx_buyer_signals_property ON public.buyer_behavioral_signals(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyer_signals_session ON public.buyer_behavioral_signals(session_id);

-- =============================================
-- 2. BUYER_PSYCHOLOGICAL_PROFILE TABLE
-- Stores classified psychological buyer type
-- =============================================
CREATE TABLE IF NOT EXISTS public.buyer_psychological_profile (
  buyer_id BIGINT PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Classification Results
  primary_type VARCHAR(20) NOT NULL CHECK (primary_type IN ('MONKEY', 'LION', 'DOG')),
  secondary_type VARCHAR(20) CHECK (secondary_type IN ('MONKEY', 'LION', 'DOG')),
  confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Detailed Scoring
  type_indicators JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Lifecycle Tracking
  classification_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_behavior_shift TIMESTAMPTZ,
  behavior_history JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  total_sessions_analyzed INTEGER DEFAULT 0,
  last_analyzed_session_id UUID,
  next_reanalysis_due TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_buyer_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS buyer_profile_update_timestamp ON public.buyer_psychological_profile;
CREATE TRIGGER buyer_profile_update_timestamp
BEFORE UPDATE ON public.buyer_psychological_profile
FOR EACH ROW
EXECUTE FUNCTION update_buyer_profile_timestamp();

-- =============================================
-- 3. READINESS_SIGNAL_TRIGGERS TABLE
-- Tracks the 10 readiness signals and automated actions
-- =============================================
CREATE TABLE IF NOT EXISTS public.readiness_signal_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Signal Details
  signal_name VARCHAR(100) NOT NULL CHECK (signal_name IN (
    'time_spent_3min_plus',
    'visited_pricing_calculator',
    'viewed_3plus_images',
    'downloaded_spec_sheet',
    'viewed_testimonials',
    'searched_nearby_amenities',
    'searched_schools_hospitals',
    'checked_traffic_commute',
    'visited_community_page_2plus',
    'accessed_contact_booking'
  )),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signal_weight INTEGER NOT NULL DEFAULT 1,
  
  -- Context
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  
  -- Automation Tracking
  automated_action_triggered BOOLEAN DEFAULT FALSE,
  action_type VARCHAR(100),
  action_details JSONB DEFAULT '{}'::jsonb,
  action_result VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readiness_buyer_id ON public.readiness_signal_triggers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_readiness_property ON public.readiness_signal_triggers(property_id);
CREATE INDEX IF NOT EXISTS idx_readiness_timestamp ON public.readiness_signal_triggers(triggered_at DESC);

-- =============================================
-- 4. BEHAVIORAL_AUTOMATION_RULES TABLE
-- Configurable rules for triggering automation workflows
-- =============================================
CREATE TABLE IF NOT EXISTS public.behavioral_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule Identification
  rule_name VARCHAR(200) NOT NULL UNIQUE,
  rule_description TEXT,
  priority INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT TRUE,
  
  -- Trigger Conditions
  buyer_type VARCHAR(20) CHECK (buyer_type IN ('MONKEY', 'LION', 'DOG', 'ANY')),
  min_readiness_score INTEGER DEFAULT 0 CHECK (min_readiness_score >= 0 AND min_readiness_score <= 10),
  required_signals JSONB DEFAULT '[]'::jsonb,
  time_window_hours INTEGER DEFAULT 24,
  
  -- Action Configuration
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'send_email',
    'send_whatsapp',
    'send_sms',
    'assign_agent',
    'schedule_callback',
    'trigger_retargeting_ad',
    'send_push_notification'
  )),
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Performance Tracking
  times_triggered INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  avg_response_time_hours DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. LEAD_CAPTURE_SUBMISSIONS TABLE
-- Progressive profiling form submissions
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_capture_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Form Identification
  form_type VARCHAR(100) NOT NULL CHECK (form_type IN (
    'property_comparison_tool',
    'roi_calculator',
    'emi_calculator',
    'neighborhood_finder',
    'property_valuation',
    'budget_planner',
    'home_loan_eligibility'
  )),
  form_variant VARCHAR(50),
  
  -- Submission Data
  step_1_data JSONB DEFAULT '{}'::jsonb,
  step_2_data JSONB DEFAULT '{}'::jsonb,
  step_3_data JSONB DEFAULT '{}'::jsonb,
  step_4_data JSONB DEFAULT '{}'::jsonb,
  
  -- Completion Tracking
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
  completed BOOLEAN DEFAULT FALSE,
  completion_rate DECIMAL(5,2),
  
  -- Attribution
  source VARCHAR(100),
  utm_params JSONB DEFAULT '{}'::jsonb,
  landing_page_url TEXT,
  referrer_url TEXT,
  
  -- Engagement Metrics
  time_to_complete_seconds INTEGER,
  abandonment_step INTEGER,
  ip_address INET,
  user_agent TEXT,
  
  -- Lead Association
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON public.lead_capture_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_completed ON public.lead_capture_submissions(completed);
CREATE INDEX IF NOT EXISTS idx_form_submissions_lead_id ON public.lead_capture_submissions(lead_id);

-- =============================================
-- 6. FORM_VARIANT_PERFORMANCE TABLE
-- A/B testing framework for forms
-- =============================================
CREATE TABLE IF NOT EXISTS public.form_variant_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Variant Identification
  form_type VARCHAR(100) NOT NULL,
  variant_name VARCHAR(50) NOT NULL,
  variant_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Performance Metrics
  impressions INTEGER DEFAULT 0,
  step_1_completions INTEGER DEFAULT 0,
  step_2_completions INTEGER DEFAULT 0,
  step_3_completions INTEGER DEFAULT 0,
  full_completions INTEGER DEFAULT 0,
  
  -- Conversion Rates
  step_1_conversion_rate DECIMAL(5,2),
  step_2_conversion_rate DECIMAL(5,2),
  step_3_conversion_rate DECIMAL(5,2),
  overall_conversion_rate DECIMAL(5,2),
  
  -- Quality Metrics
  avg_time_to_complete_seconds INTEGER,
  avg_lead_score DECIMAL(5,2),
  qualified_leads_count INTEGER DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  test_start_date TIMESTAMPTZ DEFAULT NOW(),
  test_end_date TIMESTAMPTZ,
  winner BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. ROW LEVEL SECURITY
-- =============================================

-- Buyer Behavioral Signals
ALTER TABLE public.buyer_behavioral_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert behavioral signals" ON public.buyer_behavioral_signals;
CREATE POLICY "Public can insert behavioral signals"
  ON public.buyer_behavioral_signals FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Builders can view their lead signals" ON public.buyer_behavioral_signals;
CREATE POLICY "Builders can view their lead signals"
  ON public.buyer_behavioral_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = buyer_behavioral_signals.buyer_id
      AND leads.builder_id = auth.uid()
    )
  );

-- Buyer Psychological Profile
ALTER TABLE public.buyer_psychological_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their lead profiles" ON public.buyer_psychological_profile;
CREATE POLICY "Builders can view their lead profiles"
  ON public.buyer_psychological_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = buyer_psychological_profile.buyer_id
      AND leads.builder_id = auth.uid()
    )
  );

-- Readiness Signal Triggers
ALTER TABLE public.readiness_signal_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their readiness signals" ON public.readiness_signal_triggers;
CREATE POLICY "Builders can view their readiness signals"
  ON public.readiness_signal_triggers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = readiness_signal_triggers.buyer_id
      AND leads.builder_id = auth.uid()
    )
  );

-- Lead Capture Submissions
ALTER TABLE public.lead_capture_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert form submissions" ON public.lead_capture_submissions;
CREATE POLICY "Public can insert form submissions"
  ON public.lead_capture_submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Builders can view their lead submissions" ON public.lead_capture_submissions;
CREATE POLICY "Builders can view their lead submissions"
  ON public.lead_capture_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_capture_submissions.lead_id
      AND leads.builder_id = auth.uid()
    )
  );

-- =============================================
-- 8. COMMENTS
-- =============================================
COMMENT ON TABLE public.buyer_behavioral_signals IS 'Tracks every micro-interaction across the platform for behavioral analysis';
COMMENT ON TABLE public.buyer_psychological_profile IS 'Stores the classified psychological buyer type based on behavioral signals';
COMMENT ON TABLE public.readiness_signal_triggers IS 'Tracks the 10 readiness signals and automated actions triggered';
COMMENT ON TABLE public.behavioral_automation_rules IS 'Configurable rules for triggering automation workflows based on behavior';
COMMENT ON TABLE public.lead_capture_submissions IS 'Progressive profiling form submissions with step-by-step data collection';
COMMENT ON TABLE public.form_variant_performance IS 'A/B testing framework for form conversion optimization';

