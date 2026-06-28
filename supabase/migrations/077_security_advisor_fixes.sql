-- ============================================================
-- Migration: 077_security_advisor_fixes.sql
-- Date: 2026-03-05
-- Purpose: Fix Supabase security advisor warnings
--
-- Issues resolved:
--   1. security_definer_view → public.v_properties_dedup
--   2. security_definer_view → public.property_interactions_hourly
--   3. rls_disabled_in_public → public.spatial_ref_sys
--
-- Root cause: Views created by the postgres superuser act as
-- SECURITY DEFINER, bypassing RLS on underlying tables.
-- Fix: Set security_invoker = on so views run as the CALLER,
-- meaning RLS policies on underlying tables are respected.
--
-- Applied live via Edge Function on 2026-03-05 (all confirmed ✅).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Fix v_properties_dedup — set security_invoker = on
-- ──────────────────────────────────────────────────────────────
-- This view deduplicated properties by (title, city, locality).
-- Without security_invoker=on, it ran with postgres superuser
-- privileges, bypassing RLS on the underlying `properties` table.
-- Any unauthenticated user could query this view and see ALL
-- properties regardless of their listing status/visibility.

DROP VIEW IF EXISTS public.v_properties_dedup CASCADE;

CREATE VIEW public.v_properties_dedup
  WITH (security_invoker = on)
AS
  SELECT DISTINCT ON (title, city, locality) *
  FROM public.properties
  ORDER BY title, city, locality, embedded_at DESC;

-- Restore access grants (view drops grants when recreated)
GRANT SELECT ON public.v_properties_dedup
  TO anon, authenticated, service_role;

COMMENT ON VIEW public.v_properties_dedup IS
  'Deduplicated properties view (by title+city+locality). '
  'security_invoker=on ensures RLS on the underlying properties table is respected.';

-- ──────────────────────────────────────────────────────────────
-- 2. Fix property_interactions_hourly — security_invoker or RLS
-- ──────────────────────────────────────────────────────────────
-- This object is either a VIEW or a BASE TABLE depending on which
-- migration ran first. We handle both cases.

DO $$
DECLARE
  obj_type text;
  view_def text;
BEGIN
  SELECT table_type INTO obj_type
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name   = 'property_interactions_hourly';

  IF obj_type IS NULL THEN
    RAISE NOTICE 'property_interactions_hourly not found — skip';
    RETURN;
  END IF;

  IF obj_type = 'VIEW' THEN
    -- ── It's a VIEW: recreate with security_invoker = on ──────────────
    SELECT view_definition INTO view_def
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name   = 'property_interactions_hourly';

    EXECUTE 'DROP VIEW IF EXISTS public.property_interactions_hourly CASCADE';
    EXECUTE format(
      'CREATE VIEW public.property_interactions_hourly'
      ' WITH (security_invoker = on) AS %s',
      view_def
    );
    EXECUTE 'GRANT SELECT ON public.property_interactions_hourly'
      ' TO anon, authenticated, service_role';
    RAISE NOTICE 'property_interactions_hourly VIEW: security_invoker=on applied';

  ELSE
    -- ── It's a TABLE: ensure RLS is enabled with correct policies ─────
    ALTER TABLE public.property_interactions_hourly
      ENABLE ROW LEVEL SECURITY;

    -- Clean up any stale policies
    DROP POLICY IF EXISTS "Builders can view their property interactions"
      ON public.property_interactions_hourly;
    DROP POLICY IF EXISTS "Admins can view all property interactions"
      ON public.property_interactions_hourly;
    DROP POLICY IF EXISTS "builders_view_own_interactions"
      ON public.property_interactions_hourly;
    DROP POLICY IF EXISTS "admins_view_all_interactions"
      ON public.property_interactions_hourly;
    DROP POLICY IF EXISTS "service_role_all_interactions"
      ON public.property_interactions_hourly;

    -- Builders: only see interactions for their own properties
    CREATE POLICY "builders_view_own_interactions"
      ON public.property_interactions_hourly FOR SELECT
      USING (
        property_id IN (
          SELECT id FROM public.properties
          WHERE builder_id = auth.uid()
        )
      );

    -- Admins: see all interactions
    CREATE POLICY "admins_view_all_interactions"
      ON public.property_interactions_hourly FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
      );

    -- Service role: full access for analytics writes
    CREATE POLICY "service_role_all_interactions"
      ON public.property_interactions_hourly FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    RAISE NOTICE 'property_interactions_hourly TABLE: RLS enabled + policies created';
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 3. Fix spatial_ref_sys — enable RLS with read-only policy
-- ──────────────────────────────────────────────────────────────
-- spatial_ref_sys is a PostGIS system table (Coordinate Reference
-- Systems). It contains only public reference data (EPSG codes) —
-- no sensitive information. RLS is enabled with a SELECT-only policy.
-- Must run as supabase_admin (table owner) via SET ROLE.

DO $$
DECLARE
  tbl_owner text;
BEGIN
  SELECT tableowner INTO tbl_owner
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys';

  IF tbl_owner IS NULL THEN
    RAISE NOTICE 'spatial_ref_sys not found — skip';
    RETURN;
  END IF;

  -- Attempt to run as table owner for DDL
  BEGIN
    EXECUTE format('SET ROLE %I', tbl_owner);

    ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "allow_read_spatial_ref_sys"
      ON public.spatial_ref_sys;

    -- CRS data is public knowledge — allow all authenticated roles to read
    CREATE POLICY "allow_read_spatial_ref_sys"
      ON public.spatial_ref_sys FOR SELECT
      USING (true);

    RESET ROLE;
    RAISE NOTICE 'spatial_ref_sys: RLS enabled via SET ROLE %', tbl_owner;

  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    RAISE WARNING 'SET ROLE % failed: %. Using GRANT fallback.', tbl_owner, SQLERRM;

    -- Fallback: restrict access via GRANT (no RLS, but access-controlled)
    REVOKE ALL ON public.spatial_ref_sys FROM PUBLIC;
    GRANT SELECT ON public.spatial_ref_sys
      TO anon, authenticated, service_role;

    RAISE NOTICE 'spatial_ref_sys: Fallback — revoked PUBLIC, granted SELECT to anon/authenticated/service_role';
  END;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- Verification queries (for manual review in Supabase SQL editor)
-- ──────────────────────────────────────────────────────────────
-- Run these to confirm all fixes:
--
-- SELECT c.relname AS view_name,
--        array_to_string(c.reloptions, ', ') AS options,
--        CASE
--          WHEN c.reloptions @> ARRAY['security_invoker=on'] THEN 'SECURE ✅'
--          ELSE 'NEEDS FIX ⚠️'
--        END AS status
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'v';
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = false;
