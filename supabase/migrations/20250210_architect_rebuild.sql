-- ============================================
-- THARAGA 2.0 - Architect Rebuild Migration
-- AI Cache + Price Index + Localities seed + Realtime + Triggers
-- Idempotent - safe to run multiple times
-- ============================================

-- 1. AI Cache table (for multi-model routing cost optimization)
CREATE TABLE IF NOT EXISTS ai_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text UNIQUE NOT NULL,
  response text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache (expires_at);

-- RLS for ai_cache - service role only
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cache' AND policyname = 'Service role manages ai_cache') THEN
    CREATE POLICY "Service role manages ai_cache" ON ai_cache FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Notifications - table already exists, ensure RLS policies exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users see own notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users update own notifications') THEN
    CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service can insert notifications') THEN
    CREATE POLICY "Service can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 3. Localities - table exists with 7 rows, add missing columns if needed and seed remaining
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'zone') THEN
    ALTER TABLE localities ADD COLUMN zone text NOT NULL DEFAULT 'South';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'state') THEN
    ALTER TABLE localities ADD COLUMN state text NOT NULL DEFAULT 'Tamil Nadu';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'description') THEN
    ALTER TABLE localities ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'avg_price_sqft') THEN
    ALTER TABLE localities ADD COLUMN avg_price_sqft numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'price_trend') THEN
    ALTER TABLE localities ADD COLUMN price_trend text DEFAULT 'stable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'connectivity_score') THEN
    ALTER TABLE localities ADD COLUMN connectivity_score integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'amenities_score') THEN
    ALTER TABLE localities ADD COLUMN amenities_score integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'investment_score') THEN
    ALTER TABLE localities ADD COLUMN investment_score integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'total_properties') THEN
    ALTER TABLE localities ADD COLUMN total_properties integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'total_rera_projects') THEN
    ALTER TABLE localities ADD COLUMN total_rera_projects integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'localities' AND column_name = 'metadata') THEN
    ALTER TABLE localities ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Ensure slug column exists and has unique index
CREATE INDEX IF NOT EXISTS idx_localities_slug ON localities (slug);
CREATE INDEX IF NOT EXISTS idx_localities_city ON localities (city);

-- RLS for localities - public read
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'localities' AND policyname = 'Public read localities') THEN
    CREATE POLICY "Public read localities" ON localities FOR SELECT USING (true);
  END IF;
END $$;

-- Seed all 30 Chennai localities (ON CONFLICT skip existing)
INSERT INTO localities (slug, name, city, zone) VALUES
  ('omr', 'OMR (Old Mahabalipuram Road)', 'Chennai', 'South'),
  ('ecr', 'ECR (East Coast Road)', 'Chennai', 'South'),
  ('tambaram', 'Tambaram', 'Chennai', 'South'),
  ('velachery', 'Velachery', 'Chennai', 'South'),
  ('adyar', 'Adyar', 'Chennai', 'South'),
  ('anna-nagar', 'Anna Nagar', 'Chennai', 'West'),
  ('porur', 'Porur', 'Chennai', 'West'),
  ('vadapalani', 'Vadapalani', 'Chennai', 'West'),
  ('mogappair', 'Mogappair', 'Chennai', 'West'),
  ('ambattur', 'Ambattur', 'Chennai', 'North'),
  ('kolathur', 'Kolathur', 'Chennai', 'North'),
  ('perambur', 'Perambur', 'Chennai', 'North'),
  ('sholinganallur', 'Sholinganallur', 'Chennai', 'South'),
  ('medavakkam', 'Medavakkam', 'Chennai', 'South'),
  ('pallavaram', 'Pallavaram', 'Chennai', 'South'),
  ('chromepet', 'Chromepet', 'Chennai', 'South'),
  ('kelambakkam', 'Kelambakkam', 'Chennai', 'South'),
  ('perungudi', 'Perungudi', 'Chennai', 'South'),
  ('thiruvanmiyur', 'Thiruvanmiyur', 'Chennai', 'South'),
  ('nungambakkam', 'Nungambakkam', 'Chennai', 'Central'),
  ('t-nagar', 'T. Nagar', 'Chennai', 'Central'),
  ('mylapore', 'Mylapore', 'Chennai', 'Central'),
  ('guindy', 'Guindy', 'Chennai', 'South'),
  ('thoraipakkam', 'Thoraipakkam', 'Chennai', 'South'),
  ('navallur', 'Navallur', 'Chennai', 'South'),
  ('siruseri', 'Siruseri', 'Chennai', 'South'),
  ('padur', 'Padur', 'Chennai', 'South'),
  ('poonamallee', 'Poonamallee', 'Chennai', 'West'),
  ('avadi', 'Avadi', 'Chennai', 'North'),
  ('madipakkam', 'Madipakkam', 'Chennai', 'South')
ON CONFLICT (slug) DO UPDATE SET
  zone = EXCLUDED.zone,
  city = EXCLUDED.city;

-- 4. Price Index table
CREATE TABLE IF NOT EXISTS price_index (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  locality_id uuid REFERENCES localities(id) ON DELETE CASCADE,
  locality_slug text NOT NULL,
  property_type text NOT NULL DEFAULT 'apartment',
  avg_price_sqft numeric NOT NULL,
  min_price_sqft numeric,
  max_price_sqft numeric,
  sample_size integer DEFAULT 0,
  month date NOT NULL,
  yoy_change numeric,
  mom_change numeric,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_index_locality ON price_index (locality_slug, month DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_index_unique ON price_index (locality_slug, property_type, month);

ALTER TABLE price_index ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'price_index' AND policyname = 'Public read price_index') THEN
    CREATE POLICY "Public read price_index" ON price_index FOR SELECT USING (true);
  END IF;
END $$;

-- 5. Enable Supabase Realtime on key tables (idempotent - ignores if already added)
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE leads; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE properties; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE property_analytics; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 6. Function + trigger: auto-notify builder on new lead
CREATE OR REPLACE FUNCTION notify_builder_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT
    bp.user_id,
    'new_lead',
    'New Lead Received!',
    COALESCE(NEW.name, 'A buyer') || ' is interested in your property',
    jsonb_build_object('lead_id', NEW.id, 'property_id', NEW.property_id)
  FROM builder_profiles bp
  WHERE bp.id = NEW.builder_id OR bp.user_id = NEW.builder_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_lead ON leads;
CREATE TRIGGER trigger_notify_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_builder_new_lead();
