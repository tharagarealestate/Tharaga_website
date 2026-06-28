-- Performance indexes for hot queries used in the app
-- This migration is defensive: each index is created only if the table/columns exist.
-- Safe to run repeatedly (idempotent) across environments.

-- Leads: filter by builder_id, score range; order by created_at desc
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'builder_id'
  ) THEN
    -- Speeds /api/builder/leads (eq builder_id + order created_at)
    CREATE INDEX IF NOT EXISTS idx_leads_builder_created_at ON public.leads(builder_id, created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'score'
  ) THEN
    -- For score range scans, and occasional ordering by score
    CREATE INDEX IF NOT EXISTS idx_leads_builder_score ON public.leads(builder_id, score DESC);
  END IF;
END $$;

-- Properties: builder listings list/order, and similar property filters
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'builder_id'
  ) THEN
    -- Speeds /api/builder/properties (eq builder_id + order listed_at)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'listed_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_properties_builder_listed_at ON public.properties(builder_id, listed_at DESC);
    ELSE
      -- Fallback to created_at if listed_at does not exist
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'created_at'
      ) THEN
        CREATE INDEX IF NOT EXISTS idx_properties_builder_created_at ON public.properties(builder_id, created_at DESC);
      END IF;
    END IF;
  END IF;
END $$;

-- Filters used by similar-properties query: city/locality/bedrooms + price range
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'city'
  ) THEN
    -- Composite index to help equality filters + range on price_inr
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties' AND column_name='locality') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties' AND column_name='bedrooms') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties' AND column_name='price_inr') THEN
      CREATE INDEX IF NOT EXISTS idx_properties_city_loc_bed_price ON public.properties(city, locality, bedrooms, price_inr);
    END IF;
  END IF;
END $$;

-- Events: recent activity (event_name IN (...) ORDER BY created_at DESC)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_name'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_event_name_created_at ON public.events(event_name, created_at DESC);
  END IF;
END $$;

-- Events: per-user timelines
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_user_created_at ON public.events(user_id, created_at DESC);
  END IF;
END $$;

-- Reviews: fetch latest by property
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'property_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_reviews_property_created_at ON public.reviews(property_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Note: Avoid CREATE INDEX CONCURRENTLY here because Supabase migations run in a transaction.

