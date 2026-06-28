-- =============================================
-- AI CONTENT AUTO-GENERATION SYSTEM
-- AI generated content storage and templates
-- =============================================

-- AI generated content storage
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'description', 'highlights', 'email_subject', 'whatsapp', 'social', 'faq'
  content_text TEXT NOT NULL,
  content_json JSONB, -- Structured content
  model_used TEXT NOT NULL, -- 'gpt-4', 'gpt-3.5-turbo', 'llama-3-70b'
  prompt_used TEXT,
  generation_params JSONB,
  tone TEXT, -- 'professional', 'casual', 'luxury', 'friendly'
  language TEXT DEFAULT 'en',
  quality_score DECIMAL(5,2), -- 0-100 quality rating
  engagement_metrics JSONB DEFAULT '{}'::JSONB, -- clicks, views, conversions
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  variant_group TEXT, -- For A/B testing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_content_property ON public.ai_generated_content(property_id, content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON public.ai_generated_content(content_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_content_variant ON public.ai_generated_content(variant_group, quality_score DESC);

-- Content templates (reusable prompts)
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'description', 'email', 'social', etc
  prompt_template TEXT NOT NULL,
  variables JSONB, -- {property_type, budget, location, ...}
  tone TEXT DEFAULT 'professional',
  language TEXT DEFAULT 'en',
  model_preference TEXT DEFAULT 'gpt-4',
  usage_count INTEGER DEFAULT 0,
  avg_quality_score DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON public.content_templates(template_type, is_active);

-- Content generation queue (async processing)
CREATE TABLE IF NOT EXISTS public.content_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  content_types TEXT[], -- ['description', 'highlights', 'email']
  priority INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result_ids UUID[], -- IDs of generated content
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_queue_status ON public.content_generation_queue(status, priority DESC, scheduled_at);

-- RLS Policies
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_queue ENABLE ROW LEVEL SECURITY;

-- Users can view AI content for properties they own or have access to
DROP POLICY IF EXISTS "Users can view AI content" ON public.ai_generated_content;
CREATE POLICY "Users can view AI content" ON public.ai_generated_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND (builder_id = auth.uid() OR access_level = 'public')
  )
);

-- Builders can insert AI content for their properties
DROP POLICY IF EXISTS "Builders can insert AI content" ON public.ai_generated_content;
CREATE POLICY "Builders can insert AI content" ON public.ai_generated_content
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Users can view templates
DROP POLICY IF EXISTS "Users can view templates" ON public.content_templates;
CREATE POLICY "Users can view templates" ON public.content_templates
FOR SELECT
USING (is_active = true OR created_by = auth.uid());

-- Users can create templates
DROP POLICY IF EXISTS "Users can create templates" ON public.content_templates;
CREATE POLICY "Users can create templates" ON public.content_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Queue policies (builders can manage their queue)
DROP POLICY IF EXISTS "Builders can view their queue" ON public.content_generation_queue;
CREATE POLICY "Builders can view their queue" ON public.content_generation_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Grant service role full access
GRANT ALL ON public.ai_generated_content TO service_role;
GRANT ALL ON public.content_templates TO service_role;
GRANT ALL ON public.content_generation_queue TO service_role;

COMMENT ON TABLE public.ai_generated_content IS 'AI generated property content';
COMMENT ON TABLE public.content_templates IS 'Reusable content generation templates';
COMMENT ON TABLE public.content_generation_queue IS 'Async content generation queue';

