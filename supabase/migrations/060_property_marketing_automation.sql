-- =============================================
-- PROPERTY MARKETING AUTOMATION SYSTEM
-- Comprehensive tables and functions for real-time marketing automation
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE 1: PROPERTY MARKETING STRATEGIES
-- Stores AI-generated marketing strategies for each property
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_marketing_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Target audience analysis
  target_audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Unique selling propositions
  usps JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Messaging strategy
  messaging_strategy JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Channel priorities
  channel_priorities JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Content themes
  content_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Campaign hooks
  campaign_hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Budget allocation
  budget_allocation JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- KPI targets
  kpi_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Competitive advantages
  competitive_advantages JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Risk factors
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Market intelligence data
  market_intelligence JSONB DEFAULT '{}'::jsonb,
  
  -- Pricing position analysis
  pricing_position TEXT CHECK (pricing_position IN ('underpriced', 'competitive', 'premium')),
  
  -- Competitor analysis
  competitor_count INTEGER DEFAULT 0,
  avg_competitor_price NUMERIC,
  
  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT true,
  ai_model_used TEXT DEFAULT 'claude-sonnet-4',
  generation_prompt TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_marketing_strategies_property ON public.property_marketing_strategies(property_id);
CREATE INDEX IF NOT EXISTS idx_property_marketing_strategies_builder ON public.property_marketing_strategies(builder_id);
CREATE INDEX IF NOT EXISTS idx_property_marketing_strategies_status ON public.property_marketing_strategies(status);

COMMENT ON TABLE public.property_marketing_strategies IS 'AI-generated marketing strategies for properties';

-- =============================================
-- TABLE 2: PROPERTY CONTENT LIBRARY
-- Stores all generated content variants (50+ variants per property)
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content classification
  content_type TEXT NOT NULL CHECK (content_type IN (
    'master_set', 'localized', 'ab_test', 'description', 'headline', 
    'ad_copy', 'social_post', 'email_template', 'seo_content', 
    'whatsapp_message', 'sms_template', 'video_script', 'press_release'
  )),
  
  -- Language support
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'ta', 'kn', 'te', 'ml', 'mr')),
  
  -- Variant identification
  variant_name TEXT,
  
  -- Content data (stores all content variants)
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Generation metadata
  generated_by TEXT DEFAULT 'claude_ai',
  ai_model_used TEXT DEFAULT 'claude-sonnet-4',
  generation_params JSONB DEFAULT '{}'::jsonb,
  
  -- Quality metrics
  quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 100),
  engagement_score NUMERIC,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_content_library_property ON public.property_content_library(property_id);
CREATE INDEX IF NOT EXISTS idx_property_content_library_type ON public.property_content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_property_content_library_language ON public.property_content_library(language);
CREATE INDEX IF NOT EXISTS idx_property_content_library_active ON public.property_content_library(is_active) WHERE is_active = true;

COMMENT ON TABLE public.property_content_library IS 'Comprehensive content library with 50+ variants per property';

