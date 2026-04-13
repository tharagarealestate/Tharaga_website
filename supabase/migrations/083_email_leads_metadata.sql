-- ============================================================
-- Migration 083: Adjusting leads schema for Email Lead Parsing
-- Adding deduplication and metadata fields for Gmail webhook
-- ============================================================

DO $$ BEGIN
  -- External message ID for deduplication (Gmail message ID)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='external_message_id') THEN
    ALTER TABLE public.leads ADD COLUMN external_message_id text UNIQUE;
  END IF;

  -- Property inquiry text (since property_id is usually UUID, the email text goes here)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='property_inquiry') THEN
    ALTER TABLE public.leads ADD COLUMN property_inquiry text;
  END IF;

  -- Email metadata (subject, sender, threadId, rawText)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='email_metadata') THEN
    ALTER TABLE public.leads ADD COLUMN email_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
