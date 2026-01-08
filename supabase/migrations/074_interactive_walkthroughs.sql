-- ===========================================
-- Migration: 074_interactive_walkthroughs.sql
-- Interactive In-App Walkthrough System
-- Overlay guides and contextual tooltips
-- ===========================================

BEGIN;

-- ===========================================
-- 1. INTERACTIVE WALKTHROUGHS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.interactive_walkthroughs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT REFERENCES public.feature_documentation(feature_key) ON DELETE SET NULL,
  walkthrough_type TEXT NOT NULL CHECK (walkthrough_type IN ('tour', 'tooltip', 'spotlight')),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- steps structure: [{step_number: int, title: string, content: string, target_selector: string, placement: string, ...}]
  trigger_condition JSONB DEFAULT '{}'::jsonb,
  -- trigger_condition: {page_url: string, user_role: string[], user_tier: string[], first_time_only: boolean, ...}
  target_user_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  target_user_tiers TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  completion_rate NUMERIC DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  total_starts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_walkthroughs_feature ON public.interactive_walkthroughs(feature_key);
CREATE INDEX IF NOT EXISTS idx_walkthroughs_type ON public.interactive_walkthroughs(walkthrough_type);
CREATE INDEX IF NOT EXISTS idx_walkthroughs_active ON public.interactive_walkthroughs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_walkthroughs_priority ON public.interactive_walkthroughs(priority DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_walkthroughs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_walkthroughs_updated_at ON public.interactive_walkthroughs;
CREATE TRIGGER trigger_update_walkthroughs_updated_at
  BEFORE UPDATE ON public.interactive_walkthroughs
  FOR EACH ROW
  EXECUTE FUNCTION update_walkthroughs_updated_at();

-- ===========================================
-- 2. USER WALKTHROUGH PROGRESS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_walkthrough_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  walkthrough_id UUID NOT NULL REFERENCES public.interactive_walkthroughs(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  -- completed_steps: [step_number, ...]
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, walkthrough_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_user ON public.user_walkthrough_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_walkthrough ON public.user_walkthrough_progress(walkthrough_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_completed ON public.user_walkthrough_progress(is_completed) WHERE is_completed = false;
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_last_interaction ON public.user_walkthrough_progress(last_interaction_at DESC);

-- ===========================================
-- 3. CONTEXTUAL TOOLTIPS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.contextual_tooltips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_selector TEXT NOT NULL, -- CSS selector for UI element
  page_url_pattern TEXT, -- URL pattern (e.g., '/builder/leads/*')
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  placement TEXT DEFAULT 'top' CHECK (placement IN ('top', 'bottom', 'left', 'right', 'auto')),
  trigger_type TEXT DEFAULT 'hover' CHECK (trigger_type IN ('hover', 'click', 'focus', 'manual')),
  show_once BOOLEAN DEFAULT false,
  show_delay_ms INTEGER DEFAULT 500,
  target_user_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  target_user_tiers TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  dismiss_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_selector, page_url_pattern)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tooltips_selector ON public.contextual_tooltips(target_selector);
CREATE INDEX IF NOT EXISTS idx_tooltips_page_url ON public.contextual_tooltips(page_url_pattern);
CREATE INDEX IF NOT EXISTS idx_tooltips_active ON public.contextual_tooltips(is_active) WHERE is_active = true;

-- Update trigger
CREATE OR REPLACE FUNCTION update_tooltips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tooltips_updated_at ON public.contextual_tooltips;
CREATE TRIGGER trigger_update_tooltips_updated_at
  BEFORE UPDATE ON public.contextual_tooltips
  FOR EACH ROW
  EXECUTE FUNCTION update_tooltips_updated_at();

-- ===========================================
-- 4. USER TOOLTIP INTERACTIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_tooltip_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tooltip_id UUID NOT NULL REFERENCES public.contextual_tooltips(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'dismissed', 'clicked')),
  interacted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tooltip_id, interaction_type, DATE(interacted_at))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tooltip_interactions_user ON public.user_tooltip_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tooltip_interactions_tooltip ON public.user_tooltip_interactions(tooltip_id);
CREATE INDEX IF NOT EXISTS idx_tooltip_interactions_type ON public.user_tooltip_interactions(interaction_type);

-- ===========================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE public.interactive_walkthroughs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_walkthrough_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextual_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tooltip_interactions ENABLE ROW LEVEL SECURITY;

-- Walkthroughs: Public read (all authenticated users can view active walkthroughs)
CREATE POLICY "walkthroughs_public_read"
  ON public.interactive_walkthroughs
  FOR SELECT
  USING (is_active = true);

-- User progress: Users manage their own progress
CREATE POLICY "walkthrough_progress_own"
  ON public.user_walkthrough_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tooltips: Public read (all authenticated users can view active tooltips)
CREATE POLICY "tooltips_public_read"
  ON public.contextual_tooltips
  FOR SELECT
  USING (is_active = true);

-- Tooltip interactions: Users manage their own interactions
CREATE POLICY "tooltip_interactions_own"
  ON public.user_tooltip_interactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "service_role_walkthroughs_full"
  ON public.interactive_walkthroughs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_walkthrough_progress_full"
  ON public.user_walkthrough_progress
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_tooltips_full"
  ON public.contextual_tooltips
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_tooltip_interactions_full"
  ON public.user_tooltip_interactions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE public.interactive_walkthroughs IS 'Interactive walkthroughs and tours for features';
COMMENT ON TABLE public.user_walkthrough_progress IS 'Tracks user progress through interactive walkthroughs';
COMMENT ON TABLE public.contextual_tooltips IS 'Contextual tooltips for UI elements';
COMMENT ON TABLE public.user_tooltip_interactions IS 'Tracks user interactions with tooltips';

COMMIT;
















