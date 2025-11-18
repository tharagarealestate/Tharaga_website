-- Migration: 026_chennai_phase1_trust_features.sql
-- Chennai Phase-1: Trust, Local, Actionable Features
-- Creates tables for RERA verification, document management, risk flags, Chennai insights, ML predictions, and audit PDFs

BEGIN;

-- 1. RERA Snapshots Table
CREATE TABLE IF NOT EXISTS public.rera_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  rera_id text NOT NULL,
  state text NOT NULL,
  project_name text,
  developer_name text,
  status text,
  expiry_date date,
  raw_html text NOT NULL,
  snapshot_hash text NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  data_source text NOT NULL DEFAULT 'SYNTHETIC' CHECK (data_source IN ('SYNTHETIC', 'OFFICIAL_SOURCE')),
  source_url text,
  error_message text,
  UNIQUE(property_id, rera_id, snapshot_hash)
);

CREATE INDEX IF NOT EXISTS idx_rera_snapshots_property_id ON public.rera_snapshots(property_id);
CREATE INDEX IF NOT EXISTS idx_rera_snapshots_rera_id ON public.rera_snapshots(rera_id);
CREATE INDEX IF NOT EXISTS idx_rera_snapshots_collected_at ON public.rera_snapshots(collected_at DESC);

COMMENT ON TABLE public.rera_snapshots IS 'Stores snapshots of RERA project pages for auditability and verification.';

-- 2. Property Documents Table
CREATE TABLE IF NOT EXISTS public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('EC', 'OC', 'CC', 'APPROVAL_PLAN', 'NOC', 'SALE_DEED', 'KHATA', 'OTHER')),
  file_url text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  sha256_hash text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(property_id, sha256_hash)
);

CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON public.property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_sha256_hash ON public.property_documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_property_documents_uploaded_at ON public.property_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_documents_document_type ON public.property_documents(document_type);

COMMENT ON TABLE public.property_documents IS 'Stores uploaded property documents with cryptographic hashes for verification.';

-- 3. Property Risk Flags Table
CREATE TABLE IF NOT EXISTS public.property_risk_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  flag_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  actionable_steps text,
  source text NOT NULL DEFAULT 'AUTOMATED' CHECK (source IN ('AUTOMATED', 'MANUAL')),
  created_at timestamptz NOT NULL DEFAULT now(),
  flagged_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_property_risk_flags_property_id ON public.property_risk_flags(property_id);
CREATE INDEX IF NOT EXISTS idx_property_risk_flags_severity ON public.property_risk_flags(severity);
CREATE INDEX IF NOT EXISTS idx_property_risk_flags_resolved ON public.property_risk_flags(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_property_risk_flags_created_at ON public.property_risk_flags(created_at DESC);

COMMENT ON TABLE public.property_risk_flags IS 'Stores computed or manually added risk flags for properties with actionable steps.';

-- 4. Chennai Locality Insights Table
CREATE TABLE IF NOT EXISTS public.chennai_locality_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  locality text NOT NULL,
  city text NOT NULL DEFAULT 'Chennai',
  flood_score numeric CHECK (flood_score >= 0 AND flood_score <= 100),
  flood_score_source text,
  price_trend_5y_sparkline jsonb, -- Array of {year, price}
  price_trend_summary text,
  infrastructure_summary jsonb, -- Array of {type, name, distance, source}
  rental_yield_min numeric,
  rental_yield_max numeric,
  rental_yield_formula text,
  rental_yield_source text,
  safety_indicator text CHECK (safety_indicator IN ('Low', 'Medium', 'High')),
  safety_indicator_source text,
  data_source text DEFAULT 'SYNTHETIC',
  collected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_chennai_locality_insights_property_id ON public.chennai_locality_insights(property_id);
CREATE INDEX IF NOT EXISTS idx_chennai_locality_insights_locality ON public.chennai_locality_insights(locality);
CREATE INDEX IF NOT EXISTS idx_chennai_locality_insights_updated_at ON public.chennai_locality_insights(updated_at DESC);

COMMENT ON TABLE public.chennai_locality_insights IS 'Stores Chennai-specific locality insights for properties including flood scores, price trends, infrastructure, and safety indicators.';

-- 5. Property Appreciation Bands Table
CREATE TABLE IF NOT EXISTS public.property_appreciation_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  appreciation_band text NOT NULL CHECK (appreciation_band IN ('LOW', 'MEDIUM', 'HIGH')),
  confidence text NOT NULL CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  explanation jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of {feature, impact}
  predicted_at timestamptz NOT NULL DEFAULT now(),
  model_version text,
  methodology_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_appreciation_bands_property_id ON public.property_appreciation_bands(property_id);
CREATE INDEX IF NOT EXISTS idx_property_appreciation_bands_predicted_at ON public.property_appreciation_bands(predicted_at DESC);

COMMENT ON TABLE public.property_appreciation_bands IS 'Stores ML-based property appreciation band predictions with explainable features.';

-- 6. Property Audit PDFs Table
CREATE TABLE IF NOT EXISTS public.property_audit_pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  pdf_url text NOT NULL,
  pdf_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid REFERENCES public.profiles(id),
  document_count integer DEFAULT 0,
  rera_snapshot_included boolean DEFAULT false,
  risk_flags_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(property_id, pdf_hash)
);

CREATE INDEX IF NOT EXISTS idx_property_audit_pdfs_property_id ON public.property_audit_pdfs(property_id);
CREATE INDEX IF NOT EXISTS idx_property_audit_pdfs_generated_at ON public.property_audit_pdfs(generated_at DESC);

COMMENT ON TABLE public.property_audit_pdfs IS 'Stores generated audit PDFs for properties with verification summary.';

-- RLS Policies for new tables
ALTER TABLE public.rera_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.rera_snapshots FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.rera_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.property_documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.property_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.property_documents FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE public.property_risk_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.property_risk_flags FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.property_risk_flags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.property_risk_flags FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE public.chennai_locality_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.chennai_locality_insights FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.chennai_locality_insights FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.chennai_locality_insights FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE public.property_appreciation_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.property_appreciation_bands FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.property_appreciation_bands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.property_appreciation_bands FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE public.property_audit_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.property_audit_pdfs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.property_audit_pdfs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;











