-- ===========================================
-- THARAGA HELPER FUNCTIONS
-- Run AFTER the main SUPABASE_SETUP.sql
-- ===========================================

-- Increment current leads for a sales person
CREATE OR REPLACE FUNCTION increment_current_leads(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE sales_team
    SET current_leads = current_leads + 1,
        leads_assigned = leads_assigned + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement current leads for a sales person
CREATE OR REPLACE FUNCTION decrement_current_leads(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE sales_team
    SET current_leads = GREATEST(0, current_leads - 1)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Increment leads converted count
CREATE OR REPLACE FUNCTION increment_leads_converted(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE sales_team
    SET leads_converted = leads_converted + 1,
        current_leads = GREATEST(0, current_leads - 1)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Update property view count
CREATE OR REPLACE FUNCTION increment_property_views(property_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE properties
    SET view_count = view_count + 1
    WHERE id = property_id;
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
    converted_leads bigint,
    pipeline_value numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint AS total_leads,
        COUNT(*) FILTER (WHERE tier = 'lion')::bigint AS lion_leads,
        COUNT(*) FILTER (WHERE tier = 'monkey')::bigint AS monkey_leads,
        COUNT(*) FILTER (WHERE tier = 'dog')::bigint AS dog_leads,
        COUNT(*) FILTER (WHERE is_qualified = true)::bigint AS qualified_leads,
        COUNT(*) FILTER (WHERE status = 'converted')::bigint AS converted_leads,
        COALESCE(SUM(budget_max) FILTER (WHERE status NOT IN ('lost', 'converted')), 0)::numeric AS pipeline_value
    FROM leads
    WHERE DATE(created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- Get builder analytics for date range
CREATE OR REPLACE FUNCTION get_builder_stats(
    p_builder_id uuid,
    p_start_date date DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_leads bigint,
    converted_leads bigint,
    avg_response_time numeric,
    sla_met_pct numeric,
    pipeline_value numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT l.id)::bigint AS total_leads,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'converted')::bigint AS converted_leads,
        AVG(EXTRACT(EPOCH FROM (la.responded_at - la.created_at))/60)::numeric AS avg_response_time,
        (COUNT(*) FILTER (WHERE la.sla_met = true)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric AS sla_met_pct,
        COALESCE(SUM(l.budget_max), 0)::numeric AS pipeline_value
    FROM leads l
    LEFT JOIN lead_assignments la ON la.lead_id = l.id
    WHERE l.created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- SEED DATA: Sample sales team
-- ===========================================
-- Note: Replace with real user IDs after creating users in Supabase Auth
-- This is just template data

-- ===========================================
-- SEED DATA: Sample Chennai properties
-- ===========================================
INSERT INTO properties (
    title, description, city, locality, property_type, bedrooms, bathrooms,
    price_inr, sqft, lat, lng, status, ai_score, is_rera_verified, amenities, images
) VALUES
(
    '3BHK Premium Villa - Anna Nagar',
    'Spacious 3BHK villa with modern amenities in prime Anna Nagar location',
    'Chennai', 'Anna Nagar', 'villa', 3, 3,
    12000000, 2200, 13.0850, 80.2101, 'available', 94, true,
    ARRAY['gym', 'pool', 'parking', 'security', 'clubhouse'],
    ARRAY['https://picsum.photos/seed/anna1/800/600']
),
(
    '2BHK Smart Apartment - OMR',
    'Modern 2BHK apartment on OMR with metro connectivity',
    'Chennai', 'OMR', 'apartment', 2, 2,
    6800000, 950, 12.8406, 80.2274, 'available', 87, true,
    ARRAY['gym', 'parking', 'security', 'power_backup'],
    ARRAY['https://picsum.photos/seed/omr1/800/600']
),
(
    '3BHK Premium Apartment - Adyar',
    'Premium 3BHK in Adyar with beach proximity',
    'Chennai', 'Adyar', 'apartment', 3, 3,
    9500000, 1450, 13.0067, 80.2569, 'available', 91, true,
    ARRAY['gym', 'pool', 'parking', 'security', 'garden'],
    ARRAY['https://picsum.photos/seed/adyar1/800/600']
),
(
    '2BHK Smart Home - Velachery',
    '2BHK home in fast-growing Velachery',
    'Chennai', 'Velachery', 'apartment', 2, 2,
    7200000, 1050, 12.9810, 80.2189, 'available', 83, true,
    ARRAY['parking', 'security', 'power_backup'],
    ARRAY['https://picsum.photos/seed/velachery1/800/600']
),
(
    'Studio Apartment - T Nagar',
    'Compact studio in heart of T Nagar shopping district',
    'Chennai', 'T Nagar', 'studio', 1, 1,
    3800000, 420, 13.0418, 80.2341, 'available', 76, true,
    ARRAY['security', 'parking'],
    ARRAY['https://picsum.photos/seed/tnagar1/800/600']
),
(
    '4BHK Luxury Bungalow - Porur',
    'Luxurious 4BHK bungalow in serene Porur',
    'Chennai', 'Porur', 'villa', 4, 4,
    21000000, 3200, 13.0381, 80.1565, 'available', 96, true,
    ARRAY['gym', 'pool', 'parking', 'security', 'garden', 'clubhouse'],
    ARRAY['https://picsum.photos/seed/porur1/800/600']
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- Success message
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Helper functions and seed data installed successfully';
END $$;
