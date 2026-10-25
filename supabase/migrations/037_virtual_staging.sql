-- =============================================
-- AI VIRTUAL STAGING ENGINE
-- Transform empty rooms into furnished showrooms with free AI
-- =============================================

-- =============================================
-- 1. VIRTUAL_STAGING_JOBS TABLE
-- Store staging requests and results
-- =============================================
CREATE TABLE IF NOT EXISTS public.virtual_staging_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL,
  staged_image_url TEXT,
  staging_style TEXT NOT NULL CHECK (staging_style IN ('modern', 'luxury', 'minimalist', 'traditional', 'scandinavian')),
  room_type TEXT NOT NULL CHECK (room_type IN ('living_room', 'bedroom', 'kitchen', 'bathroom', 'dining_room')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_time_ms INTEGER,
  ai_model_used TEXT DEFAULT 'stable-diffusion-2-inpainting',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staging_jobs_property ON public.virtual_staging_jobs(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staging_jobs_status ON public.virtual_staging_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staging_jobs_user ON public.virtual_staging_jobs(created_by, status);

-- =============================================
-- 2. STAGING_ANALYTICS TABLE
-- Track staging analytics
-- =============================================
CREATE TABLE IF NOT EXISTS public.staging_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  staging_job_id UUID REFERENCES public.virtual_staging_jobs(id) ON DELETE CASCADE,
  before_views INTEGER DEFAULT 0,
  after_views INTEGER DEFAULT 0,
  before_avg_time_spent DECIMAL(10,2) DEFAULT 0,
  after_avg_time_spent DECIMAL(10,2) DEFAULT 0,
  lead_increase_pct DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_analytics_property ON public.staging_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_staging_analytics_job ON public.staging_analytics(staging_job_id);

-- Updated_at trigger for staging_analytics
CREATE OR REPLACE FUNCTION public.handle_staging_analytics_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_staging_analytics_updated_at ON public.staging_analytics;
CREATE TRIGGER on_staging_analytics_updated_at
  BEFORE UPDATE ON public.staging_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_staging_analytics_updated_at();

-- =============================================
-- 3. STAGING_PROGRESS TABLE
-- Real-time subscription for staging progress
-- =============================================
CREATE TABLE IF NOT EXISTS public.staging_progress (
  job_id UUID PRIMARY KEY REFERENCES public.virtual_staging_jobs(id) ON DELETE CASCADE,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  current_step TEXT, -- 'uploading', 'analyzing', 'generating', 'enhancing', 'finalizing'
  estimated_time_remaining_sec INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_progress_job ON public.staging_progress(job_id);
CREATE INDEX IF NOT EXISTS idx_staging_progress_status ON public.staging_progress(current_step);

-- =============================================
-- 4. PROPERTY_MEDIA TABLE (if not exists)
-- Store property images and media
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'floor_plan', 'virtual_tour')),
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_staged BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_property_media_property ON public.property_media(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_media_type ON public.property_media(media_type);
CREATE INDEX IF NOT EXISTS idx_property_media_staged ON public.property_media(is_staged) WHERE is_staged = true;

-- =============================================
-- 5. FUNCTION TO AUTO-UPDATE PROPERTY WITH STAGED IMAGE
-- =============================================
CREATE OR REPLACE FUNCTION public.update_property_with_staged_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.staged_image_url IS NOT NULL THEN
    -- Add staged image to property_media table
    INSERT INTO public.property_media (
      property_id,
      media_type,
      url,
      is_primary,
      is_staged,
      metadata,
      created_by
    ) VALUES (
      NEW.property_id,
      'image',
      NEW.staged_image_url,
      false,
      true,
      jsonb_build_object(
        'is_staged', true,
        'staging_job_id', NEW.id,
        'original_image', NEW.original_image_url,
        'style', NEW.staging_style,
        'room_type', NEW.room_type,
        'ai_model', NEW.ai_model_used
      ),
      NEW.created_by
    ) ON CONFLICT DO NOTHING;
    
    -- Update property metadata
    UPDATE public.properties
    SET metadata = COALESCE(metadata, '{}'::JSONB) || 
      jsonb_build_object(
        'has_virtual_staging', true,
        'last_staged_at', NOW(),
        'staging_count', COALESCE((metadata->>'staging_count')::INTEGER, 0) + 1
      )
    WHERE id = NEW.property_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_property_staged_image ON public.virtual_staging_jobs;
CREATE TRIGGER trigger_update_property_staged_image
AFTER UPDATE OF status ON public.virtual_staging_jobs
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION public.update_property_with_staged_image();

-- =============================================
-- 6. ROW LEVEL SECURITY
-- =============================================

-- Virtual Staging Jobs: Users can view their own jobs, builders can view jobs for their properties
ALTER TABLE public.virtual_staging_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own staging jobs" ON public.virtual_staging_jobs;
DROP POLICY IF EXISTS "Builders can view staging jobs for their properties" ON public.virtual_staging_jobs;
DROP POLICY IF EXISTS "Users can create staging jobs" ON public.virtual_staging_jobs;
DROP POLICY IF EXISTS "Users can update their own staging jobs" ON public.virtual_staging_jobs;

CREATE POLICY "Users can view their own staging jobs" ON public.virtual_staging_jobs
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Builders can view staging jobs for their properties" ON public.virtual_staging_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = virtual_staging_jobs.property_id
      AND properties.builder_id = auth.uid()
    )
  );

