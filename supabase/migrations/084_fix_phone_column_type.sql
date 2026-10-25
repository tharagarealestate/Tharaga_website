-- ============================================================
-- Migration 084: Fix phone column data type
-- Changing phone columns from bigint to text to support international numbers and avoid operator type mismatches
-- ============================================================

DO $$ BEGIN
  -- Alter phone column to text
  ALTER TABLE public.leads ALTER COLUMN phone TYPE text USING phone::text;
  
  -- Alter phone_normalized column to text (if it exists as bigint)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='phone_normalized' AND data_type != 'text') THEN
    ALTER TABLE public.leads ALTER COLUMN phone_normalized TYPE text USING phone_normalized::text;
  END IF;
END $$;
