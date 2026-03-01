-- =============================================
-- AI MESSAGE GENERATIONS TABLE
-- Stores AI-generated message variants for analytics
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_message_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  variants JSONB NOT NULL DEFAULT '[]'::JSONB,
  recommended_variant TEXT,
  generation_metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_message_generations_lead ON public.ai_message_generations(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_generations_type ON public.ai_message_generations(message_type);
CREATE INDEX IF NOT EXISTS idx_ai_message_generations_created ON public.ai_message_generations(created_at DESC);

-- RLS Policies
ALTER TABLE public.ai_message_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View builder message generations" ON public.ai_message_generations;
CREATE POLICY "View builder message generations"
ON public.ai_message_generations
FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads
    WHERE builder_id = auth.uid()
  )
);

-- Grant service role full access
GRANT ALL ON public.ai_message_generations TO service_role;

COMMENT ON TABLE public.ai_message_generations IS 'Stores AI-generated message variants for analytics and A/B testing';

