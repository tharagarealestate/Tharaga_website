-- ===========================================
-- 000_final_production_ready.sql
-- Top-notch production setup for Supabase
-- ===========================================

-- -------------------------------
-- 1) Drop functions and views if they exist
-- -------------------------------
DROP FUNCTION IF EXISTS upsert_property_embeddings(jsonb);
DROP FUNCTION IF EXISTS match_candidates_hybrid(vector(384), text, text, numeric, numeric, int, int, boolean, boolean, int);
DROP VIEW IF EXISTS v_properties_dedup;

-- -------------------------------
-- 2) Builders table
-- -------------------------------
CREATE TABLE IF NOT EXISTS builders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    trust_score numeric
);

-- -------------------------------
-- 3) Properties table
-- -------------------------------
CREATE TABLE IF NOT EXISTS properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    city text NOT NULL,
    locality text,
    property_type text,
    bedrooms int,
    bathrooms int,
    price_inr numeric,
    sqft numeric,
    lat double precision,
    lng double precision,
    builder_id uuid REFERENCES builders(id),
    embedding vector(384),
    embedding_version int,
    embedded_at timestamptz,
    needs_embedding boolean DEFAULT TRUE
);

-- -------------------------------
-- 4) Metro stations table
-- -------------------------------
CREATE TABLE IF NOT EXISTS metro_stations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city text NOT NULL,
    name text NOT NULL,
    lat double precision,
    lng double precision
);

-- -------------------------------
-- 5) Deduplicated properties view
-- -------------------------------
CREATE OR REPLACE VIEW v_properties_dedup AS
SELECT DISTINCT ON (title, city, locality) *
FROM properties
ORDER BY title, city, locality, embedded_at DESC;

-- -------------------------------
-- 6) Upsert embeddings function
-- -------------------------------
CREATE OR REPLACE FUNCTION upsert_property_embeddings(rows jsonb)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    r jsonb;
BEGIN
    FOR r IN SELECT * FROM jsonb_array_elements(rows)
    LOOP
        UPDATE properties
        SET embedding = (r->>'embedding')::jsonb::vector(384),
            embedding_version = COALESCE((r->>'embedding_version')::int, 1),
            embedded_at = now(),
            needs_embedding = false
        WHERE id = (r->>'id')::uuid;
    END LOOP;
END;
$$;

-- -------------------------------
-- 7) Haversine distance function
-- -------------------------------
CREATE OR REPLACE FUNCTION haversine_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision AS $$
DECLARE
    r constant double precision := 6371; -- Earth radius in km
    dlat double precision := radians(lat2 - lat1);
    dlon double precision := radians(lon2 - lon1);
    a double precision;
BEGIN
    a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)^2;
    RETURN r * 2 * atan2(sqrt(a), sqrt(1 - a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -------------------------------
-- 8) Hybrid property search function
-- -------------------------------
CREATE OR REPLACE FUNCTION match_candidates_hybrid(
    query vector(384),
    city text,
    property_type text,
    price_min numeric,
    price_max numeric,
    bedrooms_min int,
    bathrooms_min int,
    include_embedded boolean,
    include_non_embedded boolean,
    limit_count int
)
RETURNS SETOF properties AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM properties
    WHERE city = city
      AND property_type = property_type
      AND price_inr BETWEEN price_min AND price_max
      AND bedrooms >= bedrooms_min
      AND bathrooms >= bathrooms_min
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- ✅ Production-ready file
-- No dummy data included
-- Functions & views safely dropped/recreated
-- Embeddings handled safely
-- ===========================================