-- =============================================
-- TABLE 3: PROPERTY MEDIA ASSETS
-- Stores all processed visual assets (images, videos, graphics, floor plans)
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Asset classification
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'image_full', 'image_thumbnail', 'image_instagram_feed', 'image_instagram_story',
    'image_facebook_og', 'image_google_display', 'image_webp',
    'graphic_price_overlay', 'graphic_instagram_story', 'graphic_promotional',
    'video_walkthrough', 'video_teaser', 'video_overview',
    'floor_plan_svg', 'floor_plan_png', 'floor_plan_pdf',
    'virtual_staging', 'ai_generated_image'
  )),
  
  -- Asset URL
  asset_url TEXT NOT NULL,
  
  -- Storage information
  storage_bucket TEXT DEFAULT 'property-images',
  storage_path TEXT,
  
  -- Asset metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Processing information
  original_url TEXT,
  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_time_ms INTEGER,
  processing_error TEXT,
  
  -- Image-specific metadata
  width INTEGER,
  height INTEGER,
  file_size_bytes BIGINT,
  mime_type TEXT,
  format TEXT,
  
  -- Quality metrics
  quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 100),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_assets_property ON public.property_media_assets(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_assets_type ON public.property_media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_property_media_assets_status ON public.property_media_assets(processing_status);
CREATE INDEX IF NOT EXISTS idx_property_media_assets_active ON public.property_media_assets(is_active) WHERE is_active = true;

COMMENT ON TABLE public.property_media_assets IS 'All processed visual assets for properties including optimized images, videos, graphics, and floor plans';

-- =============================================
-- TABLE 4: PROPERTY LANDING PAGES
-- Stores landing page deployment information
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Landing page URLs
  url TEXT NOT NULL,
  custom_domain TEXT,
  
  -- Deployment information
  deployment_id TEXT,
  deployment_platform TEXT DEFAULT 'vercel' CHECK (deployment_platform IN ('vercel', 'netlify', 'custom')),
  
  -- HTML content (stored for versioning)
  html_content TEXT,
  
  -- SEO metadata
  meta_title TEXT,
  meta_description TEXT,
  focus_keywords TEXT[],
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC,
  
  -- SSL and domain
  ssl_enabled BOOLEAN DEFAULT true,
  domain_verified BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'live' CHECK (status IN ('draft', 'deploying', 'live', 'archived', 'failed')),
  
  -- Deployment metadata
  deployment_metadata JSONB DEFAULT '{}'::jsonb,
  deployment_error TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deployed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_property_landing_pages_property ON public.property_landing_pages(property_id);
CREATE INDEX IF NOT EXISTS idx_property_landing_pages_builder ON public.property_landing_pages(builder_id);
CREATE INDEX IF NOT EXISTS idx_property_landing_pages_status ON public.property_landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_property_landing_pages_custom_domain ON public.property_landing_pages(custom_domain) WHERE custom_domain IS NOT NULL;

COMMENT ON TABLE public.property_landing_pages IS 'SEO-optimized landing pages for properties with custom domains and SSL';

-- =============================================
-- TABLE 5: SOCIAL MONITORING TASKS
-- Schedules and tracks social media engagement monitoring
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_monitoring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Platforms to monitor
  platforms TEXT[] NOT NULL DEFAULT ARRAY['instagram', 'facebook', 'linkedin', 'twitter']::TEXT[],
  
  -- Monitoring configuration
  check_frequency_minutes INTEGER DEFAULT 30,
  metrics_to_track TEXT[] DEFAULT ARRAY['likes', 'comments', 'shares', 'reach', 'impressions']::TEXT[],
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  
  -- Last check information
  last_checked_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  
  -- Monitoring results
  last_metrics JSONB DEFAULT '{}'::jsonb,
  metrics_history JSONB DEFAULT '[]'::jsonb,
  
  -- Error tracking
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_monitoring_tasks_property ON public.social_monitoring_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_social_monitoring_tasks_next_check ON public.social_monitoring_tasks(next_check_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_social_monitoring_tasks_status ON public.social_monitoring_tasks(status);

COMMENT ON TABLE public.social_monitoring_tasks IS 'Schedules and tracks social media engagement monitoring for property posts';

-- =============================================
-- EXTEND PROPERTIES TABLE
-- Add marketing automation tracking columns
-- =============================================
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS marketing_automation_enabled BOOLEAN DEFAULT true;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS marketing_content_generated BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS marketing_content_generated_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS content_variant_count INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS media_assets_processed BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS media_assets_count INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS landing_page_live BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS landing_page_created_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS marketing_strategy_generated BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS marketing_strategy_generated_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

-- =============================================
-- EXTEND BUILDER_SUBSCRIPTIONS TABLE
-- Add marketing budget fields
-- =============================================
DO $$ BEGIN
  ALTER TABLE public.builder_subscriptions ADD COLUMN IF NOT EXISTS marketing_budget_monthly NUMERIC DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builder_subscriptions ADD COLUMN IF NOT EXISTS ad_spend_limit_per_property NUMERIC DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.builder_subscriptions ADD COLUMN IF NOT EXISTS tier TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

-- =============================================
-- TRIGGER FUNCTION: Property Insert Marketing Automation
-- Triggers marketing automation when a new property is inserted with status='active'
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_property_marketing_automation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_webhook_url TEXT;
  v_payload JSONB;
BEGIN
  -- Only trigger for active properties with marketing automation enabled
  IF NEW.status = 'active' AND (NEW.marketing_automation_enabled IS NULL OR NEW.marketing_automation_enabled = true) THEN
    
    -- Build webhook payload
    v_payload := jsonb_build_object(
      'event', 'property_inserted',
      'record', jsonb_build_object(
        'id', NEW.id,
        'builder_id', NEW.builder_id,
        'title', NEW.title,
        'description', NEW.description,
        'price', COALESCE(NEW.price, NEW.price_inr),
        'location', NEW.location,
        'address', NEW.address,
        'bhk_type', NEW.bhk_type,
        'property_type', NEW.property_type,
        'carpet_area', NEW.carpet_area,
        'amenities', NEW.amenities,
        'images', NEW.images,
        'latitude', NEW.latitude,
        'longitude', NEW.longitude,
        'rera_id', NEW.rera_id,
        'possession_date', NEW.possession_date,
        'created_at', NEW.created_at
      ),
      'timestamp', NOW()
    );
    
    -- Fire webhook to n8n (this will be handled by Supabase webhooks or pg_net)
    -- For now, we'll insert into a queue table that n8n can poll
    INSERT INTO public.webhook_logs (
      source,
      event_type,
      event_id,
      body,
      status,
      metadata
    ) VALUES (
      'supabase',
      'property.insert',
      NEW.id::TEXT,
      v_payload,
      'pending',
      jsonb_build_object('property_id', NEW.id, 'builder_id', NEW.builder_id)
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS property_marketing_automation_trigger ON public.properties;
CREATE TRIGGER property_marketing_automation_trigger
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_property_marketing_automation();

-- =============================================
-- HELPER FUNCTION: Get Property with Full Context
-- Used by n8n workflows to fetch complete property data
-- =============================================
CREATE OR REPLACE FUNCTION public.get_property_marketing_context(p_property_id UUID)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH property_data AS (
    SELECT 
      p.*,
      b.name as builder_name,
      b.company_name,
      b.logo_url,
      b.reputation_score,
      b.total_projects,
      bs.tier as subscription_tier,
      bs.marketing_budget_monthly,
      bs.ad_spend_limit_per_property
    FROM public.properties p
    LEFT JOIN public.builders b ON p.builder_id = b.id
    LEFT JOIN public.builder_subscriptions bs ON p.builder_id = bs.builder_id
    WHERE p.id = p_property_id
  ),
  nearby_properties AS (
    SELECT 
      COUNT(*) as competitors_count,
      AVG(COALESCE(price, price_inr)) as avg_competitor_price,
      MIN(COALESCE(price, price_inr)) as min_competitor_price,
      MAX(COALESCE(price, price_inr)) as max_competitor_price,
      json_agg(json_build_object(
        'id', id,
        'title', title,
        'price', COALESCE(price, price_inr),
        'bhk_type', bhk_type
      )) as competitor_listings
    FROM public.properties
    WHERE ST_DWithin(
      COALESCE(geom::geography, ST_SetSRID(ST_MakePoint(COALESCE(longitude, lng), COALESCE(latitude, lat)), 4326)::geography),
      (SELECT COALESCE(geom::geography, ST_SetSRID(ST_MakePoint(COALESCE(longitude, lng), COALESCE(latitude, lat)), 4326)::geography) 
       FROM property_data),
      2000
    )
    AND status = 'active'
    AND id != p_property_id
  ),
  market_trends AS (
    SELECT 
      trend_direction,
      price_change_percent,
      demand_score,
      trend_strength
    FROM public.market_intelligence
    WHERE city = (SELECT city FROM property_data)
      AND property_type = (SELECT property_type FROM property_data)
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'property', (SELECT row_to_json(pd.*) FROM property_data pd),
    'competitors', (SELECT row_to_json(np.*) FROM nearby_properties np),
    'market_trends', (SELECT row_to_json(mt.*) FROM market_trends mt),
    'pricing_position', CASE 
      WHEN (SELECT price FROM property_data) < (SELECT avg_competitor_price FROM nearby_properties) * 0.9 THEN 'underpriced'
      WHEN (SELECT price FROM property_data) > (SELECT avg_competitor_price FROM nearby_properties) * 1.1 THEN 'premium'
      ELSE 'competitive'
    END
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_property_marketing_context IS 'Returns complete property context for marketing automation including competitors and market trends';

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_properties_marketing_automation ON public.properties(status, marketing_automation_enabled) 
  WHERE status = 'active' AND (marketing_automation_enabled IS NULL OR marketing_automation_enabled = true);

CREATE INDEX IF NOT EXISTS idx_properties_marketing_status ON public.properties(marketing_content_generated, media_assets_processed, landing_page_live);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================
ALTER TABLE public.property_marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_monitoring_tasks ENABLE ROW LEVEL SECURITY;

-- Builders can view their own marketing data
CREATE POLICY "Builders view own marketing strategies" ON public.property_marketing_strategies
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own content library" ON public.property_content_library
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own media assets" ON public.property_media_assets
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own landing pages" ON public.property_landing_pages
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own monitoring tasks" ON public.social_monitoring_tasks
  FOR SELECT USING (auth.uid() = builder_id);

-- Service role can do everything (for n8n workflows)
CREATE POLICY "Service role full access marketing strategies" ON public.property_marketing_strategies
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access content library" ON public.property_content_library
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access media assets" ON public.property_media_assets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access landing pages" ON public.property_landing_pages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access monitoring tasks" ON public.social_monitoring_tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

































































