-- =============================================
-- ADDITIONAL MARKETING AUTOMATION WORKFLOWS
-- Workflows 6-9: Paid Ads, SEO Content, Influencer Outreach, WhatsApp
-- =============================================

-- =============================================
-- TABLE 1: AD CAMPAIGNS
-- Stores paid advertising campaigns across all platforms
-- =============================================
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Platform identification
  platform TEXT NOT NULL CHECK (platform IN (
    'google_search', 'google_display', 'facebook_instagram', 
    'linkedin', 'youtube', 'twitter', 'other'
  )),
  
  -- Campaign identifiers
  campaign_id TEXT NOT NULL, -- External platform campaign ID
  campaign_name TEXT NOT NULL,
  
  -- Budget information
  daily_budget NUMERIC NOT NULL,
  total_budget NUMERIC NOT NULL,
  spent_amount NUMERIC DEFAULT 0,
  
  -- Campaign configuration
  targeting JSONB DEFAULT '{}'::jsonb,
  creatives JSONB DEFAULT '{}'::jsonb,
  bid_strategy TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  
  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_click NUMERIC,
  cost_per_conversion NUMERIC,
  click_through_rate NUMERIC,
  conversion_rate NUMERIC,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  error_log TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_property ON public.ad_campaigns(property_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_builder ON public.ad_campaigns(builder_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform ON public.ad_campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_campaign_id ON public.ad_campaigns(campaign_id);

COMMENT ON TABLE public.ad_campaigns IS 'Paid advertising campaigns across Google, Meta, LinkedIn, YouTube, and other platforms';

-- =============================================
-- TABLE 2: SEO CONTENT
-- Stores SEO-optimized articles, guides, and comparison pages
-- =============================================
CREATE TABLE IF NOT EXISTS public.seo_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content classification
  content_type TEXT NOT NULL CHECK (content_type IN (
    'property_article', 'neighborhood_guide', 'comparison', 
    'blog_post', 'faq_page', 'location_guide'
  )),
  
  -- Content details
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  slug TEXT,
  
  -- CMS integration
  wordpress_post_id INTEGER,
  cms_platform TEXT DEFAULT 'wordpress' CHECK (cms_platform IN ('wordpress', 'ghost', 'custom')),
  
  -- SEO metadata
  focus_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  meta_description TEXT,
  meta_title TEXT,
  
  -- Content metrics
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER,
  
  -- Publishing status
  published_at TIMESTAMPTZ,
  indexed_by_google BOOLEAN DEFAULT false,
  indexed_by_bing BOOLEAN DEFAULT false,
  
  -- Performance metrics
  view_count INTEGER DEFAULT 0,
  engagement_score NUMERIC,
  backlinks_count INTEGER DEFAULT 0,
  domain_authority NUMERIC,
  
  -- Content data
  html_content TEXT,
  markdown_content TEXT,
  
  -- Internal linking
  internal_links JSONB DEFAULT '[]'::jsonb,
  external_links JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_content_property ON public.seo_content(property_id);
CREATE INDEX IF NOT EXISTS idx_seo_content_builder ON public.seo_content(builder_id);
CREATE INDEX IF NOT EXISTS idx_seo_content_type ON public.seo_content(content_type);
CREATE INDEX IF NOT EXISTS idx_seo_content_status ON public.seo_content(status);
CREATE INDEX IF NOT EXISTS idx_seo_content_url ON public.seo_content(url);
CREATE INDEX IF NOT EXISTS idx_seo_content_keywords ON public.seo_content USING GIN(focus_keywords);

COMMENT ON TABLE public.seo_content IS 'SEO-optimized content including property articles, neighborhood guides, and comparison pages';

-- =============================================
-- TABLE 3: INFLUENCER OUTREACH
-- Tracks influencer identification and outreach campaigns
-- =============================================
CREATE TABLE IF NOT EXISTS public.influencer_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Influencer information
  influencer_username TEXT NOT NULL,
  influencer_name TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube', 'facebook', 'twitter', 'linkedin', 'tiktok')),
  
  -- Influencer metrics
  followers_count INTEGER,
  engagement_rate NUMERIC,
  authenticity_score NUMERIC,
  outreach_score NUMERIC,
  
  -- Collaboration details
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  collaboration_type TEXT CHECK (collaboration_type IN ('sponsored_post', 'story', 'reel', 'video', 'blog', 'event')),
  
  -- Outreach message
  pitch_message TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'accepted', 'rejected', 'completed', 'cancelled')),
  
  -- Response tracking
  response_received_at TIMESTAMPTZ,
  response_message TEXT,
  
  -- Campaign results
  post_url TEXT,
  post_published_at TIMESTAMPTZ,
  reach INTEGER,
  impressions INTEGER,
  engagement_count INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_outreach_property ON public.influencer_outreach(property_id);
