-- ===========================================
-- Enhanced Property Listing & Management System
-- Migration: 052_enhanced_property_listing_system.sql
-- ===========================================

BEGIN;

-- ===========================================
-- 1. ENHANCE PROPERTIES TABLE
-- ===========================================

-- Add missing columns from the enhanced schema
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS builder_id uuid REFERENCES public.profiles(id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state text DEFAULT 'Tamil Nadu';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pincode text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude numeric(10, 8);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS base_price bigint;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS negotiable boolean DEFAULT true;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS super_built_up_area integer;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS plot_area integer;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bhk_type text CHECK (bhk_type IN ('1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnishing_status text CHECK (furnishing_status IN ('unfurnished', 'semi-furnished', 'fully-furnished'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available' CHECK (availability_status IN ('available', 'sold', 'under-offer', 'reserved'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS possession_status text CHECK (possession_status IN ('ready-to-move', 'under-construction'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rera_verified boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approved_by_bank boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS clear_title boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS thumbnail_url text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS virtual_tour_url text;
EXCEPTION WHEN others THEN NULL; END $$;

-- AI Insights fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ai_price_estimate bigint;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ai_appreciation_band text CHECK (ai_appreciation_band IN ('low', 'medium', 'high'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ai_rental_yield numeric(4,2);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ai_risk_score integer CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ai_insights jsonb DEFAULT '{}'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

-- Engagement Metrics
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS inquiry_count integer DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS favorite_count integer DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

-- Admin & Verification
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verification_notes text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verified_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id);
EXCEPTION WHEN others THEN NULL; END $$;

-- SEO fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS meta_title text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS meta_description text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS published_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS expires_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

-- Add location_geom for PostGIS geography (if PostGIS extension is available)
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location_geom geography(POINT, 4326);
EXCEPTION WHEN others THEN NULL; END $$;

-- ===========================================
-- 2. PROPERTY AMENITIES MASTER TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_amenities_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text CHECK (category IN ('basic', 'security', 'recreational', 'convenience', 'eco-friendly')),
  icon text,
  display_order integer DEFAULT 0
);

-- Insert standard amenities
INSERT INTO public.property_amenities_master (name, category, icon, display_order) VALUES
  ('Power Backup', 'basic', 'Zap', 1),
  ('Lift', 'basic', 'ArrowUpCircle', 2),
  ('Parking', 'basic', 'Car', 3),
  ('24x7 Security', 'security', 'Shield', 4),
  ('CCTV Surveillance', 'security', 'Camera', 5),
  ('Gated Community', 'security', 'Lock', 6),
  ('Swimming Pool', 'recreational', 'Waves', 7),
  ('Gym', 'recreational', 'Dumbbell', 8),
  ('Clubhouse', 'recreational', 'Users', 9),
  ('Children Play Area', 'recreational', 'Baby', 10),
  ('Jogging Track', 'recreational', 'Footprints', 11),
  ('Indoor Games', 'recreational', 'Gamepad2', 12),
  ('Party Hall', 'convenience', 'Music', 13),
  ('Visitor Parking', 'convenience', 'ParkingCircle', 14),
  ('Intercom', 'convenience', 'Phone', 15),
  ('Fire Safety', 'security', 'Flame', 16),
  ('Rainwater Harvesting', 'eco-friendly', 'Droplet', 17),
  ('Solar Panels', 'eco-friendly', 'Sun', 18),
  ('Waste Management', 'eco-friendly', 'Trash', 19),
  ('Garden', 'recreational', 'Trees', 20)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 3. PROPERTY VIEWS TRACKING TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  session_id text,
  viewed_at timestamptz DEFAULT now(),
  view_duration integer,
  source text CHECK (source IN ('search', 'featured', 'recommendation', 'direct', 'share')),
  device_type text CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON public.property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user ON public.property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at DESC);

-- ===========================================
-- 4. PROPERTY FAVORITES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_property_favorites_user ON public.property_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_property_favorites_property ON public.property_favorites(property_id);

-- ===========================================
-- 5. PROPERTY INQUIRIES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES public.profiles(id),
  builder_id uuid REFERENCES public.profiles(id),
  
  inquiry_type text CHECK (inquiry_type IN ('general', 'site_visit', 'price_negotiation', 'document_request')),
  message text NOT NULL,
  contact_preference text CHECK (contact_preference IN ('phone', 'email', 'whatsapp', 'any')),
  
  budget_range jsonb,
  visit_preferred_date date,
  visit_preferred_time text,
  
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visited', 'negotiating', 'closed', 'lost')),
  
  -- Lead Scoring
  lead_score integer CHECK (lead_score >= 0 AND lead_score <= 100),
  lead_quality text CHECK (lead_quality IN ('hot', 'warm', 'cold')),
  
  -- Response Tracking
  builder_response text,
  builder_responded_at timestamptz,
  buyer_follow_up_count integer DEFAULT 0,
  last_follow_up_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_inquiries_property ON public.property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_buyer ON public.property_inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_builder ON public.property_inquiries(builder_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_status ON public.property_inquiries(status);

-- ===========================================
-- 6. PROPERTY COMPARISONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  property_ids uuid[] NOT NULL,
  comparison_matrix jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_comparisons_user ON public.property_comparisons(user_id);

-- ===========================================
-- 7. INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_properties_builder ON public.properties(builder_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_status ON public.properties(city, availability_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_price_range ON public.properties(base_price) WHERE verification_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_properties_bhk_city ON public.properties(bhk_type, city);
CREATE INDEX IF NOT EXISTS idx_properties_possession ON public.properties(possession_status);
CREATE INDEX IF NOT EXISTS idx_properties_created ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug) WHERE slug IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_properties_fts ON public.properties USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(address, ''))
);

-- Index for location_geom if PostGIS is available
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING GIST(location_geom);
EXCEPTION WHEN others THEN NULL; END $$;

-- ===========================================
-- 8. RPC FUNCTION FOR INCREMENTING VIEW COUNT
-- ===========================================

CREATE OR REPLACE FUNCTION increment_property_views(property_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties 
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE id = property_id_param;
END;
$$;

-- ===========================================
-- 9. FUNCTION TO UPDATE FAVORITE COUNT
-- ===========================================

CREATE OR REPLACE FUNCTION update_property_favorite_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.properties 
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.property_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.properties 
    SET favorite_count = favorite_count - 1
    WHERE id = OLD.property_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_favorite_count ON public.property_favorites;
CREATE TRIGGER trigger_update_favorite_count
  AFTER INSERT OR DELETE ON public.property_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_property_favorite_count();

-- ===========================================
-- 10. FUNCTION TO UPDATE INQUIRY COUNT
-- ===========================================

CREATE OR REPLACE FUNCTION update_property_inquiry_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.properties 
    SET inquiry_count = inquiry_count + 1
    WHERE id = NEW.property_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_inquiry_count ON public.property_inquiries;
CREATE TRIGGER trigger_update_inquiry_count
  AFTER INSERT ON public.property_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_property_inquiry_count();

-- ===========================================
-- 11. UPDATED_AT TRIGGER FOR INQUIRIES
-- ===========================================

CREATE OR REPLACE FUNCTION handle_property_inquiries_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_property_inquiries_updated_at ON public.property_inquiries;
CREATE TRIGGER on_property_inquiries_updated_at
  BEFORE UPDATE ON public.property_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION handle_property_inquiries_updated_at();

-- ===========================================
-- 12. ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Property Views: Anyone can insert, users can view their own
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert views" ON public.property_views;
CREATE POLICY "Users can insert views"
  ON public.property_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own views" ON public.property_views;
CREATE POLICY "Users can view their own views"
  ON public.property_views FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Property Favorites: Users can manage their own favorites
ALTER TABLE public.property_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage favorites" ON public.property_favorites;
CREATE POLICY "Users can manage favorites"
  ON public.property_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Property Inquiries: Buyers can create, both can view their own
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can create inquiries" ON public.property_inquiries;
CREATE POLICY "Buyers can create inquiries"
  ON public.property_inquiries FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can view their inquiries" ON public.property_inquiries;
CREATE POLICY "Users can view their inquiries"
  ON public.property_inquiries FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = builder_id);

-- Property Comparisons: Users can manage their own comparisons
ALTER TABLE public.property_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage comparisons" ON public.property_comparisons;
CREATE POLICY "Users can manage comparisons"
  ON public.property_comparisons FOR ALL
  USING (auth.uid() = user_id);

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.property_amenities_master IS 'Master list of property amenities with categories and icons';
COMMENT ON TABLE public.property_views IS 'Tracks property views for analytics and engagement metrics';
COMMENT ON TABLE public.property_favorites IS 'User favorite properties';
COMMENT ON TABLE public.property_inquiries IS 'Buyer inquiries for properties';
COMMENT ON TABLE public.property_comparisons IS 'User property comparisons';

COMMIT;

