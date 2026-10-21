-- ============================================
-- ELITE PROPERTY SCHEMA — realtor.com grade
-- Adds: agents table, enhanced property fields,
-- full-text search, saved properties, area insights
-- ============================================

-- Agents / Builders table
CREATE TABLE IF NOT EXISTS agents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  email       text,
  photo_url   text,
  company     text,
  license_no  text,
  rera_no     text,
  verified    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);

-- Enhanced properties: add agent reference + missing fields
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS slug          text,
  ADD COLUMN IF NOT EXISTS agent_id      uuid REFERENCES agents(id),
  ADD COLUMN IF NOT EXISTS lat           numeric(10,7),
  ADD COLUMN IF NOT EXISTS lng           numeric(10,7),
  ADD COLUMN IF NOT EXISTS video_url     text,
  ADD COLUMN IF NOT EXISTS virtual_tour_url text,
  ADD COLUMN IF NOT EXISTS possession_date date,
  ADD COLUMN IF NOT EXISTS total_floors  smallint,
  ADD COLUMN IF NOT EXISTS floor_number  smallint,
  ADD COLUMN IF NOT EXISTS parking       smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS project_name  text,
  ADD COLUMN IF NOT EXISTS developer_name text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS highlight_tags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS view_count    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_count integer DEFAULT 0;

-- Unique slug index (populated by trigger below)
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured, created_at DESC) WHERE featured = true;

-- Full-text search index (locality + title + project + developer)
CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties
  USING gin(
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(locality, '') || ' ' ||
      coalesce(project_name, '') || ' ' ||
      coalesce(developer_name, '') || ' ' ||
      coalesce(address, '')
    )
  );

-- ============================================
-- AREA INSIGHTS TABLE
-- Aggregated market data per locality
-- ============================================
CREATE TABLE IF NOT EXISTS area_insights (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locality        text NOT NULL,
  city            text NOT NULL DEFAULT 'Chennai',
  avg_price_sqft  numeric,
  price_trend_pct numeric,   -- % change vs last quarter
  total_listings  integer DEFAULT 0,
  sold_last_90d   integer DEFAULT 0,
  avg_days_market integer,
  description     text,
  highlights      jsonb DEFAULT '[]'::jsonb,
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(locality, city)
);

CREATE INDEX IF NOT EXISTS idx_area_insights_locality ON area_insights(locality, city);

-- ============================================
-- PROPERTY VIEWS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS property_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash     text,
  viewed_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id, viewed_at DESC);

-- ============================================
-- SLUG GENERATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION generate_property_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter   int := 0;
BEGIN
  IF NEW.slug IS NOT NULL THEN
    RETURN NEW;
  END IF;
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        coalesce(NEW.locality, '') || '-' || coalesce(NEW.property_type, '') || '-' || coalesce(NEW.bhk::text, '') || 'bhk',
        '[^a-z0-9]+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  );
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_property_slug ON properties;
CREATE TRIGGER trigger_property_slug
  BEFORE INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION generate_property_slug();

-- ============================================
-- VIEW COUNT INCREMENT FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION increment_property_view(p_id uuid, p_user_id uuid DEFAULT NULL, p_ip_hash text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO property_views(property_id, user_id, ip_hash) VALUES (p_id, p_user_id, p_ip_hash);
  UPDATE properties SET view_count = view_count + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEARCH FUNCTION (full-text + filters)
-- ============================================
CREATE OR REPLACE FUNCTION search_properties(
  p_query       text DEFAULT NULL,
  p_city        text DEFAULT 'Chennai',
  p_type        text DEFAULT NULL,
  p_min_price   bigint DEFAULT NULL,
  p_max_price   bigint DEFAULT NULL,
  p_min_bhk     smallint DEFAULT NULL,
  p_max_bhk     smallint DEFAULT NULL,
  p_min_sqft    numeric DEFAULT NULL,
  p_listing_type text DEFAULT 'sale',
  p_sort        text DEFAULT 'relevance',
  p_limit       int DEFAULT 20,
  p_offset      int DEFAULT 0
)
RETURNS TABLE (
  id uuid, slug text, title text, locality text, city text,
  property_type text, bhk smallint, area_sqft numeric,
  price bigint, images jsonb, featured boolean,
  verified boolean, rera_id text, lat numeric, lng numeric,
  project_name text, developer_name text, listing_type text,
  created_at timestamptz, view_count integer, total_count bigint
) AS $$
DECLARE
  ts_query tsquery;
BEGIN
  IF p_query IS NOT NULL AND p_query != '' THEN
    ts_query := plainto_tsquery('english', p_query);
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT p.*,
           COUNT(*) OVER() AS total_count
    FROM properties p
    WHERE
      (p.city = p_city OR p_city IS NULL)
      AND (p.status = 'active' OR p.status IS NULL)
      AND (p.listing_type = p_listing_type OR p_listing_type IS NULL)
      AND (p.property_type = p_type OR p_type IS NULL)
      AND (p.price >= p_min_price OR p_min_price IS NULL)
      AND (p.price <= p_max_price OR p_max_price IS NULL)
      AND (p.bhk >= p_min_bhk OR p_min_bhk IS NULL)
      AND (p.bhk <= p_max_bhk OR p_max_bhk IS NULL)
      AND (p.area_sqft >= p_min_sqft OR p_min_sqft IS NULL)
      AND (
        ts_query IS NULL OR
        to_tsvector('english',
          coalesce(p.title,'') || ' ' ||
          coalesce(p.locality,'') || ' ' ||
          coalesce(p.project_name,'') || ' ' ||
          coalesce(p.developer_name,'') || ' ' ||
          coalesce(p.address,'')
        ) @@ ts_query
      )
    ORDER BY
      CASE WHEN p_sort = 'price_low'  THEN p.price END ASC,
      CASE WHEN p_sort = 'price_high' THEN p.price END DESC,
      CASE WHEN p_sort = 'newest'     THEN p.created_at END DESC,
      p.featured DESC,
      CASE WHEN ts_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.locality,'')),
          ts_query
        )
      END DESC NULLS LAST,
      p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    f.id, f.slug, f.title, f.locality, f.city,
    f.property_type, f.bhk, f.area_sqft,
    f.price, f.images, f.featured,
    f.is_verified, f.rera_id, f.lat, f.lng,
    f.project_name, f.developer_name, f.listing_type,
    f.created_at, f.view_count, f.total_count
  FROM filtered f;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RLS for new tables
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents viewable by everyone" ON agents FOR SELECT USING (true);
CREATE POLICY "Area insights viewable by everyone" ON area_insights FOR SELECT USING (true);
CREATE POLICY "Property views insertable by everyone" ON property_views FOR INSERT WITH CHECK (true);
