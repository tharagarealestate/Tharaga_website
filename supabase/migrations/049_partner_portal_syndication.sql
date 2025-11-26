-- File: /supabase/migrations/049_partner_portal_syndication.sql
-- ==============================================
-- PARTNER PORTAL SYNDICATION SYSTEM
-- ==============================================

-- ==============================================
-- PARTNER PORTAL INTEGRATIONS
-- ==============================================
CREATE TABLE IF NOT EXISTS partner_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Portal Details
  portal_name TEXT NOT NULL UNIQUE, -- '99acres', 'magicbricks', 'housing'
  portal_display_name TEXT NOT NULL,
  portal_url TEXT NOT NULL,
  
  -- API Configuration
  api_base_url TEXT,
  api_version TEXT,
  auth_type TEXT, -- 'api_key', 'oauth', 'basic', 'custom'
  
  -- Rate Limits
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_day INTEGER DEFAULT 10000,
  max_listings_per_account INTEGER,
  
  -- Features Support
  supports_images BOOLEAN DEFAULT true,
  supports_videos BOOLEAN DEFAULT false,
  supports_virtual_tours BOOLEAN DEFAULT false,
  supports_floor_plans BOOLEAN DEFAULT true,
  max_images INTEGER DEFAULT 20,
  max_description_length INTEGER DEFAULT 5000,
  
  -- Pricing
  listing_cost_per_month DECIMAL(10,2),
  featured_listing_cost DECIMAL(10,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_beta BOOLEAN DEFAULT false,
  
  -- Metadata
  field_mappings JSONB, -- How Tharaga fields map to portal fields
  required_fields JSONB, -- Which fields are mandatory
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert major portals
INSERT INTO partner_portals (portal_name, portal_display_name, portal_url, supports_videos, max_images) VALUES
('99acres', '99acres', 'https://www.99acres.com', false, 20),
('magicbricks', 'MagicBricks', 'https://www.magicbricks.com', false, 15),
('housing', 'Housing.com', 'https://housing.com', true, 25),
('commonfloor', 'CommonFloor', 'https://www.commonfloor.com', false, 20),
('nobroker', 'NoBroker', 'https://www.nobroker.in', false, 20),
('indiaproperty', 'IndiaProperty', 'https://www.indiaproperty.com', false, 15)
ON CONFLICT (portal_name) DO NOTHING;

-- ==============================================
-- BUILDER PORTAL ACCOUNTS
-- ==============================================
CREATE TABLE IF NOT EXISTS builder_portal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  portal_id UUID REFERENCES partner_portals(id),
  
  -- Account Details
  portal_account_id TEXT NOT NULL, -- Builder's account ID on portal
  portal_username TEXT,
  portal_email TEXT,
  
  -- Authentication
  api_key TEXT, -- Encrypted
  access_token TEXT, -- Encrypted
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'active', -- 'active', 'pending', 'expired', 'suspended'
  
  -- Subscription Details
  subscription_type TEXT, -- 'basic', 'premium', 'enterprise'
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  listings_quota INTEGER, -- How many listings allowed
  listings_used INTEGER DEFAULT 0,
  
  -- Sync Settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'hourly', 'daily'
  sync_new_listings BOOLEAN DEFAULT true,
  sync_price_updates BOOLEAN DEFAULT true,
  sync_status_changes BOOLEAN DEFAULT true,
  
  -- Performance
  total_listings_synced INTEGER DEFAULT 0,
  successful_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_builder_portal_unique ON builder_portal_accounts(builder_id, portal_id);
CREATE INDEX IF NOT EXISTS idx_builder_portal_builder ON builder_portal_accounts(builder_id, is_active);
CREATE INDEX IF NOT EXISTS idx_builder_portal_status ON builder_portal_accounts(connection_status);

-- ==============================================
-- SYNDICATED LISTINGS
-- ==============================================
CREATE TABLE IF NOT EXISTS syndicated_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  portal_account_id UUID REFERENCES builder_portal_accounts(id) ON DELETE CASCADE,
  portal_id UUID REFERENCES partner_portals(id),
  
  -- Portal Listing Details
  portal_listing_id TEXT, -- External listing ID on portal
  portal_listing_url TEXT, -- Public URL on portal
  
  -- Sync Status
  status TEXT DEFAULT 'pending', -- 'pending', 'queued', 'synced', 'failed', 'deactivated'
  sync_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  
  -- Mapped Data
  mapped_data JSONB, -- Property data transformed for portal format
  validation_errors JSONB, -- Any field validation issues
  
  -- Sync Timestamps
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  
  -- Error Tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Performance Metrics (from portal)
  portal_views INTEGER DEFAULT 0,
  portal_contacts INTEGER DEFAULT 0,
  portal_favorites INTEGER DEFAULT 0,
  last_metrics_sync TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syndicated_property ON syndicated_listings(property_id, status);
CREATE INDEX IF NOT EXISTS idx_syndicated_portal_account ON syndicated_listings(portal_account_id, status);
CREATE INDEX IF NOT EXISTS idx_syndicated_status ON syndicated_listings(status, queued_at);
CREATE INDEX IF NOT EXISTS idx_syndicated_portal_listing ON syndicated_listings(portal_listing_id, portal_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE syndicated_listings;

-- ==============================================
-- SYNDICATION LOGS (Audit Trail)
-- ==============================================
CREATE TABLE IF NOT EXISTS syndication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syndicated_listing_id UUID REFERENCES syndicated_listings(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'sync_attempt', 'sync_success', 'sync_failed', 'update', 'delete'
  portal_name TEXT NOT NULL,
  
  -- Request/Response
  request_payload JSONB,
  response_payload JSONB,
  http_status_code INTEGER,
  
  -- Timing
  duration_ms INTEGER,
  
  -- Error Details
  error_code TEXT,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syndication_logs_listing ON syndication_logs(syndicated_listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_syndication_logs_event ON syndication_logs(event_type, created_at DESC);

-- ==============================================
-- PORTAL FIELD MAPPINGS
-- ==============================================
CREATE TABLE IF NOT EXISTS portal_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID REFERENCES partner_portals(id),
  
  -- Field Mapping
  tharaga_field TEXT NOT NULL, -- Our field name
  portal_field TEXT NOT NULL, -- Portal's field name
  
  -- Transformation Rules
  data_type TEXT, -- 'string', 'number', 'boolean', 'enum', 'array'
  transformation_rule JSONB, -- How to transform data
  
  -- Validation
  is_required BOOLEAN DEFAULT false,
  validation_regex TEXT,
  allowed_values JSONB, -- For enums
  min_value NUMERIC,
  max_value NUMERIC,
  
  -- Examples
  example_input TEXT,
  example_output TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_mappings_portal ON portal_field_mappings(portal_id);

-- Insert default field mappings for 99acres
INSERT INTO portal_field_mappings (portal_id, tharaga_field, portal_field, data_type, is_required) 
SELECT 
  pp.id,
  mapping.tharaga_field,
  mapping.portal_field,
  mapping.data_type,
  mapping.is_required
FROM partner_portals pp
CROSS JOIN (VALUES
  ('title', 'propertyTitle', 'string', true),
  ('price', 'price', 'number', true),
  ('location', 'locality', 'string', true),
  ('bedrooms', 'bedrooms', 'number', true),
  ('bathrooms', 'bathrooms', 'number', false),
  ('area', 'superArea', 'number', true),
  ('description', 'description', 'string', false),
  ('property_type', 'propertyType', 'enum', true)
) AS mapping(tharaga_field, portal_field, data_type, is_required)
WHERE pp.portal_name = '99acres'
ON CONFLICT DO NOTHING;

-- ==============================================
-- REAL-TIME FUNCTIONS
-- ==============================================
-- Function to auto-syndicate new properties
CREATE OR REPLACE FUNCTION trigger_partner_syndication()
RETURNS TRIGGER AS $$
DECLARE
  v_portal_account RECORD;
BEGIN
  -- Only trigger for active, verified properties
  IF NEW.status = 'active' AND (NEW.is_verified = true OR NEW.is_verified IS NULL) THEN
    
    -- Get all active portal accounts for this builder
    FOR v_portal_account IN 
      SELECT bpa.*, pp.portal_name
      FROM builder_portal_accounts bpa
      JOIN partner_portals pp ON pp.id = bpa.portal_id
      WHERE bpa.builder_id = NEW.builder_id
      AND bpa.is_active = true
      AND bpa.auto_sync_enabled = true
      AND bpa.connection_status = 'active'
      AND (bpa.listings_quota IS NULL OR bpa.listings_used < bpa.listings_quota)
    LOOP
      
      -- Create syndication record
      INSERT INTO syndicated_listings (
        property_id,
        portal_account_id,
        portal_id,
        status,
        sync_type
      ) VALUES (
        NEW.id,
        v_portal_account.id,
        v_portal_account.portal_id,
        'pending',
        'create'
      );
      
      -- Queue sync job (if automation_queue table exists)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_queue') THEN
        INSERT INTO automation_queue (
          job_type,
          job_data,
          status,
          priority,
          scheduled_for
        ) VALUES (
          'sync_to_portal',
          jsonb_build_object(
            'property_id', NEW.id,
            'portal_account_id', v_portal_account.id,
            'portal_name', v_portal_account.portal_name,
            'sync_type', 'create'
          ),
          'pending',
          'high',
          CASE 
            WHEN v_portal_account.sync_frequency = 'immediate' THEN NOW()
            WHEN v_portal_account.sync_frequency = 'hourly' THEN NOW() + INTERVAL '1 hour'
            ELSE NOW() + INTERVAL '1 day'
          END
        );
      END IF;
      
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS auto_syndicate_to_portals ON properties;

-- Create trigger
CREATE TRIGGER auto_syndicate_to_portals
AFTER INSERT OR UPDATE OF status, is_verified ON properties
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION trigger_partner_syndication();

-- Function to update syndication when property is updated
CREATE OR REPLACE FUNCTION trigger_update_syndication()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing syndications
  UPDATE syndicated_listings
  SET 
    status = 'pending',
    sync_type = 'update',
    queued_at = NOW()
  WHERE property_id = NEW.id
  AND status = 'synced';
  
  -- Queue update jobs (if automation_queue exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_queue') THEN
    INSERT INTO automation_queue (
      job_type,
      job_data,
      status,
      priority
    )
    SELECT 
      'sync_to_portal',
      jsonb_build_object(
        'property_id', NEW.id,
        'portal_account_id', sl.portal_account_id,
        'syndicated_listing_id', sl.id,
        'sync_type', 'update'
      ),
      'pending',
      'medium'
    FROM syndicated_listings sl
    WHERE sl.property_id = NEW.id
    AND sl.status = 'pending'
    AND sl.sync_type = 'update';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS auto_update_syndication ON properties;

-- Create trigger
CREATE TRIGGER auto_update_syndication
AFTER UPDATE OF price, title, description, status ON properties
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION trigger_update_syndication();

-- ==============================================
-- RLS POLICIES
-- ==============================================
-- Partner Portals (read-only for all authenticated users)
ALTER TABLE partner_portals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view partner portals" ON partner_portals;
CREATE POLICY "Anyone can view partner portals"
  ON partner_portals
  FOR SELECT
  USING (true);

-- Builder Portal Accounts
ALTER TABLE builder_portal_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can manage their portal accounts" ON builder_portal_accounts;
CREATE POLICY "Builders can manage their portal accounts"
  ON builder_portal_accounts
  FOR ALL
  USING (auth.uid() = builder_id);

-- Syndicated Listings
ALTER TABLE syndicated_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their syndicated listings" ON syndicated_listings;
CREATE POLICY "Builders can view their syndicated listings"
  ON syndicated_listings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = syndicated_listings.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Syndication Logs
ALTER TABLE syndication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their syndication logs" ON syndication_logs;
CREATE POLICY "Builders can view their syndication logs"
  ON syndication_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM syndicated_listings sl
      JOIN properties p ON p.id = sl.property_id
      WHERE sl.id = syndication_logs.syndicated_listing_id
      AND p.builder_id = auth.uid()
    )
  );

-- Portal Field Mappings (read-only for all)
ALTER TABLE portal_field_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view field mappings" ON portal_field_mappings;
CREATE POLICY "Anyone can view field mappings"
  ON portal_field_mappings
  FOR SELECT
  USING (true);







