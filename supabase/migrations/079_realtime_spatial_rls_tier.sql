-- ============================================================
-- Migration 079: Realtime on leads + spatial_ref_sys RLS fix
-- + tier column trigger for HOT/WARM/COOL classification
-- ============================================================

-- 1. Enable Supabase Realtime on leads table
-- (Required for client subscriptions with postgres_changes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    RAISE NOTICE 'leads table added to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'leads already in supabase_realtime — skip';
  END IF;
END $$;

-- Also enable realtime on whatsapp_conversations if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='whatsapp_conversations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='whatsapp_conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
    END IF;
  END IF;
END $$;

-- 2. Add `tier` computed column to leads (HOT/WARM/COOL derived from smartscore)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leads' AND column_name='tier'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN tier text
      GENERATED ALWAYS AS (
        CASE
          WHEN smartscore >= 70 THEN 'HOT'
          WHEN smartscore >= 40 THEN 'WARM'
          ELSE 'COOL'
        END
      ) STORED;
    CREATE INDEX IF NOT EXISTS idx_leads_tier ON public.leads(tier);
    RAISE NOTICE 'tier column added to leads';
  ELSE
    RAISE NOTICE 'tier column already exists — skip';
  END IF;
END $$;

-- 3. Add `ai_stage` column (Tharaga AI qualification stage — replaces Priya naming)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leads' AND column_name='ai_stage'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN ai_stage text
      CHECK (ai_stage IN ('GREETING','QUALIFICATION','BUDGET_CHECK','TIMELINE_CHECK','OBJECTION_HANDLING','BOOKING'));
    CREATE INDEX IF NOT EXISTS idx_leads_ai_stage ON public.leads(ai_stage);
    RAISE NOTICE 'ai_stage column added to leads';
  ELSE
    RAISE NOTICE 'ai_stage already exists — skip';
  END IF;
END $$;

-- 4. Trigger: auto-populate ai_stage from qualification_data->>'stage' on upsert
CREATE OR REPLACE FUNCTION public.sync_leads_ai_stage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.qualification_data IS NOT NULL AND NEW.qualification_data ? 'stage' THEN
    NEW.ai_stage := UPPER(NEW.qualification_data->>'stage');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_leads_ai_stage ON public.leads;
CREATE TRIGGER trg_sync_leads_ai_stage
  BEFORE INSERT OR UPDATE OF qualification_data ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_leads_ai_stage();

-- 5. Fix spatial_ref_sys RLS (PostGIS system table)
DO $$
DECLARE
  tbl_owner text;
BEGIN
  SELECT tableowner INTO tbl_owner
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys';

  IF tbl_owner IS NULL THEN
    RAISE NOTICE 'spatial_ref_sys not found — PostGIS not installed, skip';
    RETURN;
  END IF;

  -- Check if RLS is already enabled
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys' AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'spatial_ref_sys RLS already enabled — skip';
    RETURN;
  END IF;

  BEGIN
    EXECUTE format('SET LOCAL ROLE %I', tbl_owner);
    ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
    RESET ROLE;

    DROP POLICY IF EXISTS "allow_read_spatial_ref_sys" ON public.spatial_ref_sys;
    CREATE POLICY "allow_read_spatial_ref_sys"
      ON public.spatial_ref_sys FOR SELECT USING (true);

    RAISE NOTICE 'spatial_ref_sys: RLS enabled with SELECT policy';
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    -- Fallback: restrict via GRANT instead of RLS
    REVOKE ALL ON public.spatial_ref_sys FROM PUBLIC;
    GRANT SELECT ON public.spatial_ref_sys TO anon, authenticated, service_role;
    RAISE NOTICE 'spatial_ref_sys: SET ROLE failed — applied GRANT SELECT fallback';
  END;
END;
$$;

-- 6. Ensure properties table has realtime enabled too (needed for property count)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'properties'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.leads.tier IS 'Computed tier: HOT (smartscore≥70), WARM (40–69), COOL (<40). Replaces lion/monkey/dog classification.';
COMMENT ON COLUMN public.leads.ai_stage IS 'Tharaga AI WhatsApp qualification stage: GREETING→QUALIFICATION→BUDGET_CHECK→TIMELINE_CHECK→OBJECTION_HANDLING→BOOKING';
