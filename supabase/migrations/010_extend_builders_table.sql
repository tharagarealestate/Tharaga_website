-- Extend builders table with all columns referenced in the application code
-- Based on analysis of app/app/api/properties/[id]/route.ts

-- Add missing columns to builders table
DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS logo_url text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS founded int;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS total_projects int DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS reputation_score numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS reviews_count int DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS description text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS website text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS headquarters text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builders ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_builders_name ON public.builders(name);
CREATE INDEX IF NOT EXISTS idx_builders_reputation_score ON public.builders(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_builders_created_at ON public.builders(created_at DESC);

-- Updated at trigger for builders
CREATE OR REPLACE FUNCTION public.handle_builders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_builders_updated_at ON public.builders;
CREATE TRIGGER on_builders_updated_at
  BEFORE UPDATE ON public.builders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_builders_updated_at();

-- Add helpful comments
COMMENT ON COLUMN public.builders.logo_url IS 'URL to builder/developer logo image';
COMMENT ON COLUMN public.builders.founded IS 'Year the builder was founded';
COMMENT ON COLUMN public.builders.total_projects IS 'Total number of completed projects';
COMMENT ON COLUMN public.builders.reputation_score IS 'Overall reputation score (0-100)';
COMMENT ON COLUMN public.builders.reviews_count IS 'Total number of reviews received';
COMMENT ON COLUMN public.builders.certifications IS 'Array of certification names/IDs in JSONB format';
COMMENT ON COLUMN public.builders.trust_score IS 'Legacy trust score (deprecated, use reputation_score)';

-- Add RLS policies for builders
ALTER TABLE public.builders ENABLE ROW LEVEL SECURITY;

-- Everyone can view builders
CREATE POLICY "Public can view builders" ON public.builders FOR SELECT USING (true);

-- Only admins can insert/update builders
CREATE POLICY "Admins can insert builders" ON public.builders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can update builders" ON public.builders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can delete builders" ON public.builders FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

