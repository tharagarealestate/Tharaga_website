-- Add builder_id column to leads table for trial attribution
-- This allows us to track which builder receives which leads

-- Add builder_id column if it doesn't exist
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS builder_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries when filtering leads by builder
CREATE INDEX IF NOT EXISTS idx_leads_builder_id ON public.leads(builder_id);

-- Add comment for documentation
COMMENT ON COLUMN public.leads.builder_id IS 'References the builder (auth user) who receives this lead during their trial';
