-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- Migration: 022_newsletter_subscribers.sql
-- Created: 2025-01-XX
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT DEFAULT 'footer', -- footer, blog, etc.
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON public.newsletter_subscribers(subscribed_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_newsletter_subscribers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_newsletter_subscribers_updated_at();

-- ============================================
-- 2. NEWSLETTER INSIGHTS TABLE
-- Stores collected market insights before sending
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- AI-generated short summary
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('government', 'google_alerts', 'real_estate_platform', 'metro', 'rera')),
  category TEXT CHECK (category IN ('market_trends', 'metro_expansion', 'rera_updates', 'property_deals', 'infrastructure', 'regulations')),
  published_date DATE,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for newsletter insights
CREATE INDEX IF NOT EXISTS idx_newsletter_insights_source_type ON public.newsletter_insights(source_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_insights_category ON public.newsletter_insights(category);
CREATE INDEX IF NOT EXISTS idx_newsletter_insights_sent_at ON public.newsletter_insights(sent_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_insights_processed_at ON public.newsletter_insights(processed_at DESC);

-- Prevent duplicate content by source URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_insights_source_url_unique 
ON public.newsletter_insights(source_url) 
WHERE sent_at IS NULL; -- Allow same URL to be resent after being sent

-- ============================================
-- 3. NEWSLETTER CAMPAIGNS TABLE
-- Tracks sent newsletter campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT,
  insight_ids UUID[], -- Array of newsletter_insights.id
  sent_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for campaigns
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON public.newsletter_campaigns(sent_at DESC);

-- Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for newsletter_subscribers
-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter" 
  ON public.newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (true);

-- Users can view and update their own subscription
CREATE POLICY "Users can view their own subscription" 
  ON public.newsletter_subscribers 
  FOR SELECT 
  USING (true); -- Email lookup will be handled server-side

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage all subscriptions" 
  ON public.newsletter_subscribers 
  FOR ALL 
  USING (true);

-- Policies for newsletter_insights
-- Service role can manage all insights
CREATE POLICY "Service role can manage all insights" 
  ON public.newsletter_insights 
  FOR ALL 
  USING (true);

-- Policies for newsletter_campaigns
-- Service role can manage all campaigns
CREATE POLICY "Service role can manage all campaigns" 
  ON public.newsletter_campaigns 
  FOR ALL 
  USING (true);

-- Comments
COMMENT ON TABLE public.newsletter_subscribers IS 'Stores newsletter subscriber email addresses';
COMMENT ON TABLE public.newsletter_insights IS 'Stores collected Chennai real estate market insights from various sources';
COMMENT ON TABLE public.newsletter_campaigns IS 'Tracks sent newsletter campaigns with analytics';

