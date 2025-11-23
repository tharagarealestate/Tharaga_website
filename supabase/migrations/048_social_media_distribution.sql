-- File: /supabase/migrations/048_social_media_distribution.sql
-- ==============================================
-- SOCIAL MEDIA AUTO-DISTRIBUTION ENGINE
-- ==============================================

-- ==============================================
-- SOCIAL MEDIA ACCOUNTS (Builder's Connected Accounts)
-- ==============================================
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Platform Details
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'linkedin', 'twitter', 'youtube'
  platform_account_id TEXT NOT NULL, -- External platform user/page ID
  platform_account_name TEXT,
  
  -- Authentication
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Account Type
  account_type TEXT, -- 'page', 'profile', 'business', 'group'
  
  -- Posting Permissions
  can_post BOOLEAN DEFAULT true,
  can_post_images BOOLEAN DEFAULT true,
  can_post_videos BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_successful_post TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'active', -- 'active', 'token_expired', 'disconnected', 'error'
  error_message TEXT,
  
  -- Settings
  auto_post_enabled BOOLEAN DEFAULT true,
  post_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'scheduled', 'batch'
  optimal_posting_times JSONB, -- [{day: 'monday', hour: 18}, ...]
  
  -- Metadata
  platform_metadata JSONB DEFAULT '{}'::JSONB,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_builder ON social_media_accounts(builder_id, is_active);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_media_accounts(platform, connection_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_unique ON social_media_accounts(builder_id, platform, platform_account_id);

-- ==============================================
-- SOCIAL MEDIA POSTS (Distribution Log)
-- ==============================================
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  
  -- Post Details
  platform TEXT NOT NULL,
  platform_post_id TEXT, -- External post ID from platform
  post_url TEXT, -- Public URL to view post
  
  -- Content
  post_content TEXT NOT NULL,
  post_caption TEXT,
  media_urls TEXT[], -- Images/videos attached
  hashtags TEXT[],
  
  -- Posting Strategy
  post_type TEXT DEFAULT 'new_listing', -- 'new_listing', 'price_drop', 'open_house', 'featured', 'repost'
  audience_targeting JSONB, -- Platform-specific targeting
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'queued', 'posted', 'failed', 'deleted'
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Engagement Metrics (Updated via webhooks/polling)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Performance
  lead_conversions INTEGER DEFAULT 0,
  site_visit_requests INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_social_posts_property ON social_media_posts(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_account ON social_media_posts(social_account_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_posts_performance ON social_media_posts(engagement_rate DESC, posted_at DESC);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE social_media_posts;

-- ==============================================
-- SOCIAL MEDIA TEMPLATES
-- ==============================================
CREATE TABLE IF NOT EXISTS social_media_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Template Details
  template_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL,
  
  -- Content Template
  content_template TEXT NOT NULL, -- With variables: {property_title}, {price}, {location}
  caption_template TEXT,
  hashtag_template TEXT[], -- Default hashtags
  
  -- Media Configuration
  image_layout TEXT DEFAULT 'carousel', -- 'single', 'carousel', 'collage'
  video_enabled BOOLEAN DEFAULT false,
  max_images INTEGER DEFAULT 10,
  
  -- AI Enhancement
  use_ai_content BOOLEAN DEFAULT true,
  tone TEXT DEFAULT 'professional', -- 'professional', 'friendly', 'luxury', 'urgent'
  
  -- Performance
  usage_count INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_templates_builder ON social_media_templates(builder_id, platform);

-- Insert default templates
INSERT INTO social_media_templates (builder_id, template_name, platform, post_type, content_template, hashtag_template, is_default) VALUES
(NULL, 'Default Facebook Listing', 'facebook', 'new_listing', '🏠 {property_title}

📍 Location: {location}
💰 Price: {price}
🛏️ {bedrooms}BHK | {area} sq.ft

{description}

✅ Zero Commission
✅ Direct from Builder
✅ Verified Listing

View details: https://tharaga.co.in/properties/{property_id}', 
ARRAY['#RealEstate', '#Property', '#Chennai', '#ZeroCommission', '#NewListing'], true),
(NULL, 'Default Instagram Listing', 'instagram', 'new_listing', '🏠 {property_title} ✨

📍 {location}
💰 {price}
🛏️ {bedrooms}BHK | {area} sq.ft

{description}

✅ Zero Commission
✅ Direct from Builder

Link in bio 👆', 
ARRAY['#RealEstate', '#Property', '#Chennai', '#ZeroCommission', '#NewListing', '#Home'], true),
(NULL, 'Default LinkedIn Listing', 'linkedin', 'new_listing', 'New Property Listing: {property_title}

📍 Location: {location}
💰 Price: {price}
🛏️ {bedrooms}BHK | {area} sq.ft

{description}

Key Features:
✅ Zero Commission
✅ Direct from Builder
✅ Verified Listing

Learn more: https://tharaga.co.in/properties/{property_id}', 
ARRAY['#RealEstate', '#Property', '#Chennai', '#ZeroCommission'], true),
(NULL, 'Default Twitter Listing', 'twitter', 'new_listing', '🏠 {property_title} in {location}

💰 {price} | {bedrooms}BHK | {area} sq.ft

✅ Zero Commission
✅ Direct from Builder

View: https://tharaga.co.in/properties/{property_id}', 
ARRAY['#RealEstate', '#Property', '#Chennai'], true)
ON CONFLICT DO NOTHING;

-- ==============================================
-- SOCIAL MEDIA CAMPAIGNS
-- ==============================================
CREATE TABLE IF NOT EXISTS social_media_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  builder_id UUID REFERENCES profiles(id),
  
  -- Campaign Details
  campaign_name TEXT NOT NULL,
  campaign_type TEXT DEFAULT 'listing_launch', -- 'listing_launch', 'price_drop_alert', 'open_house', 'featured_property'
  
  -- Target Platforms
  target_platforms TEXT[], -- ['facebook', 'instagram', 'linkedin']
  
  -- Campaign Strategy
  post_schedule JSONB, -- [{platform: 'facebook', scheduled_for: '...', template_id: '...'}]
  duration_days INTEGER DEFAULT 7,
  repost_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  
  -- Performance
  total_posts INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_property ON social_media_campaigns(property_id, status);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_builder ON social_media_campaigns(builder_id, status);

-- ==============================================
-- REAL-TIME FUNCTIONS
-- ==============================================
-- Function to auto-create social media posts when property is listed
CREATE OR REPLACE FUNCTION trigger_social_media_distribution()
RETURNS TRIGGER AS $$
DECLARE
  v_builder_accounts RECORD;
  v_template RECORD;
BEGIN
  -- Only trigger for active, verified properties
  IF NEW.status = 'active' AND (NEW.is_verified = true OR NEW.is_verified IS NULL) THEN
    
    -- Get builder's connected social accounts
    FOR v_builder_accounts IN 
      SELECT * FROM social_media_accounts
      WHERE builder_id = NEW.builder_id
      AND is_active = true
      AND auto_post_enabled = true
      AND connection_status = 'active'
    LOOP
      
      -- Get default template for this platform
      SELECT * INTO v_template
      FROM social_media_templates
      WHERE builder_id = NEW.builder_id
      AND platform = v_builder_accounts.platform
      AND post_type = 'new_listing'
      AND is_active = true
      ORDER BY is_default DESC, avg_engagement_rate DESC
      LIMIT 1;
      
      -- If no custom template, use system default
      IF NOT FOUND THEN
        SELECT * INTO v_template
        FROM social_media_templates
        WHERE builder_id IS NULL
        AND platform = v_builder_accounts.platform
        AND post_type = 'new_listing'
        AND is_default = true
        LIMIT 1;
      END IF;
      
      -- Queue post for creation (if automation_queue table exists)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_queue') THEN
        INSERT INTO automation_queue (
          job_type,
          job_data,
          status,
          priority,
          scheduled_for
        ) VALUES (
          'create_social_post',
          jsonb_build_object(
            'property_id', NEW.id,
            'social_account_id', v_builder_accounts.id,
            'template_id', COALESCE(v_template.id::text, NULL),
            'post_type', 'new_listing'
          ),
          'pending',
          'high',
          CASE 
            WHEN v_builder_accounts.post_frequency = 'immediate' THEN NOW()
            ELSE NOW() + INTERVAL '15 minutes' -- Slight delay for scheduled
          END
        );
      END IF;
      
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS auto_distribute_to_social_media ON properties;

-- Create trigger
CREATE TRIGGER auto_distribute_to_social_media
AFTER INSERT OR UPDATE OF status, is_verified ON properties
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION trigger_social_media_distribution();

-- ==============================================
-- RLS POLICIES
-- ==============================================
-- Social Media Accounts
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builders can manage their own social accounts"
  ON social_media_accounts
  FOR ALL
  USING (auth.uid() = builder_id);

-- Social Media Posts
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builders can view posts for their properties"
  ON social_media_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = social_media_posts.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Social Media Templates
ALTER TABLE social_media_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builders can manage their templates, everyone can view defaults"
  ON social_media_templates
  FOR ALL
  USING (
    builder_id = auth.uid() OR builder_id IS NULL
  );

-- Social Media Campaigns
ALTER TABLE social_media_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builders can manage their campaigns"
  ON social_media_campaigns
  FOR ALL
  USING (auth.uid() = builder_id);



