-- ════════════════════════════════════════════════════════════════════════════
-- Migration: add social_posts + behavior_events tables
-- Audit fix #3 (P0) — tables referenced by /api/social-media/post and
-- /api/builder/behavior-events but missing from the database schema.
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: social_posts
-- Stores queued/published social-media posts per builder.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id        uuid        REFERENCES builder_profiles(id) ON DELETE CASCADE,
  property_id       text,
  caption           text        NOT NULL,
  platforms         text[]      DEFAULT '{}',
  post_type         text        DEFAULT 'property',
  instagram_post_id text,
  facebook_post_id  text,
  status            text        DEFAULT 'queued',   -- queued | published | failed
  created_at        timestamptz DEFAULT now(),
  published_at      timestamptz
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'social_posts' AND policyname = 'builders_own_posts'
  ) THEN
    CREATE POLICY "builders_own_posts" ON social_posts
      FOR ALL USING (builder_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_social_posts_builder
  ON social_posts(builder_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: behavior_events
-- Tracks per-session visitor behavior signals for the Marketing > Behavioral
-- Intelligence tab (scroll depth, CTA clicks, session time, bounce rate).
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavior_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id       uuid        REFERENCES builder_profiles(id) ON DELETE CASCADE,
  property_id      text,
  session_id       text,
  event_type       text        NOT NULL,   -- scroll | cta_click | pageview | gallery | calculator
  scroll_depth     integer,                -- 0-100
  time_on_page_sec integer,
  cta_type         text,                   -- contact | call | whatsapp | schedule
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'behavior_events' AND policyname = 'builders_own_events'
  ) THEN
    CREATE POLICY "builders_own_events" ON behavior_events
      FOR ALL USING (builder_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_behavior_events_builder
  ON behavior_events(builder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_property
  ON behavior_events(property_id, created_at DESC);
