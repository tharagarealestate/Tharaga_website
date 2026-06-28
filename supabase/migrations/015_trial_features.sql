-- Add trial features: trial_checklist, upgrade_prompts tables, and trial_ends_at column
-- Migration: 015_trial_features.sql

-- ===========================================
-- 1. Add trial_ends_at to builders table
-- ===========================================

ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Add index for trial_ends_at
CREATE INDEX IF NOT EXISTS idx_builders_trial_ends_at ON public.builders(trial_ends_at);

-- Add comment
COMMENT ON COLUMN public.builders.trial_ends_at IS 'Timestamp when the trial period ends for this builder';

-- ===========================================
-- 2. Create trial_checklist table
-- ===========================================

CREATE TABLE IF NOT EXISTS public.trial_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL REFERENCES public.builders(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add index for builder_id
CREATE INDEX IF NOT EXISTS trial_checklist_builder_idx ON public.trial_checklist(builder_id);

-- Enable RLS
ALTER TABLE public.trial_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Builders can only select their own checklist items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trial_checklist' AND policyname = 'trial_checklist_select_own'
  ) THEN
    CREATE POLICY "trial_checklist_select_own"
    ON public.trial_checklist FOR SELECT
    TO authenticated
    USING (builder_id = auth.uid());
  END IF;
END $$;

-- RLS Policy: Builders can only update their own checklist items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trial_checklist' AND policyname = 'trial_checklist_update_own'
  ) THEN
    CREATE POLICY "trial_checklist_update_own"
    ON public.trial_checklist FOR UPDATE
    TO authenticated
    USING (builder_id = auth.uid())
    WITH CHECK (builder_id = auth.uid());
  END IF;
END $$;

-- RLS Policy: Builders can insert their own checklist items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trial_checklist' AND policyname = 'trial_checklist_insert_own'
  ) THEN
    CREATE POLICY "trial_checklist_insert_own"
    ON public.trial_checklist FOR INSERT
    TO authenticated
    WITH CHECK (builder_id = auth.uid());
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.trial_checklist IS 'Tracks trial period checklist items for builders';
COMMENT ON COLUMN public.trial_checklist.builder_id IS 'Reference to the builder who owns this checklist item';
COMMENT ON COLUMN public.trial_checklist.title IS 'The checklist item title/description';
COMMENT ON COLUMN public.trial_checklist.completed IS 'Whether this checklist item has been completed';

-- ===========================================
-- 3. Create upgrade_prompts table
-- ===========================================

CREATE TABLE IF NOT EXISTS public.upgrade_prompts (
  id bigserial PRIMARY KEY,
  builder_id uuid NOT NULL REFERENCES public.builders(id) ON DELETE CASCADE,
  prompt_type text NOT NULL,
  shown_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS upgrade_prompts_builder_idx ON public.upgrade_prompts(builder_id);
CREATE INDEX IF NOT EXISTS upgrade_prompts_type_idx ON public.upgrade_prompts(prompt_type);

-- Enable RLS
ALTER TABLE public.upgrade_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Builders can only insert their own upgrade prompt records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'upgrade_prompts' AND policyname = 'upgrade_prompts_insert_own'
  ) THEN
    CREATE POLICY "upgrade_prompts_insert_own"
    ON public.upgrade_prompts FOR INSERT
    TO authenticated
    WITH CHECK (builder_id = auth.uid());
  END IF;
END $$;

-- RLS Policy: Builders can only select their own upgrade prompt records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'upgrade_prompts' AND policyname = 'upgrade_prompts_select_own'
  ) THEN
    CREATE POLICY "upgrade_prompts_select_own"
    ON public.upgrade_prompts FOR SELECT
    TO authenticated
    USING (builder_id = auth.uid());
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.upgrade_prompts IS 'Tracks when upgrade prompts are shown to builders during trial';
COMMENT ON COLUMN public.upgrade_prompts.builder_id IS 'Reference to the builder who was shown the prompt';
COMMENT ON COLUMN public.upgrade_prompts.prompt_type IS 'Type/category of the upgrade prompt shown';
COMMENT ON COLUMN public.upgrade_prompts.shown_at IS 'Timestamp when the prompt was displayed';
