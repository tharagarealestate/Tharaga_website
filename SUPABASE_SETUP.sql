-- ===========================================
-- THARAGA ADDITIVE SQL MIGRATION
-- Run this in Supabase SQL Editor
-- ONLY ADDS new tables and columns - does NOT modify existing
-- ===========================================

-- ===========================================
-- 1. ADD MISSING TABLES
-- ===========================================

-- Meta CAPI event tracking
CREATE TABLE IF NOT EXISTS meta_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id bigint REFERENCES leads(id) ON DELETE SET NULL,
    
    event_name text NOT NULL,
    event_id text UNIQUE NOT NULL,
    event_time timestamptz NOT NULL,
    
    fbp text,
    fbc text,
    user_data jsonb,
    custom_data jsonb,
    
    fb_response jsonb,
    events_received int DEFAULT 0,
    events_dropped int DEFAULT 0,
    match_quality_score numeric,
    
    sent_to_meta boolean DEFAULT false,
    sent_at timestamptz,
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_events_lead_id ON meta_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_meta_events_event_name ON meta_events(event_name);
CREATE INDEX IF NOT EXISTS idx_meta_events_event_time ON meta_events(event_time DESC);

-- RERA verification cache
CREATE TABLE IF NOT EXISTS rera_verification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rera_id text UNIQUE NOT NULL,
    
    project_name text,
    promoter_name text,
    registration_date date,
    completion_date date,
    
    is_valid boolean DEFAULT true,
    verification_status text,
    
    verified_at timestamptz,
    last_checked_at timestamptz,
    verification_source text,
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rera_verification_rera_id ON rera_verification(rera_id);

-- Live metrics cache
CREATE TABLE IF NOT EXISTS live_metrics (
    id text PRIMARY KEY,
    metrics jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- Generic locality_insights view (mapping for our code)
-- If chennai_locality_insights has different schema, create a normalized view
CREATE TABLE IF NOT EXISTS locality_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city text NOT NULL,
    locality text NOT NULL,
    
    avg_price_sqft numeric,
    price_trend_percentage numeric,
    demand_level text,
    demand_change_percentage numeric,
    
    active_properties int DEFAULT 0,
    new_listings_month int DEFAULT 0,
    
    metro_stations_nearby int DEFAULT 0,
    schools_count int DEFAULT 0,
    hospitals_count int DEFAULT 0,
    malls_count int DEFAULT 0,
    
    connectivity_score int,
    safety_score int,
    lifestyle_score int,
    
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(city, locality)
);

CREATE INDEX IF NOT EXISTS idx_locality_insights_city ON locality_insights(city);

-- Seed Chennai locality data
INSERT INTO locality_insights (city, locality, avg_price_sqft, price_trend_percentage, demand_level, demand_change_percentage, active_properties, connectivity_score, safety_score, lifestyle_score) VALUES
('Chennai', 'Anna Nagar', 8200, 2.4, 'high', 12, 45, 92, 88, 85),
('Chennai', 'T Nagar', 9500, 5.8, 'very_high', 34, 67, 95, 82, 90),
('Chennai', 'Adyar', 8400, 1.2, 'high', 8, 52, 88, 90, 88),
('Chennai', 'Velachery', 7200, 11.2, 'very_high', 28, 78, 85, 85, 82),
('Chennai', 'OMR', 6800, 15.3, 'very_high', 42, 156, 90, 80, 88),
('Chennai', 'Porur', 6500, 8.5, 'high', 18, 89, 82, 84, 78),
('Chennai', 'Chromepet', 5900, 6.2, 'medium', 15, 34, 78, 82, 75),
('Chennai', 'Guindy', 7800, 4.5, 'high', 22, 41, 92, 85, 85),
('Chennai', 'Sholinganallur', 7100, 18.5, 'very_high', 45, 92, 88, 82, 85),
('Chennai', 'ECR', 8900, 12.3, 'high', 25, 38, 75, 88, 92)
ON CONFLICT (city, locality) DO UPDATE SET
    avg_price_sqft = EXCLUDED.avg_price_sqft,
    price_trend_percentage = EXCLUDED.price_trend_percentage,
    demand_level = EXCLUDED.demand_level,
    updated_at = now();

-- ===========================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- (Safe - uses IF NOT EXISTS pattern)
-- ===========================================

-- Add tier column to leads if missing 'lion'/'monkey'/'dog' values
-- Note: existing tier column has 'COOL' etc, we'll use 'smart_tier' for new logic
ALTER TABLE leads ADD COLUMN IF NOT EXISTS smart_tier text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS smart_score int CHECK (smart_score >= 0 AND smart_score <= 100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS smart_score_factors jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS smart_score_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_smart_tier ON leads(smart_tier);
CREATE INDEX IF NOT EXISTS idx_leads_smart_score ON leads(smart_score DESC);

-- ===========================================
-- 3. HELPER FUNCTIONS
-- ===========================================

-- Increment current leads for sales person
CREATE OR REPLACE FUNCTION increment_current_leads(p_user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE sales_team
    SET current_leads = COALESCE(current_leads, 0) + 1
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_current_leads(p_user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE sales_team
    SET current_leads = GREATEST(0, COALESCE(current_leads, 0) - 1)
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Get daily lead stats
CREATE OR REPLACE FUNCTION get_daily_lead_stats(target_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(
    total_leads bigint,
    lion_leads bigint,
    monkey_leads bigint,
    dog_leads bigint,
    qualified_leads bigint,
    converted_leads bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint AS total_leads,
        COUNT(*) FILTER (WHERE smart_tier = 'lion')::bigint AS lion_leads,
        COUNT(*) FILTER (WHERE smart_tier = 'monkey')::bigint AS monkey_leads,
        COUNT(*) FILTER (WHERE smart_tier = 'dog')::bigint AS dog_leads,
        COUNT(*) FILTER (WHERE whatsapp_qualified = true OR status = 'qualified')::bigint AS qualified_leads,
        COUNT(*) FILTER (WHERE status = 'converted')::bigint AS converted_leads
    FROM leads
    WHERE DATE(created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- SUCCESS
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Tharaga additive migration completed successfully';
    RAISE NOTICE '   - Created: meta_events, rera_verification, live_metrics, locality_insights';
    RAISE NOTICE '   - Added columns: smart_tier, smart_score to leads';
    RAISE NOTICE '   - Created helper functions';
END $$;