CREATE POLICY "Users can create staging jobs" ON public.virtual_staging_jobs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own staging jobs" ON public.virtual_staging_jobs
  FOR UPDATE USING (auth.uid() = created_by);

-- Staging Progress: Same access as jobs
ALTER TABLE public.staging_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view progress for their staging jobs" ON public.staging_progress;

CREATE POLICY "Users can view progress for their staging jobs" ON public.staging_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.virtual_staging_jobs
      WHERE virtual_staging_jobs.id = staging_progress.job_id
      AND virtual_staging_jobs.created_by = auth.uid()
    )
  );

-- Staging Analytics: Builders can view analytics for their properties
ALTER TABLE public.staging_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view staging analytics for their properties" ON public.staging_analytics;

CREATE POLICY "Builders can view staging analytics for their properties" ON public.staging_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = staging_analytics.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Property Media: Users can manage media for their properties
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view property media" ON public.property_media;
DROP POLICY IF EXISTS "Builders can manage media for their properties" ON public.property_media;

CREATE POLICY "Users can view property media" ON public.property_media
  FOR SELECT USING (true); -- Public read for property images

CREATE POLICY "Builders can manage media for their properties" ON public.property_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_media.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- =============================================
-- 7. ENABLE REALTIME (Note: This requires Supabase Dashboard configuration)
-- =============================================
-- Realtime is enabled via Supabase Dashboard, but we can add comments
COMMENT ON TABLE public.staging_progress IS 'Real-time progress tracking for staging jobs. Enable via Supabase Dashboard: Realtime > Tables > staging_progress';
COMMENT ON TABLE public.virtual_staging_jobs IS 'Staging job status. Enable via Supabase Dashboard: Realtime > Tables > virtual_staging_jobs';

-- =============================================
-- 8. COMMENTS
-- =============================================
COMMENT ON TABLE public.virtual_staging_jobs IS 'AI-powered virtual staging jobs for transforming empty rooms into furnished showrooms';
COMMENT ON TABLE public.staging_analytics IS 'Analytics tracking for staging performance (views, engagement, leads)';
COMMENT ON TABLE public.staging_progress IS 'Real-time progress tracking for staging jobs';
COMMENT ON TABLE public.property_media IS 'Property images and media including staged images';
COMMENT ON FUNCTION public.update_property_with_staged_image IS 'Automatically adds completed staged images to property media';

