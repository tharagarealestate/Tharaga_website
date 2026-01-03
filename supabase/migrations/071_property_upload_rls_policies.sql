-- ===========================================
-- Migration: 071_property_upload_rls_policies.sql
-- Row-Level Security Policies for Property Upload System
-- ===========================================

BEGIN;

-- ===========================================
-- 1. ENABLE RLS ON ALL NEW TABLES
-- ===========================================

ALTER TABLE public.property_upload_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_builder_assignments ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 2. PROPERTY UPLOAD DRAFTS POLICIES
-- ===========================================

-- Builders can view their own drafts
CREATE POLICY "builders_view_own_drafts"
  ON public.property_upload_drafts
  FOR SELECT
  USING (
    uploaded_by_user_id = auth.uid() AND uploaded_by_admin = FALSE
  );

-- Builders can insert their own drafts
CREATE POLICY "builders_insert_own_drafts"
  ON public.property_upload_drafts
  FOR INSERT
  WITH CHECK (
    uploaded_by_user_id = auth.uid() AND uploaded_by_admin = FALSE
  );

-- Builders can update their own drafts
CREATE POLICY "builders_update_own_drafts"
  ON public.property_upload_drafts
  FOR UPDATE
  USING (
    uploaded_by_user_id = auth.uid() AND uploaded_by_admin = FALSE
  );

-- Admins can view all drafts
CREATE POLICY "admins_view_all_drafts"
  ON public.property_upload_drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can insert drafts for assigned builders
CREATE POLICY "admins_insert_drafts"
  ON public.property_upload_drafts
  FOR INSERT
  WITH CHECK (
    uploaded_by_user_id = auth.uid() AND uploaded_by_admin = TRUE
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND can_upload_for_builders = TRUE
      )
      OR
      builder_id IN (
        SELECT builder_id FROM public.admin_builder_assignments
        WHERE admin_user_id = auth.uid()
        AND is_active = TRUE
      )
    )
  );

-- Admins can update drafts for assigned builders
CREATE POLICY "admins_update_drafts"
  ON public.property_upload_drafts
  FOR UPDATE
  USING (
    uploaded_by_user_id = auth.uid() AND uploaded_by_admin = TRUE
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND can_upload_for_builders = TRUE
      )
      OR
      builder_id IN (
        SELECT builder_id FROM public.admin_builder_assignments
        WHERE admin_user_id = auth.uid()
        AND is_active = TRUE
      )
    )
  );

-- Service role has full access
CREATE POLICY "service_role_full_access_drafts"
  ON public.property_upload_drafts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- 3. PROPERTY VERIFICATION HISTORY POLICIES
-- ===========================================

-- Builders can view verification history for their properties
CREATE POLICY "builders_view_own_verification_history"
  ON public.property_verification_history
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties
      WHERE builder_id IN (
        SELECT DISTINCT builder_id FROM public.property_upload_drafts
        WHERE uploaded_by_user_id = auth.uid()
        AND builder_id IS NOT NULL
      )
    )
  );

-- Admins can view all verification history
CREATE POLICY "admins_view_all_verification_history"
  ON public.property_verification_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can insert verification history
CREATE POLICY "admins_insert_verification_history"
  ON public.property_verification_history
  FOR INSERT
  WITH CHECK (
    verified_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND can_verify_properties = TRUE
    )
  );

-- Service role has full access
CREATE POLICY "service_role_full_access_verification"
  ON public.property_verification_history
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- 4. BUILDER ENGAGEMENT METRICS POLICIES
-- ===========================================

-- Builders can view their own metrics
CREATE POLICY "builders_view_own_metrics"
  ON public.builder_engagement_metrics
  FOR SELECT
  USING (
    builder_id IN (
      SELECT DISTINCT builder_id FROM public.property_upload_drafts
      WHERE uploaded_by_user_id = auth.uid()
      AND builder_id IS NOT NULL
    )
  );

-- Admins can view all metrics
CREATE POLICY "admins_view_all_metrics"
  ON public.builder_engagement_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Public can view metrics (for builder listing page)
CREATE POLICY "public_view_metrics"
  ON public.builder_engagement_metrics
  FOR SELECT
  USING (TRUE);

-- Service role can insert/update metrics
CREATE POLICY "service_role_manage_metrics"
  ON public.builder_engagement_metrics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- 5. ADMIN ACTIVITY LOG POLICIES
-- ===========================================

-- Admins can view all activity logs
CREATE POLICY "admins_view_all_activity_logs"
  ON public.admin_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can insert their own activity logs
CREATE POLICY "admins_insert_own_activity_logs"
  ON public.admin_activity_log
  FOR INSERT
  WITH CHECK (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "service_role_full_access_activity_logs"
  ON public.admin_activity_log
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- 6. ADMIN BUILDER ASSIGNMENTS POLICIES
-- ===========================================

-- Admins can view their own assignments
CREATE POLICY "admins_view_own_assignments"
  ON public.admin_builder_assignments
  FOR SELECT
  USING (
    admin_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND can_manage_all_builders = TRUE
    )
  );

-- Builders can view assignments for their builder
CREATE POLICY "builders_view_assignments"
  ON public.admin_builder_assignments
  FOR SELECT
  USING (
    builder_id IN (
      SELECT DISTINCT builder_id FROM public.property_upload_drafts
      WHERE uploaded_by_user_id = auth.uid()
      AND builder_id IS NOT NULL
    )
  );

-- Admins can insert assignments (if they have permission)
CREATE POLICY "admins_insert_assignments"
  ON public.admin_builder_assignments
  FOR INSERT
  WITH CHECK (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND can_manage_all_builders = TRUE
    )
  );

-- Admins can update their own assignments
CREATE POLICY "admins_update_own_assignments"
  ON public.admin_builder_assignments
  FOR UPDATE
  USING (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "service_role_full_access_assignments"
  ON public.admin_builder_assignments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- 7. UPDATE EXISTING PROPERTIES TABLE POLICIES
-- ===========================================

-- Ensure properties table has RLS enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Admins can view properties uploaded on behalf of assigned builders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties' 
    AND policyname = 'admins_view_assigned_builder_properties'
  ) THEN
    CREATE POLICY "admins_view_assigned_builder_properties"
      ON public.properties
      FOR SELECT
      USING (
        uploaded_by_admin = TRUE
        AND admin_user_id = auth.uid()
        OR
        builder_id IN (
          SELECT builder_id FROM public.admin_builder_assignments
          WHERE admin_user_id = auth.uid()
          AND is_active = TRUE
        )
      );
  END IF;
END $$;

-- Admins can update properties for assigned builders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties' 
    AND policyname = 'admins_update_assigned_builder_properties'
  ) THEN
    CREATE POLICY "admins_update_assigned_builder_properties"
      ON public.properties
      FOR UPDATE
      USING (
        uploaded_by_admin = TRUE
        AND admin_user_id = auth.uid()
        OR
        builder_id IN (
          SELECT builder_id FROM public.admin_builder_assignments
          WHERE admin_user_id = auth.uid()
          AND is_active = TRUE
        )
      );
  END IF;
END $$;

COMMIT;




