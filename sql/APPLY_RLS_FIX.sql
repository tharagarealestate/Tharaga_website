-- =============================================
-- RLS POLICY FIX FOR ADMIN LEADS ACCESS
-- Run this in Supabase SQL Editor
-- =============================================

-- This migration fixes admin access to leads by checking BOTH
-- the user_roles table (primary source) and profiles table (fallback)

BEGIN;

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Recreate admin view policy with dual table check
CREATE POLICY "Admins can view all leads"
  ON public.leads
  FOR SELECT
  USING (
    -- Check profiles table
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Check user_roles table (primary source)
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Recreate admin update policy with dual table check
CREATE POLICY "Admins can update all leads"
  ON public.leads
  FOR UPDATE
  USING (
    -- Check profiles table
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Check user_roles table (primary source)
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add admin delete policy
CREATE POLICY "Admins can delete leads"
  ON public.leads
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON POLICY "Admins can view all leads" ON public.leads IS 'Allows admin users to view all leads, checking both profiles and user_roles tables';
COMMENT ON POLICY "Admins can update all leads" ON public.leads IS 'Allows admin users to update any lead, checking both profiles and user_roles tables';
COMMENT ON POLICY "Admins can delete leads" ON public.leads IS 'Allows admin users to delete leads, checking both profiles and user_roles tables';

COMMIT;

-- Verification query - Run this separately to verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'leads'
AND policyname LIKE '%Admin%'
ORDER BY policyname;
