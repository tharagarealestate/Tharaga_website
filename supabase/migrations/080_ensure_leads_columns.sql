-- ============================================================
-- Migration 080: Ensure all leads columns exist
-- Safe idempotent — all wrapped in IF NOT EXISTS guards.
-- Fixes: "column leads.phone does not exist" and similar errors
-- when the live DB was bootstrapped from a different schema version.
-- ============================================================

-- Core contact fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='phone') THEN
    ALTER TABLE public.leads ADD COLUMN phone text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='email') THEN
    ALTER TABLE public.leads ADD COLUMN email text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='name') THEN
    ALTER TABLE public.leads ADD COLUMN name text NOT NULL DEFAULT 'Unknown';
  END IF;
END $$;

-- Phone normalized (E.164) — added by migration 015
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='phone_normalized') THEN
    ALTER TABLE public.leads ADD COLUMN phone_normalized text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone_normalized ON public.leads(phone_normalized) WHERE phone_normalized IS NOT NULL;
  END IF;
END $$;

-- SmartScore (0-100 int) — required for HOT/WARM/COOL tier classification
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='smartscore') THEN
    ALTER TABLE public.leads ADD COLUMN smartscore integer NOT NULL DEFAULT 0 CHECK (smartscore >= 0 AND smartscore <= 100);
    CREATE INDEX IF NOT EXISTS idx_leads_smartscore ON public.leads(smartscore DESC);
  END IF;
END $$;

-- Old score column (0-10 float) — kept for backwards compat
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='score') THEN
    ALTER TABLE public.leads ADD COLUMN score numeric NOT NULL DEFAULT 5.0 CHECK (score >= 0 AND score <= 10);
  END IF;
END $$;

-- Status / pipeline
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='status') THEN
    ALTER TABLE public.leads ADD COLUMN status text NOT NULL DEFAULT 'new'
      CHECK (status IN ('new','contacted','qualified','converted','lost'));
  END IF;
END $$;

-- UTM / attribution
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_source') THEN
    ALTER TABLE public.leads ADD COLUMN utm_source text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_medium') THEN
    ALTER TABLE public.leads ADD COLUMN utm_medium text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_campaign') THEN
    ALTER TABLE public.leads ADD COLUMN utm_campaign text;
  END IF;
END $$;

-- Source (channel name)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='source') THEN
    ALTER TABLE public.leads ADD COLUMN source text;
  END IF;
END $$;

-- Budget
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='budget') THEN
    ALTER TABLE public.leads ADD COLUMN budget numeric;
  END IF;
END $$;

-- Purpose (self_use / investment / rental)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='purpose') THEN
    ALTER TABLE public.leads ADD COLUMN purpose text;
  END IF;
END $$;

-- SLA deadline (for HOT lead response timer)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='sla_deadline') THEN
    ALTER TABLE public.leads ADD COLUMN sla_deadline timestamptz;
    CREATE INDEX IF NOT EXISTS idx_leads_sla_deadline ON public.leads(sla_deadline) WHERE sla_deadline IS NOT NULL;
  END IF;
END $$;

-- Assignment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='assigned_to') THEN
    ALTER TABLE public.leads ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Score breakdown (JSONB: budget/timeline/behavioral/intent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='score_breakdown') THEN
    ALTER TABLE public.leads ADD COLUMN score_breakdown jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Qualification data (JSONB: AI stage + extracted fields)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='qualification_data') THEN
    ALTER TABLE public.leads ADD COLUMN qualification_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Tharaga AI stage (computed from qualification_data by trigger in migration 079)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='ai_stage') THEN
    ALTER TABLE public.leads ADD COLUMN ai_stage text
      CHECK (ai_stage IN ('GREETING','QUALIFICATION','BUDGET_CHECK','TIMELINE_CHECK','OBJECTION_HANDLING','BOOKING'));
    CREATE INDEX IF NOT EXISTS idx_leads_ai_stage ON public.leads(ai_stage);
  END IF;
END $$;

-- Property interest fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='preferred_location') THEN
    ALTER TABLE public.leads ADD COLUMN preferred_location text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='property_type_interest') THEN
    ALTER TABLE public.leads ADD COLUMN property_type_interest text;
  END IF;
END $$;

-- Property FK
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='property_id') THEN
    ALTER TABLE public.leads ADD COLUMN property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads(property_id);
  END IF;
END $$;

-- Builder FK
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='builder_id') THEN
    ALTER TABLE public.leads ADD COLUMN builder_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_builder_id ON public.leads(builder_id);
  END IF;
END $$;

-- Timestamps
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='updated_at') THEN
    ALTER TABLE public.leads ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- HOT/WARM/COOL computed tier (requires smartscore column above)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='tier') THEN
    ALTER TABLE public.leads ADD COLUMN tier text
      GENERATED ALWAYS AS (
        CASE WHEN smartscore >= 70 THEN 'HOT' WHEN smartscore >= 40 THEN 'WARM' ELSE 'COOL' END
      ) STORED;
    CREATE INDEX IF NOT EXISTS idx_leads_tier ON public.leads(tier);
  END IF;
END $$;

-- Ensure leads table has RLS enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Ensure basic policies exist (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Builders can view their own leads') THEN
    CREATE POLICY "Builders can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = builder_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Service role can insert leads') THEN
    CREATE POLICY "Service role can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Builders can update their own leads') THEN
    CREATE POLICY "Builders can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = builder_id);
  END IF;
END $$;

-- Ensure leads are in supabase_realtime publication
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='leads') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE 'Migration 080 complete — all leads columns ensured'; END $$;
