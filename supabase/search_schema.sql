-- =====================================================
-- SEARCH HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Search Query
    query_text TEXT, -- Raw search text
    query_type TEXT CHECK (query_type IN ('text', 'voice', 'map', 'filter')),
    
    -- Voice Search Metadata
    voice_language TEXT, -- 'tamil', 'english'
    voice_transcript TEXT, -- Original Tamil text
    voice_translated TEXT, -- English translation
    
    -- Applied Filters
    filters JSONB, -- All filter values
    
    -- Results
    results_count INTEGER DEFAULT 0,
    top_result_id UUID REFERENCES properties(id),
    
    -- Engagement
    clicked_property_ids UUID[],
    saved_search BOOLEAN DEFAULT false,
    
    -- Geo Location (for map search)
    search_lat DECIMAL(10, 8),
    search_lng DECIMAL(11, 8),
    search_radius INTEGER, -- in meters
    
    -- Device Info
    device_type TEXT, -- mobile, tablet, desktop
    
    -- Timestamp
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- POPULAR SEARCHES TABLE (Aggregated)
-- =====================================================
CREATE TABLE IF NOT EXISTS popular_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Search Query
    search_term TEXT NOT NULL UNIQUE,
    normalized_query TEXT, -- Lowercased, trimmed version
    
    -- Stats
    search_count INTEGER DEFAULT 1,
    click_through_rate DECIMAL(5,2), -- % of searches that led to clicks
    
    -- Metadata
    category TEXT, -- 'location', 'budget', 'bhk', etc.
    suggested_filters JSONB, -- Recommended filters for this query
    
    -- Timestamps
    first_searched_at TIMESTAMPTZ DEFAULT NOW(),
    last_searched_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEARCH SUGGESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS search_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Suggestion
    suggestion_text TEXT NOT NULL,
    suggestion_type TEXT CHECK (suggestion_type IN (
        'location', 'builder', 'property_type', 'bhk', 'price_range', 'amenity'
    )),
    
    -- Display
    display_text TEXT NOT NULL,
    icon TEXT, -- Icon name from lucide-react
    
    -- Priority
    priority INTEGER DEFAULT 0, -- Higher = shown first
    
    -- Stats
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VOICE SEARCH LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS voice_search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Audio Details
    audio_duration DECIMAL(6,2), -- seconds
    audio_language TEXT, -- detected language
    
    -- Transcription
    raw_transcript TEXT NOT NULL,
    confidence_score DECIMAL(5,2), -- 0-100
    
    -- Translation (if Tamil)
    needs_translation BOOLEAN DEFAULT false,
    translated_text TEXT,
    
    -- Parsed Intent
    parsed_filters JSONB,
    intent_category TEXT, -- 'property_search', 'price_inquiry', etc.
    
    -- Success Metrics
    transcription_successful BOOLEAN DEFAULT true,
    translation_successful BOOLEAN,
    filters_extracted BOOLEAN DEFAULT false,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MAP SEARCH AREAS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS map_search_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Area Name
    name TEXT, -- "My search near Anna Nagar"
    
    -- Geometry
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL,
    
    -- Or Polygon (for custom drawn areas)
    polygon_coords JSONB, -- Array of [lat, lng] points
    
    -- Filters for this area
    filters JSONB,
    
    -- Alert Settings
    alert_enabled BOOLEAN DEFAULT false,
    alert_frequency TEXT CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
    
    -- Stats
    properties_in_area INTEGER DEFAULT 0,
    last_checked_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query_text);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(query_type);

CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_normalized ON popular_searches(normalized_query);

