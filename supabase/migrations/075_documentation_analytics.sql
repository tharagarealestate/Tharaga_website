-- ===========================================
-- Migration: 075_documentation_analytics.sql
-- Advanced Documentation Analytics System
-- Heatmaps, user journeys, predictive insights
-- ===========================================

BEGIN;

-- ===========================================
-- 1. DOCUMENTATION ANALYTICS EVENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.doc_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'scroll', 'search', 'time_spent', 'video_play', 'video_complete', 'download', 'share')),
  feature_key TEXT REFERENCES public.feature_documentation(feature_key) ON DELETE SET NULL,
  page_url TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  -- event_data structure varies by event_type:
  -- click: {element_selector: string, element_text: string, coordinates: {x, y}}
  -- scroll: {scroll_depth_percentage: int, max_scroll_depth: int}
  -- search: {query: string, results_count: int, clicked_result: string}
  -- time_spent: {seconds: int, section: string}
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  country_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_doc_events_user ON public.doc_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_events_feature ON public.doc_analytics_events(feature_key);
CREATE INDEX IF NOT EXISTS idx_doc_events_type ON public.doc_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_doc_events_session ON public.doc_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_doc_events_created_at ON public.doc_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_events_user_feature ON public.doc_analytics_events(user_id, feature_key);

-- Partition by month for better performance (optional, can be added later)

-- ===========================================
-- 2. DOCUMENTATION HEATMAP DATA (AGGREGATED)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.doc_heatmap_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT NOT NULL REFERENCES public.feature_documentation(feature_key) ON DELETE CASCADE,
  element_selector TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  hover_count INTEGER DEFAULT 0,
  scroll_depth_percentage INTEGER DEFAULT 0 CHECK (scroll_depth_percentage >= 0 AND scroll_depth_percentage <= 100),
  avg_time_spent_seconds NUMERIC DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  aggregated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_key, element_selector, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_heatmap_feature_date ON public.doc_heatmap_data(feature_key, date DESC);
CREATE INDEX IF NOT EXISTS idx_heatmap_selector ON public.doc_heatmap_data(element_selector);
CREATE INDEX IF NOT EXISTS idx_heatmap_date ON public.doc_heatmap_data(date DESC);

-- ===========================================
-- 3. USER FEATURE JOURNEYS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_feature_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES public.feature_documentation(feature_key) ON DELETE CASCADE,
  journey_stage TEXT NOT NULL CHECK (journey_stage IN ('doc_viewed', 'tutorial_started', 'tutorial_completed', 'feature_used', 'success', 'abandoned')),
  stage_timestamp TIMESTAMPTZ DEFAULT NOW(),
  time_to_next_stage INTEGER, -- seconds
  dropped_off BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journeys_user ON public.user_feature_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_feature ON public.user_feature_journeys(feature_key);
CREATE INDEX IF NOT EXISTS idx_journeys_stage ON public.user_feature_journeys(journey_stage);
CREATE INDEX IF NOT EXISTS idx_journeys_user_feature ON public.user_feature_journeys(user_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_journeys_dropped ON public.user_feature_journeys(dropped_off) WHERE dropped_off = true;

-- ===========================================
-- 4. DOCUMENTATION SEARCH ANALYTICS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.doc_search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_result_feature_key TEXT REFERENCES public.feature_documentation(feature_key) ON DELETE SET NULL,
  no_results BOOLEAN DEFAULT false,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.doc_search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user ON public.doc_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_no_results ON public.doc_search_analytics(no_results) WHERE no_results = true;
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON public.doc_search_analytics(created_at DESC);

-- ===========================================
-- 5. AGGREGATION FUNCTIONS
-- ===========================================

-- Function to aggregate heatmap data from events
CREATE OR REPLACE FUNCTION public.aggregate_doc_heatmap_data(
  p_feature_key TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Aggregate click events
  INSERT INTO public.doc_heatmap_data (
    feature_key,
    element_selector,
    click_count,
    date
  )
  SELECT
    p_feature_key,
    event_data->>'element_selector' AS element_selector,
    COUNT(*) AS click_count,
    p_date
  FROM public.doc_analytics_events
  WHERE feature_key = p_feature_key
    AND event_type = 'click'
    AND DATE(created_at) = p_date
    AND event_data->>'element_selector' IS NOT NULL
  GROUP BY event_data->>'element_selector'
  ON CONFLICT (feature_key, element_selector, date)
  DO UPDATE SET
    click_count = EXCLUDED.click_count,
    aggregated_at = NOW();

  -- Aggregate scroll depth (max scroll per user per feature)
  UPDATE public.doc_heatmap_data
  SET scroll_depth_percentage = subquery.max_scroll_depth
  FROM (
    SELECT
      MAX((event_data->>'scroll_depth_percentage')::INTEGER) AS max_scroll_depth
    FROM public.doc_analytics_events
    WHERE feature_key = p_feature_key
      AND event_type = 'scroll'
      AND DATE(created_at) = p_date
  ) AS subquery
  WHERE doc_heatmap_data.feature_key = p_feature_key
    AND doc_heatmap_data.date = p_date;
END;
$$;

-- ===========================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE public.doc_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_heatmap_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_search_analytics ENABLE ROW LEVEL SECURITY;

-- Events: Users can insert their own events, admins can view all
CREATE POLICY "users_insert_own_events"
  ON public.doc_analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "admins_view_all_events"
  ON public.doc_analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Heatmap data: Public read (aggregated, no sensitive data)
CREATE POLICY "heatmap_data_public_read"
  ON public.doc_heatmap_data
  FOR SELECT
  USING (true);

-- Journeys: Users view their own, admins view all
CREATE POLICY "users_own_journeys"
  ON public.user_feature_journeys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_journeys"
  ON public.user_feature_journeys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_all_journeys"
  ON public.user_feature_journeys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Search analytics: Users insert their own, admins view all
CREATE POLICY "users_insert_own_search"
  ON public.doc_search_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "admins_view_all_search"
  ON public.doc_search_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "service_role_analytics_full"
  ON public.doc_analytics_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_heatmap_full"
  ON public.doc_heatmap_data
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_journeys_full"
  ON public.user_feature_journeys
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_search_full"
  ON public.doc_search_analytics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE public.doc_analytics_events IS 'Detailed event tracking for documentation interactions';
COMMENT ON TABLE public.doc_heatmap_data IS 'Aggregated heatmap data for documentation pages';
COMMENT ON TABLE public.user_feature_journeys IS 'User journey tracking from doc view to feature success';
COMMENT ON TABLE public.doc_search_analytics IS 'Search query analytics for documentation';

COMMIT;




