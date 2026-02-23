/**
 * Add Admin Role to tharagarealestate@gmail.com
 * This will give you access to the admin panel at https://tharaga.co.in/admin
 */

-- Add admin role to tharagarealestate@gmail.com
INSERT INTO user_roles (user_id, role, is_primary, verified)
SELECT
  id as user_id,
  'admin' as role,
  false as is_primary,  -- Don't make it primary by default
  true as verified
FROM auth.users
WHERE email = 'tharagarealestate@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the admin role was added successfully
SELECT
  u.email,
  ur.role,
  ur.is_primary,
  ur.verified,
  ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'tharagarealestate@gmail.com'
ORDER BY ur.created_at DESC;

-- You should see output like:
-- email                          | role    | is_primary | verified | created_at
-- tharagarealestate@gmail.com    | admin   | false      | true     | 2025-01-03...
-- tharagarealestate@gmail.com    | buyer   | true       | true     | 2025-01-03...
-- (or whatever roles you currently have)
