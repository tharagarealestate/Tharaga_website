-- Ensure profiles.role exists and constrain values
-- Safe to run multiple times
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS role text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role in ('admin','builder','user'));
EXCEPTION WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
