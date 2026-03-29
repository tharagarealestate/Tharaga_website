-- ============================================================
-- Migration 082: Adjusting leads schema for Builder pipeline
-- Adding specific columns for the 6-question qualification
-- Refining HOT/WARM/COOL tier definitions (HOT >= 75)
-- ============================================================

DO $$ BEGIN
  -- Timeline (e.g. 'Urgent', '3 months', '6+ months')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='timeline') THEN
    ALTER TABLE public.leads ADD COLUMN timeline text;
  END IF;

  -- Loan Status (e.g. 'Pre-approved', 'Applied', 'No')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='loan_status') THEN
    ALTER TABLE public.leads ADD COLUMN loan_status text;
  END IF;

  -- SLA notification and CAPI tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='notified_at') THEN
    ALTER TABLE public.leads ADD COLUMN notified_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='capi_synced') THEN
    ALTER TABLE public.leads ADD COLUMN capi_synced boolean DEFAULT false;
  END IF;

  -- Adjusting tier logic to strictly follow Lion(>=75), Monkey(>=40), Dog(<40) mapped to HOT/WARM/COOL
  -- Drop existing column to redefine the GENERATED expression
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='tier') THEN
    ALTER TABLE public.leads DROP COLUMN tier;
  END IF;
  
  ALTER TABLE public.leads ADD COLUMN tier text
    GENERATED ALWAYS AS (
      CASE WHEN smartscore >= 75 THEN 'HOT' WHEN smartscore >= 40 THEN 'WARM' ELSE 'COOL' END
    ) STORED;
  CREATE INDEX IF NOT EXISTS idx_leads_tier ON public.leads(tier);
END $$;
