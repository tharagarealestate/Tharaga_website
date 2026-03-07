-- =====================================================
-- UPDATE ADMIN PROFILE ROLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- This script ensures the admin email has 'admin' role in both
-- profiles and user_roles tables for full access

BEGIN;

-- 1. Update profiles table
UPDATE public.profiles
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'tharagarealestate@gmail.com';

-- 2. Ensure admin role exists in user_roles table
INSERT INTO public.user_roles (user_id, role, is_primary)
SELECT id, 'admin', true
FROM public.profiles
WHERE email = 'tharagarealestate@gmail.com'
ON CONFLICT (user_id, role)
DO UPDATE SET
  is_primary = true,
  updated_at = NOW();

-- 3. Grant all permissions to admin (if permissions column exists)
UPDATE public.profiles
SET permissions = jsonb_build_object(
  'lead:view', true,
  'lead:create', true,
  'lead:update', true,
  'lead:delete', true,
  'property:view', true,
  'property:create', true,
  'property:update', true,
  'property:delete', true,
  'buyer:dashboard', true,
  'buyer:favorites', true,
  'buyer:search', true,
  'builder:dashboard', true,
  'builder:analytics', true
)
WHERE email = 'tharagarealestate@gmail.com';

COMMIT;

-- Verification queries
SELECT
  id,
  email,
  role,
  permissions,
  created_at,
  updated_at
FROM public.profiles
WHERE email = 'tharagarealestate@gmail.com';

SELECT
  user_id,
  role,
  is_primary,
  created_at,
  updated_at
FROM public.user_roles
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'tharagarealestate@gmail.com');
