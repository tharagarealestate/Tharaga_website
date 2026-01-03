-- ===========================================
-- Migration: 072_feature_documentation_system.sql
-- Feature Documentation UI System
-- In-Dashboard Feature Guide & Interactive Help System
-- ===========================================

BEGIN;

-- ===========================================
-- 1. FEATURE DOCUMENTATION TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.feature_documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing_automation', 'lead_management', 'property_management', 'analytics', 'billing')),
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
  use_cases TEXT[] DEFAULT ARRAY[]::TEXT[],
  how_to_steps JSONB DEFAULT '{}'::jsonb,
  video_url TEXT,
  related_features TEXT[] DEFAULT ARRAY[]::TEXT[],
  tier_required TEXT DEFAULT 'free' CHECK (tier_required IN ('free', 'pro', 'enterprise')),
  is_ai_powered BOOLEAN DEFAULT false,
  is_new_feature BOOLEAN DEFAULT false,
  feature_icon TEXT,
  icon_color TEXT CHECK (icon_color IN ('amber', 'emerald', 'blue', 'purple')),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feature_documentation
CREATE INDEX IF NOT EXISTS idx_feature_documentation_category ON public.feature_documentation(category);
CREATE INDEX IF NOT EXISTS idx_feature_documentation_tier ON public.feature_documentation(tier_required);
CREATE INDEX IF NOT EXISTS idx_feature_documentation_new ON public.feature_documentation(is_new_feature) WHERE is_new_feature = true;
CREATE INDEX IF NOT EXISTS idx_feature_documentation_ai ON public.feature_documentation(is_ai_powered) WHERE is_ai_powered = true;

-- Comments
COMMENT ON TABLE public.feature_documentation IS 'Stores all feature documentation with versioning, benefits, use cases, and step-by-step instructions';
COMMENT ON COLUMN public.feature_documentation.feature_key IS 'Unique identifier for the feature (e.g., behavioral_lead_scoring)';
COMMENT ON COLUMN public.feature_documentation.how_to_steps IS 'JSONB object containing step-by-step instructions with screenshots and durations';
COMMENT ON COLUMN public.feature_documentation.feature_icon IS 'Lucide icon name (e.g., Brain, Zap, Users)';

-- ===========================================
-- 2. USER FEATURE INTERACTIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_feature_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'tutorial_started', 'tutorial_completed', 'dismissed', 'marked_helpful', 'marked_not_helpful')),
  interaction_metadata JSONB DEFAULT '{}'::jsonb,
  interacted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_feature_interactions_unique UNIQUE(user_id, feature_key, interaction_type)
);

-- Add foreign key constraint if feature_documentation exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_documentation') THEN
    ALTER TABLE public.user_feature_interactions
    ADD CONSTRAINT fk_feature_key 
    FOREIGN KEY (feature_key) REFERENCES public.feature_documentation(feature_key) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for user_feature_interactions
CREATE INDEX IF NOT EXISTS idx_user_feature_interactions_user ON public.user_feature_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_interactions_feature ON public.user_feature_interactions(feature_key);
CREATE INDEX IF NOT EXISTS idx_user_feature_interactions_type ON public.user_feature_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_feature_interactions_interacted_at ON public.user_feature_interactions(interacted_at DESC);

-- Comments
COMMENT ON TABLE public.user_feature_interactions IS 'Tracks which features each builder has viewed, completed tutorials for, or dismissed';
COMMENT ON COLUMN public.user_feature_interactions.interaction_metadata IS 'JSONB object with additional data (e.g., step_completed, total_steps, time_spent_seconds)';

-- ===========================================
-- 3. ONBOARDING CHECKLISTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 10,
  is_onboarding_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for onboarding_checklists
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_user ON public.onboarding_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_complete ON public.onboarding_checklists(is_onboarding_complete) WHERE is_onboarding_complete = false;

-- Comments
COMMENT ON TABLE public.onboarding_checklists IS 'Personalized onboarding checklist for each builder with progress tracking';
COMMENT ON COLUMN public.onboarding_checklists.checklist_items IS 'JSONB array of checklist items with task, title, description, completed status, and action URLs';

-- ===========================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.feature_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;

-- Feature Documentation: Public read access (all authenticated users can view)
CREATE POLICY "feature_documentation_public_read"
  ON public.feature_documentation
  FOR SELECT
  USING (true);

-- User Feature Interactions: Users can manage their own interactions
CREATE POLICY "user_feature_interactions_own"
  ON public.user_feature_interactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Onboarding Checklists: Users can manage their own checklist
CREATE POLICY "onboarding_checklists_own"
  ON public.onboarding_checklists
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "service_role_feature_documentation_full"
  ON public.feature_documentation
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_user_interactions_full"
  ON public.user_feature_interactions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_onboarding_full"
  ON public.onboarding_checklists
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- 5. UPDATE TRIGGER FOR ONBOARDING CHECKLISTS
-- ===========================================

CREATE OR REPLACE FUNCTION update_onboarding_checklists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_onboarding_checklists_updated_at ON public.onboarding_checklists;
CREATE TRIGGER trigger_update_onboarding_checklists_updated_at
  BEFORE UPDATE ON public.onboarding_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_checklists_updated_at();

COMMIT;


