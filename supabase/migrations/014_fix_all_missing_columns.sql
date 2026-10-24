-- Comprehensive fix for all missing columns in existing tables

-- Fix property_analytics table (only if it's a BASE TABLE, not a view)
DO $$
BEGIN
  -- Only alter if property_analytics is a regular table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'property_analytics'
    AND table_type = 'BASE TABLE'
  ) THEN
    -- Add date column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'property_analytics'
      AND column_name = 'date'
    ) THEN
      ALTER TABLE public.property_analytics
      ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

      -- Add unique constraint
      ALTER TABLE public.property_analytics
      ADD CONSTRAINT property_analytics_property_id_date_unique UNIQUE(property_id, date);
    END IF;

    -- Add count columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'views_count') THEN
      ALTER TABLE public.property_analytics ADD COLUMN views_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'clicks_count') THEN
      ALTER TABLE public.property_analytics ADD COLUMN clicks_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'favorites_count') THEN
      ALTER TABLE public.property_analytics ADD COLUMN favorites_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'shares_count') THEN
      ALTER TABLE public.property_analytics ADD COLUMN shares_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'contact_requests_count') THEN
      ALTER TABLE public.property_analytics ADD COLUMN contact_requests_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'tour_requests_count') THEN
      ALTER TABLE public.property_analytics ADD COLUMN tour_requests_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'unique_visitors_count') THEN
      ALTER TABLE public.property_analytics ADD COLUMN unique_visitors_count int DEFAULT 0;
    END IF;

    -- Create indexes for property_analytics
    CREATE INDEX IF NOT EXISTS idx_property_analytics_date ON public.property_analytics(date DESC);
  END IF;
END $$;

-- Fix property_interactions_hourly table (only if it's a BASE TABLE, not a view)
DO $$
BEGIN
  -- Only alter if property_interactions_hourly is a regular table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'property_interactions_hourly'
    AND table_type = 'BASE TABLE'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'property_interactions_hourly'
      AND column_name = 'hour'
    ) THEN
      ALTER TABLE public.property_interactions_hourly
      ADD COLUMN hour timestamptz NOT NULL DEFAULT date_trunc('hour', now());

      -- Add unique constraint
      ALTER TABLE public.property_interactions_hourly
      ADD CONSTRAINT property_interactions_hourly_property_id_hour_unique UNIQUE(property_id, hour);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_interactions_hourly' AND column_name = 'views_count') THEN
      ALTER TABLE public.property_interactions_hourly ADD COLUMN views_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'property_interactions_hourly' AND column_name = 'clicks_count') THEN
      ALTER TABLE public.property_interactions_hourly ADD COLUMN clicks_count int DEFAULT 0;
    END IF;

    -- Create indexes for property_interactions_hourly
    CREATE INDEX IF NOT EXISTS idx_property_interactions_hourly_hour ON public.property_interactions_hourly(hour DESC);
  END IF;
END $$;

-- Fix page_views table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'page_url') THEN
    ALTER TABLE public.page_views ADD COLUMN page_url text NOT NULL DEFAULT '/';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'session_id') THEN
    ALTER TABLE public.page_views ADD COLUMN session_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'referrer') THEN
    ALTER TABLE public.page_views ADD COLUMN referrer text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'user_agent') THEN
    ALTER TABLE public.page_views ADD COLUMN user_agent text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'ip_address') THEN
    ALTER TABLE public.page_views ADD COLUMN ip_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'country') THEN
    ALTER TABLE public.page_views ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'city') THEN
    ALTER TABLE public.page_views ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'device_type') THEN
    ALTER TABLE public.page_views ADD COLUMN device_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'browser') THEN
    ALTER TABLE public.page_views ADD COLUMN browser text;
  END IF;
END $$;

-- Create indexes for page_views
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);

-- Fix events table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_name') THEN
    ALTER TABLE public.events ADD COLUMN event_name text NOT NULL DEFAULT 'unknown';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'session_id') THEN
    ALTER TABLE public.events ADD COLUMN session_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_data') THEN
    ALTER TABLE public.events ADD COLUMN event_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'page_url') THEN
    ALTER TABLE public.events ADD COLUMN page_url text;
  END IF;
END $$;

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events(event_name);

-- Fix payments table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'status') THEN
    ALTER TABLE public.payments ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'transaction_id') THEN
    ALTER TABLE public.payments ADD COLUMN transaction_id text UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount') THEN
    ALTER TABLE public.payments ADD COLUMN amount numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'currency') THEN
    ALTER TABLE public.payments ADD COLUMN currency text NOT NULL DEFAULT 'INR';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_method') THEN
    ALTER TABLE public.payments ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'provider') THEN
    ALTER TABLE public.payments ADD COLUMN provider text DEFAULT 'razorpay';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'metadata') THEN
    ALTER TABLE public.payments ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- Fix reviews table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'rating') THEN
    ALTER TABLE public.reviews ADD COLUMN rating numeric NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'status') THEN
    ALTER TABLE public.reviews ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'category_location') THEN
    ALTER TABLE public.reviews ADD COLUMN category_location numeric CHECK (category_location >= 0 AND category_location <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'category_value') THEN
    ALTER TABLE public.reviews ADD COLUMN category_value numeric CHECK (category_value >= 0 AND category_value <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'category_quality') THEN
    ALTER TABLE public.reviews ADD COLUMN category_quality numeric CHECK (category_quality >= 0 AND category_quality <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'category_amenities') THEN
    ALTER TABLE public.reviews ADD COLUMN category_amenities numeric CHECK (category_amenities >= 0 AND category_amenities <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'text') THEN
    ALTER TABLE public.reviews ADD COLUMN text text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'verified_buyer') THEN
    ALTER TABLE public.reviews ADD COLUMN verified_buyer boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'helpful_count') THEN
    ALTER TABLE public.reviews ADD COLUMN helpful_count int DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reported_count') THEN
    ALTER TABLE public.reviews ADD COLUMN reported_count int DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_name') THEN
    ALTER TABLE public.reviews ADD COLUMN user_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_avatar') THEN
    ALTER TABLE public.reviews ADD COLUMN user_avatar text;
  END IF;
END $$;

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
