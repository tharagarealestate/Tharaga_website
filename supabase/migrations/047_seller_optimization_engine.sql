-- =============================================
-- FEATURE 8: AI-POWERED SELLER OPTIMIZATION ENGINE
-- Comprehensive real-time optimization system
-- =============================================

-- =============================================
-- 1. LISTING PERFORMANCE METRICS (Real-time)
-- =============================================
CREATE TABLE IF NOT EXISTS public.listing_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE UNIQUE,
  
  -- View Metrics (from behavior_tracking)
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  avg_time_on_listing_sec DECIMAL(10,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0, -- % who leave immediately
  
  -- Engagement Metrics
  saves_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  contact_requests INTEGER DEFAULT 0,
  site_visit_requests INTEGER DEFAULT 0,
  
  -- Lead Generation
  leads_generated INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0, -- SmartScore >= 70
  hot_leads INTEGER DEFAULT 0, -- SmartScore >= 90
  
  -- Conversion Funnel
  view_to_save_rate DECIMAL(5,2) DEFAULT 0,
  view_to_contact_rate DECIMAL(5,2) DEFAULT 0,
  contact_to_visit_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Competitive Metrics
  market_position INTEGER, -- Rank among similar properties
  price_competitiveness DECIMAL(5,2), -- -100 (overpriced) to 100 (underpriced)
  
  -- Time-based Analysis
  last_7_days_views INTEGER DEFAULT 0,
  last_30_days_views INTEGER DEFAULT 0,
  view_trend TEXT, -- 'increasing', 'decreasing', 'stable'
  
  -- Performance Score (0-100)
  overall_score DECIMAL(5,2) DEFAULT 0,
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_metrics_property ON public.listing_performance_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_score ON public.listing_performance_metrics(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_updated ON public.listing_performance_metrics(updated_at DESC);

-- Enable real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS listing_performance_metrics;

-- =============================================
-- 2. AI OPTIMIZATION SUGGESTIONS (Enhanced)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Suggestion Details
  category TEXT NOT NULL, -- 'pricing', 'images', 'description', 'amenities', 'marketing'
  suggestion_type TEXT NOT NULL, -- Specific type within category
  priority TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  impact_score DECIMAL(5,2) NOT NULL, -- Estimated impact on performance (0-100)
  
  -- AI-generated Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detailed_analysis JSONB, -- AI reasoning
  action_steps JSONB, -- [{step: 1, action: "...", difficulty: "easy"}]
  
  -- Improvement Estimates
  estimated_view_increase_pct DECIMAL(5,2),
  estimated_lead_increase_pct DECIMAL(5,2),
  expected_timeframe_days INTEGER,
  
  -- Implementation Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'implemented', 'dismissed'
  implemented_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT,
  
  -- Results Tracking
  baseline_metrics JSONB, -- Metrics before implementation
  post_implementation_metrics JSONB, -- Metrics after
  actual_improvement_pct DECIMAL(5,2),
  
  -- AI Model Info
  ai_model_used TEXT DEFAULT 'llama-3.1-8b',
  confidence_score DECIMAL(5,2), -- AI confidence in suggestion
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_property ON public.ai_optimization_suggestions(property_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_priority ON public.ai_optimization_suggestions(priority, impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_category ON public.ai_optimization_suggestions(category, status);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS ai_optimization_suggestions;

-- =============================================
-- 3. COMPETITIVE ANALYSIS DATA
-- =============================================
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Market Context
  location TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  
  -- Competitive Set
  total_competitors INTEGER DEFAULT 0,
  direct_competitors JSONB, -- Array of similar property IDs
  
  -- Price Analysis
  market_avg_price DECIMAL(12,2),
  market_median_price DECIMAL(12,2),
  property_price DECIMAL(12,2),
  price_percentile DECIMAL(5,2), -- Where this property stands (0-100)
  
  -- Performance Benchmarks
  avg_market_views_per_week DECIMAL(10,2),
  avg_market_leads_per_week DECIMAL(10,2),
  property_views_per_week DECIMAL(10,2),
  property_leads_per_week DECIMAL(10,2),
  
  -- Relative Performance
  view_performance_index DECIMAL(5,2), -- 100 = market average
  lead_performance_index DECIMAL(5,2),
  
  -- Feature Comparison
  amenity_score DECIMAL(5,2), -- How many amenities vs competitors
  image_quality_score DECIMAL(5,2),
  description_quality_score DECIMAL(5,2),
  
  -- Market Insights
  market_trends JSONB, -- {demand_trend: 'high', supply_trend: 'low', ...}
  competitive_advantages JSONB, -- What makes this property stand out
  competitive_disadvantages JSONB, -- What competitors do better
  
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competitive_property ON public.competitive_analysis(property_id);
CREATE INDEX IF NOT EXISTS idx_competitive_location ON public.competitive_analysis(location, property_type);

-- =============================================
-- 4. IMAGE QUALITY ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS public.image_quality_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  
  -- Technical Quality
  resolution_score DECIMAL(5,2), -- 0-100
  brightness_score DECIMAL(5,2),
  contrast_score DECIMAL(5,2),
  sharpness_score DECIMAL(5,2),
  color_balance_score DECIMAL(5,2),
  
  -- Content Analysis
  composition_score DECIMAL(5,2), -- Rule of thirds, framing
  object_detection JSONB, -- What's in the image
  room_type TEXT, -- Detected room type
  is_professional_photo BOOLEAN,
  
  -- Issues Detected
  issues JSONB, -- [{issue: "dark lighting", severity: "high", fix: "..."}]
  
  -- Overall Score
  overall_quality_score DECIMAL(5,2),
  
  -- AI Model
  analysis_model TEXT DEFAULT 'clip-vit-base',
  
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_quality_property ON public.image_quality_analysis(property_id);
CREATE INDEX IF NOT EXISTS idx_image_quality_score ON public.image_quality_analysis(overall_quality_score ASC);

-- =============================================
-- 5. PRICING OPTIMIZATION DATA
-- =============================================
CREATE TABLE IF NOT EXISTS public.pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Current Pricing
  current_price DECIMAL(12,2) NOT NULL,
  
  -- AI Recommendations
  recommended_price DECIMAL(12,2) NOT NULL,
  price_adjustment_pct DECIMAL(5,2), -- % change recommended
  
  -- Pricing Strategy
  strategy TEXT NOT NULL, -- 'competitive', 'premium', 'value', 'urgent'
  reasoning JSONB, -- AI explanation
  
  -- Market Data
  market_avg_price_per_sqft DECIMAL(10,2),
  property_price_per_sqft DECIMAL(10,2),
  comparable_properties JSONB, -- Recent sales/listings
  
  -- Demand Indicators
  view_velocity DECIMAL(10,2), -- Views per day trend
  inquiry_rate DECIMAL(5,2), -- % of viewers who inquire
  market_demand_score DECIMAL(5,2), -- 0-100
  
  -- Time on Market Analysis
  days_on_market INTEGER,
  optimal_days_range JSONB, -- {min: 14, max: 45}
  urgency_factor DECIMAL(5,2), -- Higher = need faster pricing action
  
  -- Confidence & Impact
  confidence_level DECIMAL(5,2),
  estimated_impact JSONB, -- {view_increase: 25, lead_increase: 40}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Recommendation validity period
);

CREATE INDEX IF NOT EXISTS idx_pricing_property ON public.pricing_recommendations(property_id, created_at DESC);

-- =============================================
-- 6. CONTENT OPTIMIZATION (AI Copy Suggestions)
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Content Type
  content_type TEXT NOT NULL, -- 'title', 'description', 'highlights', 'tagline'
  
  -- Original vs AI-generated
  original_content TEXT,
  ai_generated_content TEXT NOT NULL,
  
  -- AI Analysis
  improvement_areas JSONB, -- What was improved
  seo_score_original DECIMAL(5,2),
  seo_score_new DECIMAL(5,2),
  readability_score_original DECIMAL(5,2),
  readability_score_new DECIMAL(5,2),
  emotional_appeal_score DECIMAL(5,2),
  
  -- A/B Test Results (if tested)
  is_active BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  
  -- Performance vs Original
  performance_uplift DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_variations_property ON public.content_variations(property_id);

-- =============================================
-- 7. OPTIMIZATION CAMPAIGNS
-- =============================================
CREATE TABLE IF NOT EXISTS public.optimization_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID REFERENCES public.profiles(id),
  
  campaign_name TEXT NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  target_end_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  
  -- Goals
  primary_goal TEXT, -- 'increase_views', 'increase_leads', 'faster_sale', 'better_price'
  target_metrics JSONB, -- {view_increase_target: 50, lead_increase_target: 30}
  
  -- Implemented Changes
  changes_implemented JSONB, -- Array of optimization IDs applied
  
  -- Results
  baseline_performance JSONB,
  current_performance JSONB,
  improvement_achieved JSONB,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_property ON public.optimization_campaigns(property_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_builder ON public.optimization_campaigns(builder_id, status);

-- =============================================
-- REAL-TIME FUNCTIONS
-- =============================================

-- Function to calculate listing performance metrics
CREATE OR REPLACE FUNCTION calculate_listing_performance(p_property_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_views INTEGER := 0;
  v_unique_viewers INTEGER := 0;
  v_avg_time DECIMAL(10,2) := 0;
  v_bounce_rate DECIMAL(5,2) := 0;
  v_saves INTEGER := 0;
  v_shares INTEGER := 0;
  v_contact_requests INTEGER := 0;
  v_leads INTEGER := 0;
  v_qualified_leads INTEGER := 0;
  v_hot_leads INTEGER := 0;
  v_view_to_save DECIMAL(5,2) := 0;
  v_view_to_contact DECIMAL(5,2) := 0;
  v_last_7_days INTEGER := 0;
  v_last_30_days INTEGER := 0;
  v_trend TEXT := 'stable';
  v_overall_score DECIMAL(5,2) := 0;
  v_market_position INTEGER := 1;
  v_property RECORD;
BEGIN
  -- Get behavior tracking metrics from user_behavior table
  SELECT 
    COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' THEN id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' THEN user_id END)::INTEGER,
    AVG(CASE WHEN behavior_type = 'property_view' THEN duration ELSE NULL END)::DECIMAL(10,2),
    COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' AND duration < 10 THEN id END)::DECIMAL(5,2) / 
      NULLIF(COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' THEN id END), 0) * 100,
    COUNT(DISTINCT CASE WHEN behavior_type = 'saved_property' THEN id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN behavior_type = 'compared_properties' THEN id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' AND timestamp > NOW() - INTERVAL '7 days' THEN id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' AND timestamp > NOW() - INTERVAL '30 days' THEN id END)::INTEGER
  INTO 
    v_total_views, v_unique_viewers, v_avg_time, v_bounce_rate, 
    v_saves, v_shares, v_last_7_days, v_last_30_days
  FROM user_behavior
  WHERE property_id = p_property_id;
  
  -- Get lead metrics (property_id is text in leads table, convert UUID to text for comparison)
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE smartscore_v2 >= 70)::INTEGER,
    COUNT(*) FILTER (WHERE smartscore_v2 >= 90)::INTEGER
  INTO v_leads, v_qualified_leads, v_hot_leads
  FROM leads
  WHERE property_id = p_property_id::text;
  
  -- Get contact requests (from leads that have this property_id)
  SELECT COUNT(*)::INTEGER INTO v_contact_requests
  FROM leads
  WHERE property_id = p_property_id::text
  AND status IN ('contacted', 'interested', 'qualified');
  
  -- Calculate conversion rates
  v_view_to_save := CASE 
    WHEN v_total_views > 0 THEN (v_saves::DECIMAL / v_total_views * 100)
    ELSE 0 
  END;
  
  v_view_to_contact := CASE 
    WHEN v_total_views > 0 THEN (v_contact_requests::DECIMAL / v_total_views * 100)
    ELSE 0 
  END;
  
  -- Calculate view trend
  IF v_last_7_days > (v_last_30_days / 4.0) THEN
    v_trend := 'increasing';
  ELSIF v_last_7_days < (v_last_30_days / 4.0 * 0.7) THEN
    v_trend := 'decreasing';
  ELSE
    v_trend := 'stable';
  END IF;
  
  -- Calculate overall performance score
  v_overall_score := (
    (LEAST(v_total_views::DECIMAL / 100.0, 1.0) * 20) +
    (LEAST(COALESCE(v_avg_time, 0)::DECIMAL / 120.0, 1.0) * 15) +
    (v_view_to_save * 0.25) +
    (v_view_to_contact * 0.30) +
    ((100 - COALESCE(v_bounce_rate, 50)) * 0.10)
  );
  
  -- Get market position
  SELECT * INTO v_property FROM properties WHERE id = p_property_id;
  
  SELECT COUNT(*)::INTEGER + 1 INTO v_market_position
  FROM listing_performance_metrics lpm
  INNER JOIN properties p ON p.id = lpm.property_id
  WHERE p.location = v_property.location
  AND p.property_type = v_property.property_type
  AND p.bedrooms = v_property.bedrooms
  AND lpm.overall_score > v_overall_score
  AND p.id != p_property_id;
  
  -- Upsert performance metrics
  INSERT INTO listing_performance_metrics (
    property_id, total_views, unique_viewers, avg_time_on_listing_sec, bounce_rate,
    saves_count, shares_count, contact_requests, leads_generated, qualified_leads, hot_leads,
    view_to_save_rate, view_to_contact_rate, last_7_days_views, last_30_days_views,
    view_trend, overall_score, market_position, calculated_at, updated_at
  ) VALUES (
    p_property_id, v_total_views, v_unique_viewers, COALESCE(v_avg_time, 0), COALESCE(v_bounce_rate, 0),
    v_saves, v_shares, v_contact_requests, v_leads, v_qualified_leads, v_hot_leads,
    v_view_to_save, v_view_to_contact, v_last_7_days, v_last_30_days,
    v_trend, v_overall_score, v_market_position, NOW(), NOW()
  )
  ON CONFLICT (property_id) 
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_viewers = EXCLUDED.unique_viewers,
    avg_time_on_listing_sec = EXCLUDED.avg_time_on_listing_sec,
    bounce_rate = EXCLUDED.bounce_rate,
    saves_count = EXCLUDED.saves_count,
    shares_count = EXCLUDED.shares_count,
    contact_requests = EXCLUDED.contact_requests,
    leads_generated = EXCLUDED.leads_generated,
    qualified_leads = EXCLUDED.qualified_leads,
    hot_leads = EXCLUDED.hot_leads,
    view_to_save_rate = EXCLUDED.view_to_save_rate,
    view_to_contact_rate = EXCLUDED.view_to_contact_rate,
    last_7_days_views = EXCLUDED.last_7_days_views,
    last_30_days_views = EXCLUDED.last_30_days_views,
    view_trend = EXCLUDED.view_trend,
    overall_score = EXCLUDED.overall_score,
    market_position = EXCLUDED.market_position,
    calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update performance on new behavior
CREATE OR REPLACE FUNCTION trigger_update_listing_performance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_listing_performance(NEW.property_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_performance_on_behavior ON user_behavior;
CREATE TRIGGER auto_update_performance_on_behavior
AFTER INSERT OR UPDATE ON user_behavior
FOR EACH ROW
WHEN (NEW.property_id IS NOT NULL)
EXECUTE FUNCTION trigger_update_listing_performance();

-- Trigger to auto-update on new leads
CREATE OR REPLACE FUNCTION trigger_update_performance_on_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_property_uuid UUID;
BEGIN
  IF NEW.property_id IS NOT NULL THEN
    -- property_id in leads is text, try to convert to UUID
    BEGIN
      v_property_uuid := NEW.property_id::uuid;
      PERFORM calculate_listing_performance(v_property_uuid);
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, skip (invalid UUID format)
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_performance_on_lead ON leads;
CREATE TRIGGER auto_update_performance_on_lead
AFTER INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION trigger_update_performance_on_lead();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Listing Performance Metrics
ALTER TABLE public.listing_performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their performance metrics" ON public.listing_performance_metrics;
CREATE POLICY "Builders can view their performance metrics" ON public.listing_performance_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- AI Optimization Suggestions
ALTER TABLE public.ai_optimization_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their optimization suggestions" ON public.ai_optimization_suggestions;
CREATE POLICY "Builders can view their optimization suggestions" ON public.ai_optimization_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Builders can update their optimization suggestions" ON public.ai_optimization_suggestions;
CREATE POLICY "Builders can update their optimization suggestions" ON public.ai_optimization_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Competitive Analysis
ALTER TABLE public.competitive_analysis_new ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their competitive analysis" ON public.competitive_analysis_new;
CREATE POLICY "Builders can view their competitive analysis" ON public.competitive_analysis_new
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Image Quality Analysis
ALTER TABLE public.image_quality_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their image quality analysis" ON public.image_quality_analysis;
CREATE POLICY "Builders can view their image quality analysis" ON public.image_quality_analysis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Pricing Recommendations
ALTER TABLE public.pricing_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their pricing recommendations" ON public.pricing_recommendations;
CREATE POLICY "Builders can view their pricing recommendations" ON public.pricing_recommendations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Content Variations
ALTER TABLE public.content_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their content variations" ON public.content_variations;
CREATE POLICY "Builders can view their content variations" ON public.content_variations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Optimization Campaigns
ALTER TABLE public.optimization_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can manage their optimization campaigns" ON public.optimization_campaigns;
CREATE POLICY "Builders can manage their optimization campaigns" ON public.optimization_campaigns
FOR ALL
USING (
  builder_id = auth.uid()
);

-- Grant service role full access
GRANT ALL ON public.listing_performance_metrics TO service_role;
GRANT ALL ON public.ai_optimization_suggestions TO service_role;
GRANT ALL ON public.competitive_analysis TO service_role;
GRANT ALL ON public.image_quality_analysis TO service_role;
GRANT ALL ON public.pricing_recommendations TO service_role;
GRANT ALL ON public.content_variations TO service_role;
GRANT ALL ON public.optimization_campaigns TO service_role;

COMMENT ON TABLE public.listing_performance_metrics IS 'Real-time listing performance metrics';
COMMENT ON TABLE public.ai_optimization_suggestions IS 'AI-generated optimization suggestions with priority scoring';
COMMENT ON TABLE public.competitive_analysis IS 'Competitive benchmarking against similar properties';
COMMENT ON TABLE public.image_quality_analysis IS 'Image quality analysis with issue detection';
COMMENT ON TABLE public.pricing_recommendations IS 'AI-powered pricing recommendations';
COMMENT ON TABLE public.content_variations IS 'AI-generated content variations for A/B testing';
COMMENT ON TABLE public.optimization_campaigns IS 'Track optimization improvement campaigns';

