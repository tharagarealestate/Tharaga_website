-- ============================================
-- PROPERTIES TABLE (Enhanced for Filtering)
-- ============================================

-- Add missing columns if they don't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS metro_distance_minutes INTEGER,
ADD COLUMN IF NOT EXISTS facing TEXT CHECK (facing IN ('east', 'west', 'north', 'south')),
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS listing_type TEXT CHECK (listing_type IN ('sale', 'rent')) DEFAULT 'sale',
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive', 'sold', 'rented')) DEFAULT 'active';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_locality ON properties(locality);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bhk ON properties(bhk);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_furnished_status ON properties(furnished_status);
CREATE INDEX IF NOT EXISTS idx_properties_area_sqft ON properties(area_sqft);
CREATE INDEX IF NOT EXISTS idx_properties_ai_score ON properties(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_metro_distance ON properties(metro_distance_minutes);
CREATE INDEX IF NOT EXISTS idx_properties_facing ON properties(facing);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);

-- Create GIN index for amenities JSONB column (for fast array searches)
CREATE INDEX IF NOT EXISTS idx_properties_amenities ON properties USING GIN (amenities);

-- Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_properties_city_price ON properties(city, price);
CREATE INDEX IF NOT EXISTS idx_properties_city_bhk ON properties(city, bhk);
CREATE INDEX IF NOT EXISTS idx_properties_city_type ON properties(city, property_type);

-- ============================================
-- LOCALITIES TABLE (For Auto-complete)
-- ============================================

CREATE TABLE IF NOT EXISTS localities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  properties_count INTEGER DEFAULT 0,
  avg_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(name, city)
);

CREATE INDEX IF NOT EXISTS idx_localities_city ON localities(city);
CREATE INDEX IF NOT EXISTS idx_localities_name ON localities(name);

-- ============================================
-- AMENITIES TABLE (For Standardization)
-- ============================================

CREATE TABLE IF NOT EXISTS amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  category TEXT,
  usage_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_amenities_name ON amenities(name);

-- ============================================
-- USER SAVED SEARCHES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  alert_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- ============================================
-- USER FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON user_favorites(property_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Properties: Public read, authenticated write
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Properties are insertable by authenticated users" ON properties;
CREATE POLICY "Properties are insertable by authenticated users"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Saved Searches: Users can only see their own
DROP POLICY IF EXISTS "Users can view own saved searches" ON saved_searches;
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved searches" ON saved_searches;
CREATE POLICY "Users can insert own saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Favorites: Users can only manage their own
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;
CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS FOR FILTER AGGREGATIONS
-- ============================================

-- Get price range for a city
CREATE OR REPLACE FUNCTION get_price_range(p_city TEXT)
RETURNS TABLE (min_price NUMERIC, max_price NUMERIC, avg_price NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MIN(price) AS min_price,
    MAX(price) AS max_price,
    AVG(price) AS avg_price
  FROM properties
  WHERE city = p_city AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Get available property types for a city
CREATE OR REPLACE FUNCTION get_available_property_types(p_city TEXT)
RETURNS TABLE (property_type TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.property_type,
    COUNT(*) AS count
  FROM properties p
  WHERE p.city = p_city AND p.status = 'active'
  GROUP BY p.property_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS FOR DATA INTEGRITY
-- ============================================

-- Update localities count when property added/removed
CREATE OR REPLACE FUNCTION update_locality_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO localities (name, city, properties_count, avg_price)
    VALUES (NEW.locality, NEW.city, 1, NEW.price)
    ON CONFLICT (name, city) DO UPDATE
    SET 
      properties_count = localities.properties_count + 1,
      avg_price = (localities.avg_price * localities.properties_count + NEW.price) / (localities.properties_count + 1);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE localities
    SET properties_count = properties_count - 1
    WHERE name = OLD.locality AND city = OLD.city;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_locality_count ON properties;
CREATE TRIGGER trigger_update_locality_count
AFTER INSERT OR DELETE ON properties
FOR EACH ROW EXECUTE FUNCTION update_locality_count();

