-- ============================================================
-- Migration 083: Comprehensive RLS Security Fix
-- Date: 2026-03-30
-- Resolves: Supabase security advisory "rls_disabled_in_public"
--
-- Three classes of fixes:
-- 1. Enable RLS on the 25 tables that were created without it
-- 2. Ensure leads table is secured (anon key was returning all data)
-- 3. Add service_role bypass policies so API routes (service key)
--    can read/write without needing per-table RLS grants
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- SECTION 1: Enable RLS on tables missing it
-- All are wrapped in DO blocks so re-running is idempotent
-- ──────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.behavioral_automation_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.builder_insights             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.builder_subscriptions_new    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.buyer_journey                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.communication_suggestions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competitive_advantages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competitive_analysis         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competitor_properties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contract_templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversion_analytics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cross_sell_recommendations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deal_lifecycle               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_sequence_executions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_sequences              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.form_variant_performance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.metro_stations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.negotiations                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_history_new          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_milestones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.price_strategy_insights      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_amenities_master    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_analysis            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.viewing_reminders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workflow_trigger_events      ENABLE ROW LEVEL SECURITY;

-- Also ensure leads + profiles have RLS (re-enable is safe; idempotent)
ALTER TABLE IF EXISTS public.leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- SECTION 2: Service-role bypass policies for all tables above
-- The service_role JWT bypasses RLS at the Postgres level, but
-- explicit policies let us verify behaviour via advisor checks.
-- Pattern: one "Service role full access" policy per table.
-- ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  -- Helper: create a service_role bypass policy if it doesn't exist
  -- Usage: PERFORM create_sr_policy('tablename');
  -- (inline because we can't create helper functions in a migration
  --  without polluting the public schema)
END $$;

-- Leads: critical — must be locked down properly
DROP POLICY IF EXISTS "Service role full access to leads"     ON public.leads;
DROP POLICY IF EXISTS "Anon can insert leads"                 ON public.leads;
DROP POLICY IF EXISTS "leads_anon_insert"                     ON public.leads;

CREATE POLICY "Service role full access to leads"
  ON public.leads FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Anonymous INSERT only: allows lead-capture forms on the public site
-- to submit a lead without a user account. SELECT is NOT allowed.
CREATE POLICY "Anon can insert leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Builders can view/update their own leads (via API route — service key used there,
-- but keep this for any client-side queries that slip through)
DROP POLICY IF EXISTS "Builders can view their own leads"  ON public.leads;
DROP POLICY IF EXISTS "leads_select_own"                   ON public.leads;
CREATE POLICY "Builders can view their own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (auth.uid() = builder_id);

DROP POLICY IF EXISTS "Builders can update their own leads" ON public.leads;
CREATE POLICY "Builders can update their own leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = builder_id);

-- Admins can see all leads (admin check via profiles table)
DROP POLICY IF EXISTS "Admins can view all leads"   ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;

CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );


-- ──────────────────────────────────────────────────────────────
-- SECTION 3: Profiles table — lock down public reads
-- The `profiles` table stores email, full_name, role.
-- Only the owner + service_role should be able to read a profile.
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access to profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile"      ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"    ON public.profiles;

CREATE POLICY "Service role full access to profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- ──────────────────────────────────────────────────────────────
-- SECTION 4: Service-role bypass for the 25 newly-RLS-enabled tables
-- These tables have no user-facing policies yet.
-- Adding service_role FULL access covers all API-route use cases.
-- Per-user policies can be added later as features require them.
-- ──────────────────────────────────────────────────────────────

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'behavioral_automation_rules', 'builder_insights', 'builder_subscriptions_new',
    'buyer_journey', 'communication_suggestions', 'competitive_advantages',
    'competitive_analysis', 'competitor_properties', 'contract_templates',
    'contracts', 'conversion_analytics', 'cross_sell_recommendations',
    'deal_lifecycle', 'email_sequence_executions', 'email_sequences',
    'form_variant_performance', 'metro_stations', 'negotiations',
    'payment_history_new', 'payment_milestones', 'price_strategy_insights',
    'property_amenities_master', 'property_analysis', 'viewing_reminders',
    'workflow_trigger_events'
  ] LOOP
    -- Only create if the table actually exists (some may not in all environments)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS "Service role full access to %1$s" ON public.%1$I; '
        'CREATE POLICY "Service role full access to %1$s" '
        '  ON public.%1$I FOR ALL TO service_role USING (true) WITH CHECK (true);',
        t
      );
    END IF;
  END LOOP;
END $$;


-- ──────────────────────────────────────────────────────────────
-- SECTION 5: Ensure metro_stations is readable by all (public data)
-- It's a reference table with no sensitive information.
-- ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'metro_stations'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can read metro stations" ON public.metro_stations;
    CREATE POLICY "Anyone can read metro stations"
      ON public.metro_stations FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;


-- ──────────────────────────────────────────────────────────────
-- SECTION 6: generated_leads — same pattern as leads
-- ──────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.generated_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'generated_leads'
  ) THEN
    DROP POLICY IF EXISTS "Service role full access to generated_leads" ON public.generated_leads;
    CREATE POLICY "Service role full access to generated_leads"
      ON public.generated_leads FOR ALL
      TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Builders can view their own generated leads" ON public.generated_leads;
    CREATE POLICY "Builders can view their own generated leads"
      ON public.generated_leads FOR SELECT
      TO authenticated
      USING (auth.uid() = builder_id);
  END IF;
END $$;
