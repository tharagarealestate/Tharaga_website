-- Fix interactions table by adding missing columns

-- Add interaction_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'interactions'
    AND column_name = 'interaction_type'
  ) THEN
    ALTER TABLE public.interactions
    ADD COLUMN interaction_type text NOT NULL DEFAULT 'view'
    CHECK (interaction_type IN ('view', 'click', 'share', 'favorite', 'contact', 'tour_request'));
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'interactions'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.interactions
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index on interaction_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interactions(interaction_type);
