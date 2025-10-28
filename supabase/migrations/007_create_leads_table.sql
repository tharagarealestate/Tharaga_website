-- Create leads table for capturing potential customer inquiries
-- This table stores all lead information from property inquiries

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Foreign keys
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  builder_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contact information
  name text NOT NULL,
  email text,
  phone text,
  message text,
  
  -- Lead scoring and tracking
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  score numeric NOT NULL DEFAULT 5.0 CHECK (score >= 0 AND score <= 10),
  source text,
  budget numeric,
  
  -- Ensure at least one contact method is provided
  CONSTRAINT leads_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_builder_id ON public.leads(builder_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_leads_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_leads_updated_at ON public.leads;
CREATE TRIGGER on_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_leads_updated_at();

-- Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Builders can view their own leads
CREATE POLICY "Builders can view their own leads" 
  ON public.leads 
  FOR SELECT 
  USING (auth.uid() = builder_id);

-- Admins can view all leads
CREATE POLICY "Admins can view all leads" 
  ON public.leads 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Service role can insert leads (public forms)
CREATE POLICY "Service role can insert leads" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (true);

-- Builders can update their own leads
CREATE POLICY "Builders can update their own leads" 
  ON public.leads 
  FOR UPDATE 
  USING (auth.uid() = builder_id);

-- Admins can update all leads
CREATE POLICY "Admins can update all leads" 
  ON public.leads 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON TABLE public.leads IS 'Stores lead information from property inquiries';
COMMENT ON COLUMN public.leads.builder_id IS 'References the builder (auth user) who receives this lead';
COMMENT ON COLUMN public.leads.property_id IS 'References the property this lead is interested in';
COMMENT ON COLUMN public.leads.score IS 'Lead quality score from 0-10, where 10 is highest quality';
COMMENT ON COLUMN public.leads.status IS 'Current status of the lead in the sales pipeline';

