-- =============================================================
-- FIX: email_sequence_queue schema corrections
--   1) lead_id: UUID → BIGINT  (leads.id is BIGINT)
--   2) builder_id: UUID NOT NULL → UUID nullable
--      (public leads may have builder_id:null on the queue row)
-- =============================================================

-- Step 1: Drop existing FK constraints (they reference wrong types)
ALTER TABLE public.email_sequence_queue
  DROP CONSTRAINT IF EXISTS email_sequence_queue_lead_id_fkey;

ALTER TABLE public.email_sequence_queue
  DROP CONSTRAINT IF EXISTS email_sequence_queue_builder_id_fkey;

-- Step 2: Change lead_id from UUID to BIGINT
-- First drop NOT NULL so we can do the conversion safely
ALTER TABLE public.email_sequence_queue
  ALTER COLUMN lead_id DROP NOT NULL;

-- Clear any existing rows with invalid UUIDs stored as lead_id
-- (safe because lead_id was UUID but leads.id is BIGINT so no valid rows exist)
DELETE FROM public.email_sequence_queue
  WHERE lead_id::TEXT !~ '^[0-9]+$'
    OR lead_id IS NULL;

-- Now change column type (casting string "24" stored as UUID → BIGINT)
ALTER TABLE public.email_sequence_queue
  ALTER COLUMN lead_id TYPE BIGINT USING lead_id::TEXT::BIGINT;

-- Restore NOT NULL after type conversion
ALTER TABLE public.email_sequence_queue
  ALTER COLUMN lead_id SET NOT NULL;

-- Re-add FK to leads(id) with correct BIGINT type
ALTER TABLE public.email_sequence_queue
  ADD CONSTRAINT email_sequence_queue_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- Step 3: Make builder_id nullable
ALTER TABLE public.email_sequence_queue
  ALTER COLUMN builder_id DROP NOT NULL;

-- Re-add FK for builder_id (nullable now)
ALTER TABLE public.email_sequence_queue
  ADD CONSTRAINT email_sequence_queue_builder_id_fkey
  FOREIGN KEY (builder_id) REFERENCES auth.users(id) ON DELETE CASCADE;
