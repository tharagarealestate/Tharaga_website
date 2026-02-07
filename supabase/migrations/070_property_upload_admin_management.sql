-- ===========================================
-- Migration: 070_property_upload_admin_management.sql
-- Advanced Property Upload & Admin-Builder Management System
-- ===========================================

BEGIN;

-- ===========================================
-- 1. EXTEND PROPERTIES TABLE
-- ===========================================

-- Upload tracking fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS uploaded_by_admin BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS upload_source VARCHAR(50) CHECK (upload_source IN ('builder_direct', 'admin_on_behalf', 'api_import', 'bulk_upload'));
EXCEPTION WHEN others THEN NULL; END $$;

-- Verification fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_review', 'approved', 'rejected', 'requires_changes'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verification_notes TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

-- Metadata fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_metadata JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location_intelligence JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pricing_intelligence JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_verification_status ON public.properties(verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_upload_source ON public.properties(upload_source);
CREATE INDEX IF NOT EXISTS idx_properties_admin_user_id ON public.properties(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_properties_location_gin ON public.properties USING gin(location_intelligence);

-- ===========================================
-- 2. PROPERTY UPLOAD DRAFTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_upload_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  builder_id UUID REFERENCES public.builders(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by_admin BOOLEAN DEFAULT FALSE,
  
  -- Form Data (stores partial submissions)
  step_1_data JSONB DEFAULT '{}'::jsonb, -- Basic details
  step_2_data JSONB DEFAULT '{}'::jsonb, -- Specifications
  step_3_data JSONB DEFAULT '{}'::jsonb, -- Amenities
  step_4_data JSONB DEFAULT '{}'::jsonb, -- Media uploads
  step_5_data JSONB DEFAULT '{}'::jsonb, -- Pricing & availability
  
  -- Progress Tracking
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  completed_steps BOOLEAN[] DEFAULT ARRAY[false, false, false, false, false],
  overall_completion_percentage INTEGER DEFAULT 0 CHECK (overall_completion_percentage >= 0 AND overall_completion_percentage <= 100),
  
  -- Media Handling
  uploaded_images UUID[] DEFAULT '{}', -- Array of media asset IDs
  uploaded_documents UUID[] DEFAULT '{}',
  uploaded_videos UUID[] DEFAULT '{}',
  
  -- Validation
  validation_errors JSONB DEFAULT '{}'::jsonb,
  is_valid BOOLEAN DEFAULT FALSE,
  
  -- Lifecycle
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'published', 'archived')),
  submitted_at TIMESTAMPTZ,
  published_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  auto_save_enabled BOOLEAN DEFAULT TRUE,
  last_auto_save TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_drafts_builder ON public.property_upload_drafts(builder_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON public.property_upload_drafts(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.property_upload_drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON public.property_upload_drafts(created_at DESC);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.update_property_draft_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_draft_update_timestamp ON public.property_upload_drafts;
CREATE TRIGGER property_draft_update_timestamp
  BEFORE UPDATE ON public.property_upload_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_draft_timestamp();

-- ===========================================
-- 3. PROPERTY VERIFICATION HISTORY TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Verification Details
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  verified_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  verification_notes TEXT,
  
  -- Document Checks
  documents_verified JSONB DEFAULT '{}'::jsonb,
  -- {
  --   rera_certificate: {verified: boolean, notes: string},
  --   completion_certificate: {verified: boolean, notes: string},
  --   occupancy_certificate: {verified: boolean, notes: string},
  --   land_title: {verified: boolean, notes: string}
  -- }
  
  -- Action Taken
  action_required BOOLEAN DEFAULT FALSE,
  action_items TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_property ON public.property_verification_history(property_id);
CREATE INDEX IF NOT EXISTS idx_verification_user ON public.property_verification_history(verified_by_user_id);
CREATE INDEX IF NOT EXISTS idx_verification_created_at ON public.property_verification_history(created_at DESC);

-- ===========================================
-- 4. BUILDER ENGAGEMENT METRICS TABLE
-- ===========================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.builder_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES public.builders(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Engagement Metrics
  total_property_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  avg_time_on_property_page_seconds NUMERIC DEFAULT 0,
  property_favorites_count INTEGER DEFAULT 0,
  property_inquiries_count INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  
  -- Lead Metrics
  total_leads_received INTEGER DEFAULT 0,
  qualified_leads_count INTEGER DEFAULT 0,
  hot_leads_count INTEGER DEFAULT 0,
  avg_lead_score NUMERIC DEFAULT 0,
  
  -- Conversion Metrics
  site_visits_scheduled INTEGER DEFAULT 0,
  site_visits_completed INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  
  -- Property Metrics
  active_properties_count INTEGER DEFAULT 0,
  featured_properties_count INTEGER DEFAULT 0,
  avg_property_views_per_listing NUMERIC DEFAULT 0,
  avg_inquiries_per_listing NUMERIC DEFAULT 0,
  
  -- Calculated Scores (0-100)
  engagement_score NUMERIC DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  quality_score NUMERIC DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  velocity_score NUMERIC DEFAULT 0 CHECK (velocity_score >= 0 AND velocity_score <= 100),
  overall_ai_ranking NUMERIC DEFAULT 0 CHECK (overall_ai_ranking >= 0 AND overall_ai_ranking <= 100),
  
  -- Additional Metrics
  emails_sent INTEGER DEFAULT 0,
  whatsapp_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  whatsapp_click_rate NUMERIC DEFAULT 0,
  unique_visitor_count INTEGER DEFAULT 0,
  
  -- Timestamps
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one metric record per builder per day
  UNIQUE(builder_id, calculation_date)
);

-- Add missing columns if table already exists (for backward compatibility)
DO $$ 
BEGIN
  -- Add overall_ai_ranking if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'builder_engagement_metrics' 
    AND column_name = 'overall_ai_ranking'
  ) THEN
    ALTER TABLE public.builder_engagement_metrics 
    ADD COLUMN overall_ai_ranking NUMERIC DEFAULT 0 CHECK (overall_ai_ranking >= 0 AND overall_ai_ranking <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_metrics_builder ON public.builder_engagement_metrics(builder_id);
CREATE INDEX IF NOT EXISTS idx_metrics_calculation_date ON public.builder_engagement_metrics(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_overall_ranking ON public.builder_engagement_metrics(overall_ai_ranking DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_engagement_score ON public.builder_engagement_metrics(engagement_score DESC);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.update_metrics_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS metrics_update_timestamp ON public.builder_engagement_metrics;
CREATE TRIGGER metrics_update_timestamp
  BEFORE UPDATE ON public.builder_engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_metrics_timestamp();

-- ===========================================
-- 5. ADMIN ACTIVITY LOG TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type VARCHAR(100) NOT NULL,
  action_description TEXT,
  target_type VARCHAR(50), -- 'property', 'builder', 'user', 'lead', etc.
  target_id UUID,
  target_name TEXT,
  
  -- State Changes
  previous_state JSONB,
  new_state JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin ON public.admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_action_type ON public.admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_log_target ON public.admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_created_at ON public.admin_activity_log(created_at DESC);

-- ===========================================
-- 6. EXTEND USER_ROLES TABLE (if exists)
-- ===========================================

-- Check if user_roles table exists and extend it
DO $$ 
BEGIN
  -- Add admin-specific permissions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS can_manage_all_builders BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS can_upload_for_builders BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS can_verify_properties BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS assigned_builder_ids UUID[];
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ===========================================
-- 7. ADMIN BUILDER ASSIGNMENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.admin_builder_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES public.builders(id) ON DELETE CASCADE,
  
  -- Permissions
  permissions JSONB DEFAULT '{
    "upload_properties": true,
    "edit_properties": true,
    "view_analytics": true,
    "manage_leads": true
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by_user_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one assignment per admin-builder pair
  UNIQUE(admin_user_id, builder_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_admin ON public.admin_builder_assignments(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_builder ON public.admin_builder_assignments(builder_id);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON public.admin_builder_assignments(is_active) WHERE is_active = TRUE;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.update_assignment_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assignment_update_timestamp ON public.admin_builder_assignments;
CREATE TRIGGER assignment_update_timestamp
  BEFORE UPDATE ON public.admin_builder_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assignment_timestamp();

-- ===========================================
-- 8. HELPER FUNCTION: Calculate Builder Ranking
-- ===========================================

CREATE OR REPLACE FUNCTION public.calculate_builder_ranking(p_builder_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_metrics JSONB;
  v_engagement_score NUMERIC := 0;
  v_quality_score NUMERIC := 0;
  v_velocity_score NUMERIC := 0;
  v_overall_ranking NUMERIC := 0;
BEGIN
  -- Calculate engagement metrics from property_views
  SELECT 
    COUNT(*)::NUMERIC as total_views,
    COUNT(DISTINCT pv.user_id)::NUMERIC as unique_viewers,
    COALESCE(AVG(pv.view_duration), 0)::NUMERIC as avg_time
  INTO v_metrics
  FROM property_views pv
  JOIN properties p ON p.id = pv.property_id
  WHERE p.builder_id = p_builder_id
    AND pv.viewed_at >= NOW() - INTERVAL '30 days';
  
  -- If no views, set default metrics
  IF v_metrics IS NULL THEN
    v_metrics := '{"total_views": 0, "unique_viewers": 0, "avg_time": 0}'::jsonb;
  END IF;
  
  -- Calculate quality metrics from leads
  SELECT 
    COUNT(*)::NUMERIC as total_leads,
    COUNT(*) FILTER (WHERE score >= 7)::NUMERIC as qualified_leads,
    COUNT(*) FILTER (WHERE score >= 9)::NUMERIC as hot_leads,
    COALESCE(AVG(score), 0)::NUMERIC as avg_score
  INTO v_metrics
  FROM leads
  WHERE builder_id = p_builder_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- If no leads, set default metrics
  IF v_metrics IS NULL THEN
    v_metrics := '{"total_leads": 0, "qualified_leads": 0, "hot_leads": 0, "avg_score": 0}'::jsonb;
  END IF;
  
  -- Calculate scores (simplified version)
  v_engagement_score := LEAST(100, COALESCE((v_metrics->>'total_views')::NUMERIC, 0) * 0.1);
  v_quality_score := LEAST(100, COALESCE((v_metrics->>'avg_score')::NUMERIC, 0) * 10);
  v_velocity_score := LEAST(100, COALESCE((v_metrics->>'total_leads')::NUMERIC, 0) * 2);
  v_overall_ranking := (v_engagement_score * 0.4) + (v_quality_score * 0.4) + (v_velocity_score * 0.2);
  
  -- Upsert metrics
  INSERT INTO builder_engagement_metrics (
    builder_id,
    calculation_date,
    engagement_score,
    quality_score,
    velocity_score,
    overall_ai_ranking,
    last_calculated
  )
  VALUES (
    p_builder_id,
    CURRENT_DATE,
    v_engagement_score,
    v_quality_score,
    v_velocity_score,
    v_overall_ranking,
    NOW()
  )
  ON CONFLICT (builder_id, calculation_date)
  DO UPDATE SET
    engagement_score = EXCLUDED.engagement_score,
    quality_score = EXCLUDED.quality_score,
    velocity_score = EXCLUDED.velocity_score,
    overall_ai_ranking = EXCLUDED.overall_ai_ranking,
    last_calculated = NOW(),
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'builder_id', p_builder_id,
    'engagement_score', v_engagement_score,
    'quality_score', v_quality_score,
    'velocity_score', v_velocity_score,
    'overall_ai_ranking', v_overall_ranking
  );
END;
$$;

COMMENT ON FUNCTION public.calculate_builder_ranking IS 'Calculates and updates builder engagement metrics and ranking scores';

COMMIT;




