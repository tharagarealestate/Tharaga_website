-- Extend profiles table with columns referenced in the application
-- Based on codebase analysis

-- Add missing columns to profiles table
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
EXCEPTION WHEN others THEN NULL; END $$;

-- Add indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON public.profiles(company_name);

-- Add helpful comments
COMMENT ON COLUMN public.profiles.name IS 'User display name (alternative to full_name)';
COMMENT ON COLUMN public.profiles.company_name IS 'Company name for builder accounts';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, builder, or user';

