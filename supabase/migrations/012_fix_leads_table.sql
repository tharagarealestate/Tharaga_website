-- Fix leads table by adding missing columns and indexes

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));
  END IF;
END $$;

-- Add score column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'score'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN score numeric NOT NULL DEFAULT 5.0
    CHECK (score >= 0 AND score <= 10);
  END IF;
END $$;

-- Add source column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN source text;
  END IF;
END $$;

-- Add budget column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'budget'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN budget numeric;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