CREATE INDEX IF NOT EXISTS idx_influencer_outreach_builder ON public.influencer_outreach(builder_id);
CREATE INDEX IF NOT EXISTS idx_influencer_outreach_status ON public.influencer_outreach(status);
CREATE INDEX IF NOT EXISTS idx_influencer_outreach_platform ON public.influencer_outreach(platform);
CREATE INDEX IF NOT EXISTS idx_influencer_outreach_username ON public.influencer_outreach(influencer_username);

COMMENT ON TABLE public.influencer_outreach IS 'Influencer identification, outreach, and collaboration tracking';

-- =============================================
-- TABLE 4: PRESS RELEASES
-- Stores press releases and PR distribution tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Press release details
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Distribution
  distribution_service TEXT CHECK (distribution_service IN ('prnewswire', 'businesswire', 'prweb', 'custom')),
  distribution_id TEXT,
  
  -- Outreach tracking
  journalists_contacted INTEGER DEFAULT 0,
  journalists_responded INTEGER DEFAULT 0,
  media_pickups INTEGER DEFAULT 0,
  
  -- Reach metrics
  estimated_reach INTEGER,
  actual_reach INTEGER,
  impressions INTEGER,
  
  -- Publishing
  published_at TIMESTAMPTZ,
  published_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'published', 'archived')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_releases_property ON public.press_releases(property_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_builder ON public.press_releases(builder_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON public.press_releases(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_published_at ON public.press_releases(published_at);

COMMENT ON TABLE public.press_releases IS 'Press releases and PR distribution tracking';

-- =============================================
-- TABLE 5: WHATSAPP CAMPAIGNS
-- Tracks WhatsApp broadcast campaigns
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Campaign details
  campaign_name TEXT NOT NULL,
  campaign_type TEXT DEFAULT 'broadcast' CHECK (campaign_type IN ('broadcast', 'chatbot', 'drip_sequence')),
  
  -- Recipients
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  
  -- Segmentation
  segment_distribution JSONB DEFAULT '{}'::jsonb,
  
  -- Message template
  message_template TEXT,
  message_template_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled')),
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Performance
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_property ON public.whatsapp_campaigns(property_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_builder ON public.whatsapp_campaigns(builder_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON public.whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_scheduled ON public.whatsapp_campaigns(scheduled_for) WHERE status = 'scheduled';

COMMENT ON TABLE public.whatsapp_campaigns IS 'WhatsApp broadcast campaigns and chatbot deployments';

-- =============================================
-- TABLE 6: WHATSAPP MESSAGES
-- Individual WhatsApp message tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.whatsapp_campaigns(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Recipient information
  phone TEXT NOT NULL,
  name TEXT,
  
  -- Message details
  message_content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'document', 'template')),
  
  -- Platform identifiers
  message_sid TEXT, -- Twilio message SID
  whatsapp_message_id TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'failed', 'undelivered')),
  
  -- Segmentation
  segment TEXT,
  
  -- Delivery tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  
  -- Response tracking (for chatbot)
  is_bot_response BOOLEAN DEFAULT false,
  conversation_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_campaign ON public.whatsapp_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_property ON public.whatsapp_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead ON public.whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sid ON public.whatsapp_messages(message_sid);

COMMENT ON TABLE public.whatsapp_messages IS 'Individual WhatsApp messages sent as part of campaigns or chatbot conversations';

-- =============================================
-- EXTEND PROPERTIES TABLE
-- Add tracking columns for new workflows
-- =============================================
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS paid_ads_live BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS paid_ads_launched_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_ad_budget_allocated NUMERIC DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seo_content_published BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seo_articles_count INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS main_article_url TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS influencer_outreach_completed BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS press_release_distributed BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pr_campaign_launched_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS whatsapp_broadcast_sent BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS whatsapp_chatbot_active BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS whatsapp_campaign_launched_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Builders can view their own data
CREATE POLICY "Builders view own ad campaigns" ON public.ad_campaigns
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own seo content" ON public.seo_content
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own influencer outreach" ON public.influencer_outreach
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own press releases" ON public.press_releases
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own whatsapp campaigns" ON public.whatsapp_campaigns
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders view own whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_campaigns wc 
      WHERE wc.id = whatsapp_messages.campaign_id 
      AND wc.builder_id = auth.uid()
    )
  );

-- Service role can do everything (for n8n workflows)
CREATE POLICY "Service role full access ad campaigns" ON public.ad_campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access seo content" ON public.seo_content
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access influencer outreach" ON public.influencer_outreach
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access press releases" ON public.press_releases
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access whatsapp campaigns" ON public.whatsapp_campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access whatsapp messages" ON public.whatsapp_messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_properties_paid_ads ON public.properties(paid_ads_live, paid_ads_launched_at);
CREATE INDEX IF NOT EXISTS idx_properties_seo_content ON public.properties(seo_content_published, seo_articles_count);
CREATE INDEX IF NOT EXISTS idx_properties_influencer_pr ON public.properties(influencer_outreach_completed, press_release_distributed);
CREATE INDEX IF NOT EXISTS idx_properties_whatsapp ON public.properties(whatsapp_broadcast_sent, whatsapp_chatbot_active);

