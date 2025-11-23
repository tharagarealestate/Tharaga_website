-- =============================================
-- PERSONALIZED BUYER EXPERIENCE SYSTEM
-- Buyer preferences, recommendations, segments, and personalization rules
-- =============================================

-- Buyer preferences and behavior patterns
CREATE TABLE IF NOT EXISTS public.buyer_preferences (
  buyer_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
  budget_min DECIMAL(15,2),
  budget_max DECIMAL(15,2),
  size_min_sqft INTEGER,
  size_max_sqft INTEGER,
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  must_have_amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  nice_to_have_amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_possession TEXT, -- 'immediate', 'under_construction', 'ready_to_move'
  investment_purpose TEXT, -- 'residential', 'investment', 'rental'
  preferences_json JSONB DEFAULT '{}'::JSONB,
  confidence_score DECIMAL(5,2) DEFAULT 0, -- How confident we are about preferences
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_prefs_buyer ON public.buyer_preferences(buyer_id);

-- Property recommendation history
CREATE TABLE IF NOT EXISTS public.recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  recommendation_score DECIMAL(5,2) NOT NULL, -- 0-100 match score
  recommendation_reason TEXT,
  recommendation_factors JSONB, -- {budget_match: 95, location_match: 80}
  algorithm_used TEXT, -- 'collaborative', 'content_based', 'hybrid'
  position_shown INTEGER, -- Position in recommendation list
  was_clicked BOOLEAN DEFAULT false,
  was_saved BOOLEAN DEFAULT false,
  was_contacted BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER,
  feedback_score INTEGER, -- User feedback: 1-5 stars, null if no feedback
  feedback_text TEXT,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  interacted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recommendations_buyer ON public.recommendation_history(buyer_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_property ON public.recommendation_history(property_id, recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_feedback ON public.recommendation_history(buyer_id, feedback_score);

-- Buyer segments for targeted campaigns
CREATE TABLE IF NOT EXISTS public.buyer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name TEXT NOT NULL UNIQUE,
  segment_description TEXT,
  criteria JSONB NOT NULL, -- {budget_range: [30,50], locations: ['Mumbai'], urgency: 'high'}
  buyer_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  avg_deal_value DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segments_active ON public.buyer_segments(is_active, buyer_count DESC);

-- Segment membership (many-to-many)
CREATE TABLE IF NOT EXISTS public.buyer_segment_members (
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES public.buyer_segments(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2), -- How well buyer fits segment
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (buyer_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_segment_members_segment ON public.buyer_segment_members(segment_id, match_score DESC);

-- Personalization rules engine
CREATE TABLE IF NOT EXISTS public.personalization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'content_boost', 'notification', 'pricing', 'access'
  conditions JSONB NOT NULL, -- When to apply rule
  actions JSONB NOT NULL, -- What to do
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_type_active ON public.personalization_rules(rule_type, is_active, priority DESC);

-- RLS Policies
ALTER TABLE public.buyer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization_rules ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.buyer_preferences;
CREATE POLICY "Users can view own preferences" ON public.buyer_preferences
FOR SELECT
USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.buyer_preferences;
CREATE POLICY "Users can update own preferences" ON public.buyer_preferences
FOR ALL
USING (auth.uid() = buyer_id);

-- Users can view their own recommendation history
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.recommendation_history;
CREATE POLICY "Users can view own recommendations" ON public.recommendation_history
FOR SELECT
USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update own recommendations" ON public.recommendation_history;
CREATE POLICY "Users can update own recommendations" ON public.recommendation_history
FOR UPDATE
USING (auth.uid() = buyer_id);

-- Builders can view segments they created
DROP POLICY IF EXISTS "Builders can view their segments" ON public.buyer_segments;
CREATE POLICY "Builders can view their segments" ON public.buyer_segments
FOR SELECT
USING (auth.uid() = created_by OR is_active = true);

-- Users can view segments they belong to
DROP POLICY IF EXISTS "Users can view their segments" ON public.buyer_segment_members;
CREATE POLICY "Users can view their segments" ON public.buyer_segment_members
FOR SELECT
USING (auth.uid() = buyer_id);

-- Grant service role full access
GRANT ALL ON public.buyer_preferences TO service_role;
GRANT ALL ON public.recommendation_history TO service_role;
GRANT ALL ON public.buyer_segments TO service_role;
GRANT ALL ON public.buyer_segment_members TO service_role;
GRANT ALL ON public.personalization_rules TO service_role;

-- Calculate buyer preferences from behavior
CREATE OR REPLACE FUNCTION public.calculate_buyer_preferences(p_buyer_id UUID)
RETURNS TABLE (
  buyer_id UUID,
  property_types TEXT[],
  preferred_locations TEXT[],
  budget_min DECIMAL(15,2),
  budget_max DECIMAL(15,2),
  size_min_sqft INTEGER,
  size_max_sqft INTEGER,
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  must_have_amenities TEXT[],
  nice_to_have_amenities TEXT[],
  preferred_possession TEXT,
  investment_purpose TEXT,
  preferences_json JSONB,
  confidence_score DECIMAL(5,2),
  last_updated TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_buyer_id,
    ARRAY_AGG(DISTINCT p.property_type) FILTER (WHERE p.property_type IS NOT NULL)::TEXT[],
    ARRAY_AGG(DISTINCT COALESCE(p.location, p.locality)) FILTER (WHERE COALESCE(p.location, p.locality) IS NOT NULL)::TEXT[],
    MIN(p.price) * 0.8,
    MAX(p.price) * 1.2,
    MIN(p.sqft)::INTEGER,
    MAX(p.sqft)::INTEGER,
    MIN(p.bedrooms)::INTEGER,
    MAX(p.bedrooms)::INTEGER,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NULL::TEXT,
    NULL::TEXT,
    '{}'::JSONB,
    70.0,
    NOW(),
    NOW()
  FROM public.behavior_tracking bt
  JOIN public.properties p ON p.id = (bt.metadata->>'property_id')::UUID
  WHERE bt.user_id = p_buyer_id
  AND bt.behavior_type IN ('property_view', 'property_save')
  AND bt.created_at > NOW() - INTERVAL '30 days'
  GROUP BY bt.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.buyer_preferences IS 'Buyer preferences and behavior patterns';
COMMENT ON TABLE public.recommendation_history IS 'Property recommendation history and feedback';
COMMENT ON TABLE public.buyer_segments IS 'Buyer segments for targeted campaigns';
COMMENT ON TABLE public.personalization_rules IS 'Personalization rules engine';

