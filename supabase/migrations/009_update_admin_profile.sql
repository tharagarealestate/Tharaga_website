-- Migration: Update admin profile for tharagarealestate@gmail.com
-- Description: Sets the role to 'admin' for the main admin user
-- Date: 2026-01-22

-- Update the profile to admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tharagarealestate@gmail.com';

-- Verify the update
SELECT id, email, role, created_at, updated_at
FROM public.profiles
WHERE email = 'tharagarealestate@gmail.com';

-- If no rows were updated, it means the profile doesn't exist yet
-- The user needs to log in at least once to create their profile
DO $$
DECLARE
  row_count INT;
BEGIN
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count = 0 THEN
    RAISE NOTICE 'No profile found for tharagarealestate@gmail.com - user must log in first to create profile';
  ELSE
    RAISE NOTICE 'Successfully updated % profile(s) to admin role', row_count;
  END IF;
END $$;
