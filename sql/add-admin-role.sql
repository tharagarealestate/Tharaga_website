/**
 * Helper SQL to Add Admin Role to a User
 *
 * HOW TO USE:
 * 1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new
 * 2. Replace 'your-email@example.com' with the actual admin email
 * 3. Run this query
 */

-- Add admin role to specific user by email
INSERT INTO user_roles (user_id, role, is_primary, verified)
SELECT
  id as user_id,
  'admin' as role,
  false as is_primary,  -- Don't make it primary by default
  true as verified
FROM auth.users
WHERE email = 'your-email@example.com'  -- REPLACE THIS with your actual admin email
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the admin role was added
SELECT
  u.email,
  ur.role,
  ur.is_primary,
  ur.verified,
  ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com'  -- REPLACE THIS with your actual admin email
ORDER BY ur.created_at DESC;
