-- Add trial features based on existing schema patterns
-- References auth.users(id) as per existing builder_subscriptions table

-- ===========================================
-- 1. Create trial_checklist table
-- ===========================================

CREATE TABLE IF NOT EXISTS public.trial_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_checklist_builder ON public.trial_checklist(builder_id);

-- Enable RLS
ALTER TABLE public.trial_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "trial_checklist_select_own" ON public.trial_checklist
FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "trial_checklist_update_own" ON public.trial_checklist
FOR UPDATE USING (auth.uid() = builder_id)
WITH CHECK (auth.uid() = builder_id);

CREATE POLICY "trial_checklist_insert_own" ON public.trial_checklist
FOR INSERT WITH CHECK (auth.uid() = builder_id);

-- Comments
COMMENT ON TABLE public.trial_checklist IS 'Tracks trial period checklist items for builders';
COMMENT ON COLUMN public.trial_checklist.builder_id IS 'Reference to auth.users for the builder';
COMMENT ON COLUMN public.trial_checklist.title IS 'Checklist item title';
COMMENT ON COLUMN public.trial_checklist.completed IS 'Whether the item is completed';

-- ===========================================
-- 2. Create upgrade_prompts table
-- ===========================================

CREATE TABLE IF NOT EXISTS public.upgrade_prompts (
  id bigserial PRIMARY KEY,
  builder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type text NOT NULL,
  shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_builder ON public.upgrade_prompts(builder_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_type ON public.upgrade_prompts(prompt_type);

-- Enable RLS
ALTER TABLE public.upgrade_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "upgrade_prompts_insert_own" ON public.upgrade_prompts
FOR INSERT WITH CHECK (auth.uid() = builder_id);

CREATE POLICY "upgrade_prompts_select_own" ON public.upgrade_prompts
FOR SELECT USING (auth.uid() = builder_id);

-- Comments
COMMENT ON TABLE public.upgrade_prompts IS 'Tracks when upgrade prompts are shown to builders';
COMMENT ON COLUMN public.upgrade_prompts.builder_id IS 'Reference to auth.users for the builder';
COMMENT ON COLUMN public.upgrade_prompts.prompt_type IS 'Type of upgrade prompt shown';
COMMENT ON COLUMN public.upgrade_prompts.shown_at IS 'When the prompt was displayed';

-- ===========================================
-- 3. Ensure leads table exists
-- ===========================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  builder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  message text,
  status text,
  score numeric,
  source text,
  budget numeric
);

CREATE INDEX IF NOT EXISTS idx_leads_builder ON public.leads(builder_id);
CREATE INDEX IF NOT EXISTS idx_leads_property ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
CREATE POLICY "leads_select_own" ON public.leads
FOR SELECT USING (auth.uid() = builder_id);

DROP POLICY IF EXISTS "leads_insert_own" ON public.leads;
CREATE POLICY "leads_insert_own" ON public.leads
FOR INSERT WITH CHECK (auth.uid() = builder_id);

DROP POLICY IF EXISTS "leads_update_own" ON public.leads;
CREATE POLICY "leads_update_own" ON public.leads
FOR UPDATE USING (auth.uid() = builder_id)
WITH CHECK (auth.uid() = builder_id);

-- Comments
COMMENT ON TABLE public.leads IS 'Tracks leads for builders';

-- ===========================================
-- 4. Create properties_with_location view
-- ===========================================

CREATE OR REPLACE VIEW public.properties_with_location AS
SELECT
  p.*,
  COALESCE(
    p.city || CASE WHEN p.locality IS NOT NULL THEN ', ' || p.locality ELSE '' END,
    p.locality
  ) AS location
FROM public.properties p;

-- Grant access to the view
GRANT SELECT ON public.properties_with_location TO authenticated;
GRANT SELECT ON public.properties_with_location TO anon;

COMMENT ON VIEW public.properties_with_location IS 'Properties with computed location field combining city and locality';