CREATE INDEX IF NOT EXISTS idx_suggestions_type ON search_suggestions(suggestion_type, priority DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_active ON search_suggestions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_voice_logs_user ON voice_search_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_logs_language ON voice_search_logs(audio_language);

CREATE INDEX IF NOT EXISTS idx_map_areas_user ON map_search_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_map_areas_location ON map_search_areas(center_lat, center_lng);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_search_areas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
DROP POLICY IF EXISTS "Anyone can view popular searches" ON popular_searches;
DROP POLICY IF EXISTS "Anyone can view active suggestions" ON search_suggestions;
DROP POLICY IF EXISTS "Users can view own voice logs" ON voice_search_logs;
DROP POLICY IF EXISTS "Users can manage own map areas" ON map_search_areas;

CREATE POLICY "Users can view own search history"
    ON search_history FOR ALL
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can view popular searches"
    ON popular_searches FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view active suggestions"
    ON search_suggestions FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can view own voice logs"
    ON voice_search_logs FOR ALL
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage own map areas"
    ON map_search_areas FOR ALL
    USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update popular searches
CREATE OR REPLACE FUNCTION increment_search_count(
    p_search_term TEXT
)
RETURNS void AS $$
DECLARE
    v_normalized TEXT;
BEGIN
    v_normalized := LOWER(TRIM(p_search_term));
    
    INSERT INTO popular_searches (search_term, normalized_query, search_count)
    VALUES (p_search_term, v_normalized, 1)
    ON CONFLICT (search_term)
    DO UPDATE SET
        search_count = popular_searches.search_count + 1,
        last_searched_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    type TEXT,
    display TEXT,
    icon TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.suggestion_text,
        s.suggestion_type,
        s.display_text,
        s.icon
    FROM search_suggestions s
    WHERE 
        s.is_active = true
        AND (
            s.suggestion_text ILIKE '%' || p_query || '%'
            OR s.display_text ILIKE '%' || p_query || '%'
        )
    ORDER BY s.priority DESC, s.usage_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search properties with filters
CREATE OR REPLACE FUNCTION search_properties(
    p_filters JSONB,
    p_sort_by TEXT DEFAULT 'relevance',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    property_id UUID,
    relevance_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        (
            -- Calculate relevance score
            CASE WHEN p.featured THEN 20 ELSE 0 END +
            CASE WHEN p.status = 'available' THEN 10 ELSE 0 END +
            LEAST(p.view_count / 10, 20)::INTEGER +
            CASE WHEN p.rera_approved THEN 10 ELSE 0 END +
            CASE WHEN p.bank_approved THEN 5 ELSE 0 END
        )::INTEGER as score
    FROM properties p
    WHERE 
        -- Status filter
        p.status = 'available'
        
        -- Budget filter
        AND (
            (p_filters->>'budget_min')::BIGINT IS NULL 
            OR p.base_price >= (p_filters->>'budget_min')::BIGINT
        )
        AND (
            (p_filters->>'budget_max')::BIGINT IS NULL 
            OR p.base_price <= (p_filters->>'budget_max')::BIGINT
        )
        
        -- Location filter
        AND (
            p_filters->>'city' IS NULL 
            OR p.city = p_filters->>'city'
        )
        AND (
            p_filters->>'area' IS NULL 
            OR p.area = p_filters->>'area'
        )
        
        -- BHK filter
        AND (
            p_filters->'bhk_types' IS NULL 
            OR p.bhk_type = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'bhk_types')))
        )
        
        -- Property type filter
        AND (
            p_filters->'property_types' IS NULL 
            OR p.property_type = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'property_types')))
        )
        
        -- RERA filter
        AND (
            (p_filters->>'rera_only')::BOOLEAN IS NULL 
            OR (p_filters->>'rera_only')::BOOLEAN = false
            OR p.rera_approved = true
        )
        
        -- Furnishing filter
        AND (
            p_filters->>'furnishing_status' IS NULL 
            OR p.furnishing_status = p_filters->>'furnishing_status'
        )
        
        -- Possession filter
        AND (
            p_filters->>'possession_status' IS NULL 
            OR p.possession_status = p_filters->>'possession_status'
        )
        
    ORDER BY
        CASE p_sort_by
            WHEN 'price_low' THEN p.base_price
            WHEN 'price_high' THEN -p.base_price
            WHEN 'newest' THEN EXTRACT(EPOCH FROM p.created_at)
            WHEN 'popular' THEN -p.view_count
            ELSE -score
        END
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to find properties within radius
CREATE OR REPLACE FUNCTION properties_within_radius(
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_radius_meters INTEGER,
    p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    property_id UUID,
    distance_meters INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        (
            6371000 * acos(
                LEAST(1.0, 
                    cos(radians(p_lat)) * cos(radians(p.latitude)) *
                    cos(radians(p.longitude) - radians(p_lng)) +
                    sin(radians(p_lat)) * sin(radians(p.latitude))
                )
            )
        )::INTEGER as distance
    FROM properties p
    WHERE 
        p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        AND p.status = 'available'
        -- Distance filter using Haversine formula
        AND (
            6371000 * acos(
                LEAST(1.0,
                    cos(radians(p_lat)) * cos(radians(p.latitude)) *
                    cos(radians(p.longitude) - radians(p_lng)) +
                    sin(radians(p_lat)) * sin(radians(p.latitude))
                )
            )
        ) <= p_radius_meters
    ORDER BY distance
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;














