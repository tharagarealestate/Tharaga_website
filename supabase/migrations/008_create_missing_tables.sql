-- Create all missing tables referenced in the application code
-- This migration adds: interactions, property_analytics, property_interactions_hourly, page_views, events, payments, reviews

-- =============================================
-- 1. INTERACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'click', 'share', 'favorite', 'contact', 'tour_request')),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_interactions_property_id ON public.interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interactions(interaction_type);

COMMENT ON TABLE public.interactions IS 'Tracks user interactions with properties for analytics';

-- =============================================
-- 2. PROPERTY_ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  date date NOT NULL,
  views_count int DEFAULT 0,
  clicks_count int DEFAULT 0,
  favorites_count int DEFAULT 0,
  shares_count int DEFAULT 0,
  contact_requests_count int DEFAULT 0,
  tour_requests_count int DEFAULT 0,
  unique_visitors_count int DEFAULT 0,
  UNIQUE(property_id, date)
);

CREATE INDEX IF NOT EXISTS idx_property_analytics_property_id ON public.property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_date ON public.property_analytics(date DESC);

COMMENT ON TABLE public.property_analytics IS 'Daily aggregated analytics for properties';

-- =============================================
-- 3. PROPERTY_INTERACTIONS_HOURLY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_interactions_hourly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  hour timestamptz NOT NULL,
  views_count int DEFAULT 0,
  clicks_count int DEFAULT 0,
  UNIQUE(property_id, hour)
);

CREATE INDEX IF NOT EXISTS idx_property_interactions_hourly_property_id ON public.property_interactions_hourly(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_hourly_hour ON public.property_interactions_hourly(hour DESC);

COMMENT ON TABLE public.property_interactions_hourly IS 'Hourly aggregated interactions for real-time analytics';

-- =============================================
-- 4. PAGE_VIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  page_url text NOT NULL,
  referrer text,
  user_agent text,
  ip_address text,
  country text,
  city text,
  device_type text,
  browser text
);

CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);

COMMENT ON TABLE public.page_views IS 'Tracks page views for overall website analytics';

-- =============================================
-- 5. EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page_url text
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events(event_name);

COMMENT ON TABLE public.events IS 'Custom event tracking for conversion funnel analysis';

-- =============================================
-- 6. PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id bigint REFERENCES public.org_subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text,
  transaction_id text UNIQUE,
  provider text DEFAULT 'razorpay',
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- Updated at trigger for payments
CREATE OR REPLACE FUNCTION public.handle_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_payments_updated_at ON public.payments;
CREATE TRIGGER on_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payments_updated_at();

COMMENT ON TABLE public.payments IS 'Payment transactions for subscriptions and services';

-- =============================================
-- 7. REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  user_avatar text,
  rating numeric NOT NULL CHECK (rating >= 0 AND rating <= 5),
  category_location numeric CHECK (category_location >= 0 AND category_location <= 5),
  category_value numeric CHECK (category_value >= 0 AND category_value <= 5),
  category_quality numeric CHECK (category_quality >= 0 AND category_quality <= 5),
  category_amenities numeric CHECK (category_amenities >= 0 AND category_amenities <= 5),
  text text,
  verified_buyer boolean DEFAULT false,
  helpful_count int DEFAULT 0,
  reported_count int DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Updated at trigger for reviews
CREATE OR REPLACE FUNCTION public.handle_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reviews_updated_at ON public.reviews;
CREATE TRIGGER on_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reviews_updated_at();

COMMENT ON TABLE public.reviews IS 'Property reviews and ratings from buyers';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Interactions: Public can insert, authenticated users can view their own
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert interactions" ON public.interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own interactions" ON public.interactions FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Property Analytics: Builders can view their properties' analytics
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Builders can view their property analytics" ON public.property_analytics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_analytics.property_id 
    AND properties.builder_id IN (
      SELECT id FROM public.builders WHERE name IN (
        SELECT company_name FROM public.profiles WHERE profiles.id = auth.uid()
      )
    )
  )
);
CREATE POLICY "Admins can view all property analytics" ON public.property_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Property Interactions Hourly: Same as property analytics
ALTER TABLE public.property_interactions_hourly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Builders can view their property interactions" ON public.property_interactions_hourly FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_interactions_hourly.property_id 
    AND properties.builder_id IN (
      SELECT id FROM public.builders WHERE name IN (
        SELECT company_name FROM public.profiles WHERE profiles.id = auth.uid()
      )
    )
  )
);
CREATE POLICY "Admins can view all property interactions" ON public.property_interactions_hourly FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Page Views: Only admins can view
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all page views" ON public.page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Events: Only admins can view
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all events" ON public.events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Payments: Users can view their own payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Service can insert payments" ON public.payments FOR INSERT WITH CHECK (true);

-- Reviews: Public can view approved reviews, users can manage their own
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own reviews" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own pending reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can update all reviews" ON public.reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

