-- Fix RLS policies to check BOTH user_roles AND profiles tables for admin access
-- This ensures admin users can access leads regardless of which table stores their role

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;

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
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
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

COMMENT ON POLICY "Admins can view all leads" ON public.leads IS 'Allows admin users to view all leads, checking both profiles and user_roles tables';
COMMENT ON POLICY "Admins can update all leads" ON public.leads IS 'Allows admin users to update any lead, checking both profiles and user_roles tables';
COMMENT ON POLICY "Admins can delete leads" ON public.leads IS 'Allows admin users to delete leads, checking both profiles and user_roles tables';
