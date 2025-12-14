-- =============================================
-- SELLER/LISTING OPTIMIZATION ENGINE
-- Listing performance, optimization suggestions, A/B testing, competitor analysis
-- =============================================

-- Track listing performance metrics
CREATE TABLE IF NOT EXISTS public.listing_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE UNIQUE,
  views_total INTEGER DEFAULT 0,
  views_unique INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  site_visits_scheduled INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  avg_time_on_page DECIMAL(10,2), -- seconds
  bounce_rate DECIMAL(5,2), -- percentage
  click_through_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  performance_score DECIMAL(5,2), -- 0-100
  benchmark_percentile DECIMAL(5,2), -- vs similar properties
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_property ON public.listing_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_performance_score ON public.listing_performance(performance_score DESC);

-- AI-generated optimization suggestions
CREATE TABLE IF NOT EXISTS public.optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'image', 'price', 'description', 'amenities', 'timing'
  suggestion_category TEXT, -- 'critical', 'high', 'medium', 'low'
  suggestion_title TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  expected_impact TEXT, -- 'high', 'medium', 'low'
  estimated_improvement DECIMAL(5,2), -- Expected % improvement
  action_required TEXT,
  is_implemented BOOLEAN DEFAULT false,
  implemented_at TIMESTAMPTZ,
  impact_measured DECIMAL(5,2), -- Actual improvement
  confidence_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_suggestions_property ON public.optimization_suggestions(property_id, suggestion_category);
CREATE INDEX IF NOT EXISTS idx_suggestions_active ON public.optimization_suggestions(is_implemented, expected_impact DESC);

-- A/B testing experiments
CREATE TABLE IF NOT EXISTS public.listing_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  experiment_type TEXT NOT NULL, -- 'headline', 'primary_image', 'price', 'description'
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  winner_variant TEXT, -- 'a', 'b', or null if ongoing
  metrics JSONB, -- {variant_a: {views, clicks}, variant_b: {...}}
  statistical_significance DECIMAL(5,2),
  status TEXT DEFAULT 'running', -- running, completed, cancelled
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_experiments_property ON public.listing_experiments(property_id, status);

-- Competitor analysis
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  competitor_property_id UUID REFERENCES public.properties(id),
  similarity_score DECIMAL(5,2), -- How similar properties are
  comparison_metrics JSONB, -- {price_diff, size_diff, amenities_diff}
  competitive_advantages TEXT[],
  competitive_disadvantages TEXT[],
  pricing_recommendation TEXT,
  positioning_recommendation TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_analysis_property ON public.competitor_analysis(property_id, similarity_score DESC);

-- RLS Policies
ALTER TABLE public.listing_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;

-- Builders can view performance for their properties
DROP POLICY IF EXISTS "Builders can view their performance" ON public.listing_performance;
CREATE POLICY "Builders can view their performance" ON public.listing_performance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Builders can view suggestions for their properties
DROP POLICY IF EXISTS "Builders can view their suggestions" ON public.optimization_suggestions;
CREATE POLICY "Builders can view their suggestions" ON public.optimization_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Builders can update their suggestions" ON public.optimization_suggestions;
CREATE POLICY "Builders can update their suggestions" ON public.optimization_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Builders can view experiments for their properties
DROP POLICY IF EXISTS "Builders can view their experiments" ON public.listing_experiments;
CREATE POLICY "Builders can view their experiments" ON public.listing_experiments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Builders can view competitor analysis for their properties
DROP POLICY IF EXISTS "Builders can view their competitor analysis" ON public.competitor_analysis;
CREATE POLICY "Builders can view their competitor analysis" ON public.competitor_analysis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Grant service role full access
GRANT ALL ON public.listing_performance TO service_role;
GRANT ALL ON public.optimization_suggestions TO service_role;
GRANT ALL ON public.listing_experiments TO service_role;
GRANT ALL ON public.competitor_analysis TO service_role;

COMMENT ON TABLE public.listing_performance IS 'Track listing performance metrics';
COMMENT ON TABLE public.optimization_suggestions IS 'AI-generated optimization suggestions';
COMMENT ON TABLE public.listing_experiments IS 'A/B testing experiments for listings';
COMMENT ON TABLE public.competitor_analysis IS 'Competitor analysis and recommendations';

