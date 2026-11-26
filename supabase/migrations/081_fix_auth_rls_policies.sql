-- ============================================================
-- Migration 081: Fix RLS policies for builder auth resolution
--
-- Fixes the "application error" for non-admin users:
-- 1. Service role must bypass RLS on user_roles + builder_profiles
--    so Netlify API routes (service key) can read them
-- 2. Users must be able to read their own profile even during
--    the initial session check
-- 3. builder_profiles: allow service role to insert (for setup gate)
-- ============================================================

-- ─── user_roles ────────────────────────────────────────────────────────────────

-- Ensure RLS is on
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Service role bypass (needed for admin API routes that check user roles)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='Service role full access to user_roles'
  ) THEN
    CREATE POLICY "Service role full access to user_roles"
      ON public.user_roles FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Users can read their own roles (for client-side auth check)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert their own role (for onboarding flow)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='Users can insert their own roles'
  ) THEN
    CREATE POLICY "Users can insert their own roles"
      ON public.user_roles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─── builder_profiles ──────────────────────────────────────────────────────────

ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;

-- Service role bypass
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='builder_profiles' AND policyname='Service role full access to builder_profiles'
  ) THEN
    CREATE POLICY "Service role full access to builder_profiles"
      ON public.builder_profiles FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Users read own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='builder_profiles' AND policyname='Users can view their own builder profile'
  ) THEN
    CREATE POLICY "Users can view their own builder profile"
      ON public.builder_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users insert own profile (for BuilderSetupGate)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='builder_profiles' AND policyname='Users can insert their own builder profile'
  ) THEN
    CREATE POLICY "Users can insert their own builder profile"
      ON public.builder_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users update own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='builder_profiles' AND policyname='Users can update their own builder profile'
  ) THEN
    CREATE POLICY "Users can update their own builder profile"
      ON public.builder_profiles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── leads: admin email bypass policy ──────────────────────────────────────────
-- Admin (tharagarealestate@gmail.com) must see ALL leads regardless of builder_id

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Admin email sees all leads'
  ) THEN
    CREATE POLICY "Admin email sees all leads"
      ON public.leads FOR SELECT
      USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'tharagarealestate@gmail.com'
      );
  END IF;
END $$;

-- Service role can read all leads (for Netlify functions)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Service role full access to leads'
  ) THEN
    CREATE POLICY "Service role full access to leads"
      ON public.leads FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE 'Migration 081 complete — auth RLS policies fixed'; END $$;
