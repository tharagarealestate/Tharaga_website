-- =============================================
-- Migration: 076_tamil_nadu_lead_capture_forms.sql
-- Tamil Nadu Market-Specific Lead Capture Forms
-- Extends tables for calculator results and TN-specific fields
-- =============================================

BEGIN;

-- =============================================
-- 1. ADD CALCULATION RESULTS COLUMN TO LEAD_CAPTURE_SUBMISSIONS
-- Stores results from ROI, EMI, Valuation, Budget, Loan calculators
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'lead_capture_submissions'
    AND column_name = 'calculation_results'
  ) THEN
    ALTER TABLE public.lead_capture_submissions
    ADD COLUMN calculation_results JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN public.lead_capture_submissions.calculation_results IS 'Stores calculator results (ROI, EMI, valuation, budget, loan eligibility) as JSONB';

-- =============================================
-- 2. EXTEND LEADS TABLE WITH TAMIL NADU SPECIFIC FIELDS
-- =============================================

-- Add preferred city
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'preferred_city'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN preferred_city VARCHAR(100);
  END IF;
END $$;

-- Add family type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'family_type'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN family_type VARCHAR(50) CHECK (family_type IN ('single', 'couple', 'joint_family', 'nuclear', 'extended'));
  END IF;
END $$;

-- Add cultural preferences (JSONB for flexibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'cultural_preferences'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN cultural_preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add PMAY eligibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'pmay_eligible'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN pmay_eligible BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add Vastu importance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'vastu_important'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN vastu_important BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add metro proximity preference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'metro_proximity_preference'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN metro_proximity_preference BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add buyer type fields (for MONKEY/LION/DOG classification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'buyer_type_primary'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN buyer_type_primary VARCHAR(20) CHECK (buyer_type_primary IN ('MONKEY', 'LION', 'DOG'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'buyer_type_confidence'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN buyer_type_confidence INTEGER CHECK (buyer_type_confidence >= 0 AND buyer_type_confidence <= 100);
  END IF;
END $$;

-- Add purchase timeline
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'purchase_timeline'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN purchase_timeline VARCHAR(50) CHECK (purchase_timeline IN ('immediate', '3_months', '6_months', '12_months', '1-3months', '3-6months', '6-12months', 'researching'));
  END IF;
END $$;

-- Add phone_number if it doesn't exist (some schemas use 'phone' instead)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'phone_number'
  ) THEN
    -- Check if 'phone' column exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'phone'
    ) THEN
      ALTER TABLE public.leads RENAME COLUMN phone TO phone_number;
    ELSE
      ALTER TABLE public.leads ADD COLUMN phone_number TEXT;
    END IF;
  END IF;
END $$;

-- Add lead_score if it doesn't exist (some schemas use 'score')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'lead_score'
  ) THEN
    -- Check if 'score' column exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'score'
    ) THEN
      ALTER TABLE public.leads RENAME COLUMN score TO lead_score;
    ELSE
      ALTER TABLE public.leads ADD COLUMN lead_score NUMERIC DEFAULT 50 CHECK (lead_score >= 0 AND lead_score <= 100);
    END IF;
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_preferred_city ON public.leads(preferred_city);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_type ON public.leads(buyer_type_primary);
CREATE INDEX IF NOT EXISTS idx_leads_pmay_eligible ON public.leads(pmay_eligible) WHERE pmay_eligible = true;

-- =============================================
-- 3. CREATE TAMIL NADU GOVERNMENT SCHEMES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.tn_government_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  scheme_name VARCHAR(100) NOT NULL CHECK (scheme_name IN ('PMAY', 'TNSCB', 'TNSIDCO', 'TNHB')),
  eligible BOOLEAN DEFAULT FALSE,
  subsidy_amount INTEGER,
  application_status VARCHAR(50),
  application_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tn_schemes_lead_id ON public.tn_government_schemes(lead_id);
CREATE INDEX IF NOT EXISTS idx_tn_schemes_scheme_name ON public.tn_government_schemes(scheme_name);

-- =============================================
-- 4. ENABLE RLS FOR TN GOVERNMENT SCHEMES
-- =============================================

ALTER TABLE public.tn_government_schemes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view schemes for their leads" ON public.tn_government_schemes;
CREATE POLICY "Builders can view schemes for their leads"
  ON public.tn_government_schemes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = tn_government_schemes.lead_id
      AND leads.builder_id = auth.uid()
    )
  );

COMMENT ON TABLE public.tn_government_schemes IS 'Tracks Tamil Nadu government scheme eligibility and applications (PMAY, TNSCB, etc.)';

COMMIT;

