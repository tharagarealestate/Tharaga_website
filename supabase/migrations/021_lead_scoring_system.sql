-- =============================================
-- LEAD SCORING SYSTEM MIGRATION
-- Creates tables for AI scoring, user behavior, preferences, and interactions
-- =============================================

-- =============================================
-- 1. USER_PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_min numeric,
  budget_max numeric,
  preferred_location text,
  preferred_property_type text,
  additional_requirements text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- =============================================
-- 2. USER_BEHAVIOR TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_behavior (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  behavior_type text NOT NULL, -- 'property_view', 'property_click', 'favorite', 'contact', etc.
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  duration numeric DEFAULT 0, -- seconds
  device_type text, -- 'mobile', 'desktop', 'tablet'
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON public.user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_property_id ON public.user_behavior(property_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON public.user_behavior(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_type ON public.user_behavior(behavior_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_session_id ON public.user_behavior(session_id);

-- =============================================
-- 3. LEAD_SCORES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10),
  category text NOT NULL DEFAULT 'Low Quality' CHECK (category IN ('Hot Lead', 'Warm Lead', 'Developing Lead', 'Cold Lead', 'Low Quality')),
  budget_alignment_score numeric DEFAULT 0,
  engagement_score numeric DEFAULT 0,
  property_fit_score numeric DEFAULT 0,
  time_investment_score numeric DEFAULT 0,
  contact_intent_score numeric DEFAULT 0,
  recency_score numeric DEFAULT 0,
  score_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_user_id ON public.lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_score ON public.lead_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_category ON public.lead_scores(category);
CREATE INDEX IF NOT EXISTS idx_lead_scores_updated_at ON public.lead_scores(updated_at DESC);

-- =============================================
-- 4. LEAD_INTERACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL, -- References leads.id
  builder_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'email', 'call', 'whatsapp', 'meeting', 'site_visit', etc.
  timestamp timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'no_response')),
  notes text,
  outcome text, -- 'interested', 'not_interested', 'follow_up', 'converted', etc.
  response_time_minutes integer, -- Time taken to respond
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_builder_id ON public.lead_interactions(builder_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_timestamp ON public.lead_interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_status ON public.lead_interactions(status);

-- =============================================
-- 5. UPDATED_AT TRIGGERS
-- =============================================

-- User Preferences updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_user_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER on_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_preferences_updated_at();

-- Lead Scores updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_lead_scores_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lead_scores_updated_at ON public.lead_scores;
CREATE TRIGGER on_lead_scores_updated_at
  BEFORE UPDATE ON public.lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lead_scores_updated_at();

-- =============================================
-- 6. ROW LEVEL SECURITY
-- =============================================

-- User Preferences: Users can manage their own preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Builders can view lead preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Builders can view lead preferences" ON public.user_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

-- User Behavior: Public can insert, users can view their own, builders can view leads
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert behavior" ON public.user_behavior;
DROP POLICY IF EXISTS "Users can view their own behavior" ON public.user_behavior;
DROP POLICY IF EXISTS "Builders can view lead behavior" ON public.user_behavior;

CREATE POLICY "Public can insert behavior" ON public.user_behavior
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own behavior" ON public.user_behavior
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Builders can view lead behavior" ON public.user_behavior
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

-- Lead Scores: Builders can view all lead scores
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own scores" ON public.lead_scores;
DROP POLICY IF EXISTS "Builders can view all lead scores" ON public.lead_scores;

CREATE POLICY "Users can view their own scores" ON public.lead_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Builders can view all lead scores" ON public.lead_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

-- Lead Interactions: Builders can manage interactions with their leads
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Builders can manage their lead interactions" ON public.lead_interactions;

CREATE POLICY "Builders can view their lead interactions" ON public.lead_interactions
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can manage their lead interactions" ON public.lead_interactions
  FOR ALL USING (auth.uid() = builder_id);

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.user_preferences IS 'User preferences for property search and matching';
COMMENT ON TABLE public.user_behavior IS 'Tracks user behavior and engagement with properties';
COMMENT ON TABLE public.lead_scores IS 'AI-powered lead scoring and categorization for builders';
COMMENT ON TABLE public.lead_interactions IS 'Tracks builder interactions with leads';

