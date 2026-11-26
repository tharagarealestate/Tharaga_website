-- =============================================
-- WORKFLOWS 10-15: ANALYTICS, OPTIMIZATION & ADVANCED FEATURES
-- Workflows: Real-Time Analytics, Competitive Intelligence, ML Lead Scoring, Attribution, Voice Search, AR/VR
-- =============================================

-- =============================================
-- TABLE 1: CAMPAIGN_METRICS
-- Real-time performance metrics for ad campaigns
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON public.campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_property_id ON public.campaign_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timestamp ON public.campaign_metrics(metric_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_name ON public.campaign_metrics(metric_name);

-- =============================================
-- TABLE 2: LANDING_PAGE_EVENTS
-- Track user interactions on landing pages
-- =============================================
CREATE TABLE IF NOT EXISTS public.landing_page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_url TEXT,
  page_depth INTEGER DEFAULT 1,
  time_on_page NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_page_events_property_id ON public.landing_page_events(property_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_events_session_id ON public.landing_page_events(session_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_events_created_at ON public.landing_page_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_page_events_type ON public.landing_page_events(event_type);

-- =============================================
-- TABLE 3: SOCIAL_MEDIA_METRICS
-- Performance metrics for social media posts
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_media_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_media_posts(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_media_metrics_post_id ON public.social_media_metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_social_media_metrics_property_id ON public.social_media_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_social_media_metrics_updated_at ON public.social_media_metrics(updated_at DESC);

-- =============================================
-- TABLE 4: CAMPAIGN_PERFORMANCE_SNAPSHOTS
-- Historical snapshots of campaign performance
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaign_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform TEXT,
  platform_performance JSONB DEFAULT '{}'::jsonb,
  overall_metrics JSONB DEFAULT '{}'::jsonb,
  health_score INTEGER DEFAULT 0,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  automated_adjustments JSONB DEFAULT '[]'::jsonb,
  ab_test_results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_performance_snapshots_property_id ON public.campaign_performance_snapshots(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_snapshots_timestamp ON public.campaign_performance_snapshots(snapshot_timestamp DESC);

-- =============================================
-- TABLE 5: AB_TEST_VARIANTS
-- A/B test variants and their performance
-- =============================================
CREATE TABLE IF NOT EXISTS public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  variant_id TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  test_status TEXT DEFAULT 'running' CHECK (test_status IN ('running', 'paused', 'completed', 'archived')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_test_variants_property_id ON public.ab_test_variants(property_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test_name ON public.ab_test_variants(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_status ON public.ab_test_variants(test_status);

-- =============================================
-- TABLE 6: COMPETITOR_LISTINGS
-- Scraped competitor property listings
-- =============================================
CREATE TABLE IF NOT EXISTS public.competitor_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  carpet_area NUMERIC,
  price_per_sqft NUMERIC,
  url TEXT,
  scraped_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_listings_property_id ON public.competitor_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_competitor_listings_source ON public.competitor_listings(source);
CREATE INDEX IF NOT EXISTS idx_competitor_listings_scraped_at ON public.competitor_listings(scraped_at DESC);

-- =============================================
-- TABLE 7: PROPERTY_MARKET_INTELLIGENCE
-- Market analysis and pricing intelligence for individual properties
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  market_statistics JSONB DEFAULT '{}'::jsonb,
  pricing_analysis JSONB DEFAULT '{}'::jsonb,
  price_recommendation NUMERIC,
  competitor_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_market_intelligence_property_id ON public.property_market_intelligence(property_id);
CREATE INDEX IF NOT EXISTS idx_property_market_intelligence_analysis_date ON public.property_market_intelligence(analysis_date DESC);

-- =============================================
-- TABLE 8: LEAD_ML_PREDICTIONS
-- ML model predictions for lead scoring
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  prediction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model_version TEXT NOT NULL,
  feature_vector JSONB DEFAULT '[]'::jsonb,
  conversion_probability NUMERIC DEFAULT 0,
  lead_score INTEGER DEFAULT 0,
  segment TEXT CHECK (segment IN ('hot', 'warm', 'cold')),
  feature_importance JSONB DEFAULT '{}'::jsonb,
  triggers_detected JSONB DEFAULT '[]'::jsonb,
  actions_executed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_ml_predictions_lead_id ON public.lead_ml_predictions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_ml_predictions_timestamp ON public.lead_ml_predictions(prediction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lead_ml_predictions_segment ON public.lead_ml_predictions(segment);

-- =============================================
-- TABLE 9: ATTRIBUTION_RESULTS
-- Multi-touch attribution results
-- =============================================
CREATE TABLE IF NOT EXISTS public.attribution_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  conversion_value NUMERIC NOT NULL,
  attribution_model TEXT NOT NULL,
  attributions JSONB DEFAULT '[]'::jsonb,
  roi_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attribution_results_lead_id ON public.attribution_results(lead_id);
CREATE INDEX IF NOT EXISTS idx_attribution_results_model ON public.attribution_results(attribution_model);

-- =============================================
-- TABLE 10: VOICE_SEARCH_QUERIES
-- Voice search query tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.voice_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  device_type TEXT,
  platform TEXT, -- 'alexa', 'google_assistant', 'siri'
  intent_detected TEXT,
  results_returned INTEGER DEFAULT 0,
  conversion_occurred BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_search_queries_property_id ON public.voice_search_queries(property_id);
CREATE INDEX IF NOT EXISTS idx_voice_search_queries_created_at ON public.voice_search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_search_queries_platform ON public.voice_search_queries(platform);

-- =============================================
-- TABLE 11: AR_VR_SESSIONS
-- AR/VR virtual tour sessions
-- =============================================
CREATE TABLE IF NOT EXISTS public.ar_vr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('ar', 'vr', 'web_ar')),
  device_type TEXT,
  duration_seconds INTEGER DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,
  heatmap_data JSONB DEFAULT '{}'::jsonb,
  conversion_occurred BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_vr_sessions_property_id ON public.ar_vr_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_ar_vr_sessions_session_id ON public.ar_vr_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ar_vr_sessions_started_at ON public.ar_vr_sessions(started_at DESC);

-- =============================================
-- EXTEND PROPERTIES TABLE
-- Add columns for new workflow tracking
-- =============================================
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS last_optimization_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS campaign_health_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_marketing_spend NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_leads_generated INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_market_analysis_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pricing_position TEXT,
  ADD COLUMN IF NOT EXISTS competitiveness_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommended_price NUMERIC,
  ADD COLUMN IF NOT EXISTS ml_scoring_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS voice_search_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ar_vr_enabled BOOLEAN DEFAULT true;

-- =============================================
-- EXTEND LEADS TABLE
-- Add columns for ML scoring and attribution
-- =============================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS conversion_probability NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ml_segment TEXT CHECK (ml_segment IN ('hot', 'warm', 'cold')),
  ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS predicted_conversion_date TIMESTAMPTZ;

-- =============================================
-- EXTEND AD_CAMPAIGNS TABLE
-- Add columns for attribution tracking
-- =============================================
ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS total_attributed_revenue NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_conversions_attributed NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_roi NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_roas NUMERIC DEFAULT 0;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Campaign Metrics
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their campaign metrics" ON public.campaign_metrics;
CREATE POLICY "Builders can view their campaign metrics" ON public.campaign_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = campaign_metrics.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- Landing Page Events
ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their landing page events" ON public.landing_page_events;
CREATE POLICY "Builders can view their landing page events" ON public.landing_page_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = landing_page_events.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- Social Media Metrics
ALTER TABLE public.social_media_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their social media metrics" ON public.social_media_metrics;
CREATE POLICY "Builders can view their social media metrics" ON public.social_media_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = social_media_metrics.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- Campaign Performance Snapshots
ALTER TABLE public.campaign_performance_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their performance snapshots" ON public.campaign_performance_snapshots;
CREATE POLICY "Builders can view their performance snapshots" ON public.campaign_performance_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = campaign_performance_snapshots.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- AB Test Variants
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can manage their AB tests" ON public.ab_test_variants;
CREATE POLICY "Builders can manage their AB tests" ON public.ab_test_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ab_test_variants.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- Competitor Listings
ALTER TABLE public.competitor_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view competitor listings" ON public.competitor_listings;
CREATE POLICY "Builders can view competitor listings" ON public.competitor_listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = competitor_listings.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- Property Market Intelligence
ALTER TABLE public.property_market_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their market intelligence" ON public.property_market_intelligence;
CREATE POLICY "Builders can view their market intelligence" ON public.property_market_intelligence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_market_intelligence.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- Lead ML Predictions
ALTER TABLE public.lead_ml_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their lead predictions" ON public.lead_ml_predictions;
CREATE POLICY "Builders can view their lead predictions" ON public.lead_ml_predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.properties p ON l.property_id::uuid = p.id
      WHERE l.id = lead_ml_predictions.lead_id
      AND p.builder_id = auth.uid()
    )
  );

-- Attribution Results
ALTER TABLE public.attribution_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view attribution results" ON public.attribution_results;
CREATE POLICY "Builders can view attribution results" ON public.attribution_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.properties p ON l.property_id::uuid = p.id
      WHERE l.id = attribution_results.lead_id
      AND p.builder_id = auth.uid()
    )
  );

-- Voice Search Queries
ALTER TABLE public.voice_search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view voice search queries" ON public.voice_search_queries;
CREATE POLICY "Builders can view voice search queries" ON public.voice_search_queries
  FOR SELECT USING (
    property_id IS NULL OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = voice_search_queries.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- AR/VR Sessions
ALTER TABLE public.ar_vr_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view AR/VR sessions" ON public.ar_vr_sessions;
CREATE POLICY "Builders can view AR/VR sessions" ON public.ar_vr_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ar_vr_sessions.property_id
      AND p.builder_id = auth.uid()
    )
  );

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.campaign_metrics IS 'Real-time performance metrics for ad campaigns';
COMMENT ON TABLE public.landing_page_events IS 'User interactions and events on property landing pages';
COMMENT ON TABLE public.social_media_metrics IS 'Performance metrics for social media posts';
COMMENT ON TABLE public.campaign_performance_snapshots IS 'Historical snapshots of campaign performance for analytics';
COMMENT ON TABLE public.ab_test_variants IS 'A/B test variants and their performance data';
COMMENT ON TABLE public.competitor_listings IS 'Scraped competitor property listings for market intelligence';
COMMENT ON TABLE public.property_market_intelligence IS 'AI-generated market analysis and pricing intelligence for individual properties';
COMMENT ON TABLE public.lead_ml_predictions IS 'ML model predictions for lead scoring and conversion probability';
COMMENT ON TABLE public.attribution_results IS 'Multi-touch attribution results across marketing channels';
COMMENT ON TABLE public.voice_search_queries IS 'Voice search query tracking for Alexa, Google Assistant, etc.';
COMMENT ON TABLE public.ar_vr_sessions IS 'AR/VR virtual tour session tracking and analytics';

