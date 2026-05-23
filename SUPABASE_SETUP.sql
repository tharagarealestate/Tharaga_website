-- ===========================================
-- THARAGA COMPREHENSIVE DATABASE SCHEMA
-- Enterprise-Grade Real Estate Platform
-- Run this in Supabase SQL Editor
-- ===========================================

-- ===========================================
-- 1. LEAD MANAGEMENT SYSTEM
-- ===========================================

-- Lead tiers enum
CREATE TYPE lead_tier AS ENUM ('lion', 'monkey', 'dog');

-- Lead status enum
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost', 'nurturing');

-- Lead source enum
CREATE TYPE lead_source AS ENUM ('web', 'meta', 'google', 'whatsapp', 'referral', 'direct', 'organic');

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    alternate_phone text,
    
    -- Lead Intelligence
    source lead_source NOT NULL DEFAULT 'web',
    score int CHECK (score >= 0 AND score <= 100),
    tier lead_tier,
    status lead_status DEFAULT 'new',
    
    -- Requirements
    budget_min numeric,
    budget_max numeric,
    property_type text,
    bedrooms int,
    preferred_localities text[], -- Array of localities
    timeline text, -- immediate, 1-3months, 3-6months, 6-12months
    
    -- Qualification Data (from AI)
    is_qualified boolean DEFAULT false,
    qualification_data jsonb, -- Stores AI conversation and responses
    qualification_completed_at timestamptz,
    
    -- Attribution & Tracking
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    landing_page text,
    referrer text,
    ip_address inet,
    user_agent text,
    
    -- Assignment
    assigned_to uuid REFERENCES auth.users(id),
    assigned_at timestamptz,
    
    -- Meta
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_activity_at timestamptz,
    
    -- Indexes
    CONSTRAINT leads_email_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_tier ON leads(tier);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);

-- Lead scoring history
CREATE TABLE IF NOT EXISTS lead_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    score int NOT NULL CHECK (score >= 0 AND score <= 100),
    tier lead_tier NOT NULL,
    factors jsonb, -- Stores scoring factors breakdown
    model_version text DEFAULT 'v1',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lead_scores_lead_id ON lead_scores(lead_id);

-- Lead activities (interaction timeline)
CREATE TABLE IF NOT EXISTS lead_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    activity_type text NOT NULL, -- call, email, whatsapp, meeting, property_view, etc.
    description text,
    performed_by uuid REFERENCES auth.users(id),
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Lead assignments (distribution tracking)
CREATE TABLE IF NOT EXISTS lead_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    assigned_from uuid REFERENCES auth.users(id),
    assigned_to uuid REFERENCES auth.users(id) NOT NULL,
    reason text,
    sla_minutes int, -- Expected response time
    responded_at timestamptz,
    sla_met boolean,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_assigned_to ON lead_assignments(assigned_to);

-- ===========================================
-- 2. SALES TEAM MANAGEMENT
-- ===========================================

CREATE TYPE sales_role AS ENUM ('admin', 'senior', 'junior', 'channel_partner');
CREATE TYPE team_member_status AS ENUM ('active', 'inactive', 'on_leave');

CREATE TABLE IF NOT EXISTS sales_team (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    role sales_role DEFAULT 'junior',
    status team_member_status DEFAULT 'active',
    
    -- Performance tracking
    leads_assigned int DEFAULT 0,
    leads_converted int DEFAULT 0,
    conversion_rate numeric GENERATED ALWAYS AS (
        CASE WHEN leads_assigned > 0 THEN (leads_converted::numeric / leads_assigned) * 100 ELSE 0 END
    ) STORED,
    
    -- Capacity management
    max_concurrent_leads int DEFAULT 10,
    current_leads int DEFAULT 0,
    
    -- Metadata
    joined_at timestamptz DEFAULT now(),
    last_active_at timestamptz,
    metadata jsonb
);

CREATE INDEX idx_sales_team_role ON sales_team(role);
CREATE INDEX idx_sales_team_status ON sales_team(status);

-- ===========================================
-- 3. BUILDER ENHANCEMENTS
-- ===========================================

ALTER TABLE builders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS rera_id text UNIQUE;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE builders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE builders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_builders_user_id ON builders(user_id);
CREATE INDEX IF NOT EXISTS idx_builders_rera_id ON builders(rera_id);

-- Builder analytics
CREATE TABLE IF NOT EXISTS builder_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    builder_id uuid REFERENCES builders(id) ON DELETE CASCADE,
    
    -- Daily metrics
    date date NOT NULL,
    
    -- Lead metrics
    leads_received int DEFAULT 0,
    lion_leads int DEFAULT 0,
    monkey_leads int DEFAULT 0,
    dog_leads int DEFAULT 0,
    leads_contacted int DEFAULT 0,
    leads_converted int DEFAULT 0,
    
    -- Pipeline
    pipeline_value numeric DEFAULT 0,
    
    -- Response metrics
    avg_response_time_minutes numeric,
    sla_met_percentage numeric,
    
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(builder_id, date)
);

CREATE INDEX idx_builder_analytics_builder_id ON builder_analytics(builder_id);
CREATE INDEX idx_builder_analytics_date ON builder_analytics(date DESC);

-- ===========================================
-- 4. PROPERTY ENHANCEMENTS
-- ===========================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnishing text; -- furnished, semi-furnished, unfurnished
ALTER TABLE properties ADD COLUMN IF NOT EXISTS age_years int;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS facing text; -- north, south, east, west
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_number int;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors int;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking int;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS balconies int;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rera_id text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_rera_verified boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images text[]; -- Array of image URLs
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS virtual_tour_url text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ai_score int CHECK (ai_score >= 0 AND ai_score <= 100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ai_score_factors jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS favorite_count int DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_count int DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_properties_ai_score ON properties(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_city_locality ON properties(city, locality);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_inr);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Property analytics (market data)
CREATE TABLE IF NOT EXISTS property_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Daily metrics
    date date NOT NULL,
    views int DEFAULT 0,
    favorites int DEFAULT 0,
    contacts int DEFAULT 0,
    shares int DEFAULT 0,
    
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(property_id, date)
);

CREATE INDEX idx_property_analytics_property_id ON property_analytics(property_id);
CREATE INDEX idx_property_analytics_date ON property_analytics(date DESC);

-- ===========================================
-- 5. LOCALITY INTELLIGENCE
-- ===========================================

CREATE TABLE IF NOT EXISTS locality_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city text NOT NULL,
    locality text NOT NULL,
    
    -- Market data
    avg_price_sqft numeric,
    price_trend_percentage numeric, -- YoY or MoM
    demand_level text, -- low, medium, high, very_high
    demand_change_percentage numeric,
    
    -- Supply metrics
    active_properties int DEFAULT 0,
    new_listings_month int DEFAULT 0,
    
    -- Infrastructure
    metro_stations_nearby int DEFAULT 0,
    schools_count int DEFAULT 0,
    hospitals_count int DEFAULT 0,
    malls_count int DEFAULT 0,
    
    -- Ratings
    connectivity_score int CHECK (connectivity_score >= 0 AND connectivity_score <= 100),
    safety_score int CHECK (safety_score >= 0 AND safety_score <= 100),
    lifestyle_score int CHECK (lifestyle_score >= 0 AND lifestyle_score <= 100),
    
    -- Metadata
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(city, locality)
);

CREATE INDEX idx_locality_insights_city ON locality_insights(city);
CREATE INDEX idx_locality_insights_demand ON locality_insights(demand_level);

-- ===========================================
-- 6. RERA VERIFICATION
-- ===========================================

CREATE TABLE IF NOT EXISTS rera_verification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rera_id text UNIQUE NOT NULL,
    
    -- Project details
    project_name text,
    promoter_name text,
    registration_date date,
    completion_date date,
    
    -- Status
    is_valid boolean DEFAULT true,
    verification_status text, -- verified, pending, invalid
    
    -- Verification metadata
    verified_at timestamptz,
    last_checked_at timestamptz,
    verification_source text,
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rera_verification_rera_id ON rera_verification(rera_id);

-- ===========================================
-- 7. WHATSAPP CONVERSATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    
    -- WhatsApp details
    phone text NOT NULL,
    wa_conversation_id text, -- WhatsApp conversation ID
    
    -- AI qualification
    is_qualification_complete boolean DEFAULT false,
    qualification_step int DEFAULT 0,
    total_steps int DEFAULT 6,
    
    -- Messages
    messages jsonb, -- Array of message objects
    
    -- Metadata
    started_at timestamptz DEFAULT now(),
    last_message_at timestamptz,
    completed_at timestamptz
);

CREATE INDEX idx_whatsapp_conversations_lead_id ON whatsapp_conversations(lead_id);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(phone);

-- ===========================================
-- 8. META CAPI TRACKING
-- ===========================================

CREATE TABLE IF NOT EXISTS meta_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Event details
    event_name text NOT NULL, -- Lead, ViewContent, InitiateCheckout, Purchase, etc.
    event_id text UNIQUE NOT NULL,
    event_time timestamptz NOT NULL,
    
    -- User data
    fbp text, -- Facebook browser pixel
    fbc text, -- Facebook click ID
    user_data jsonb,
    
    -- Custom data
    custom_data jsonb,
    
    -- Response
    fb_response jsonb,
    events_received int,
    events_dropped int,
    
    -- Status
    sent_to_meta boolean DEFAULT false,
    sent_at timestamptz,
    match_quality_score numeric,
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meta_events_lead_id ON meta_events(lead_id);
CREATE INDEX idx_meta_events_event_name ON meta_events(event_name);
CREATE INDEX idx_meta_events_event_time ON meta_events(event_time DESC);

-- ===========================================
-- 9. CRM SYNC (Zoho)
-- ===========================================

CREATE TABLE IF NOT EXISTS crm_sync_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sync details
    entity_type text NOT NULL, -- lead, contact, deal, etc.
    entity_id uuid NOT NULL, -- Reference to local entity
    crm_entity_id text, -- Zoho ID
    
    -- Operation
    operation text NOT NULL, -- create, update, delete
    sync_status text DEFAULT 'pending', -- pending, success, failed
    
    -- Request/Response
    request_payload jsonb,
    response_payload jsonb,
    error_message text,
    
    -- Metadata
    synced_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_sync_log_entity ON crm_sync_log(entity_type, entity_id);
CREATE INDEX idx_crm_sync_log_status ON crm_sync_log(sync_status);

-- ===========================================
-- 10. LIVE METRICS CACHE
-- ===========================================

CREATE TABLE IF NOT EXISTS live_metrics (
    id text PRIMARY KEY, -- unique key like 'dashboard_metrics'
    metrics jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- 11. FUNCTIONS & TRIGGERS
-- ===========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_builders_updated_at ON builders;
CREATE TRIGGER update_builders_updated_at BEFORE UPDATE ON builders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update last_activity_at for leads
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads SET last_activity_at = now() WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_lead_activity ON lead_activities;
CREATE TRIGGER trigger_lead_activity AFTER INSERT ON lead_activities
    FOR EACH ROW EXECUTE FUNCTION update_lead_last_activity();

-- ===========================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE builders ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE locality_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE rera_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_log ENABLE ROW LEVEL SECURITY;

-- Properties: Public read, authenticated write
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own properties" ON properties;
CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            builder_id IN (SELECT id FROM builders WHERE user_id = auth.uid())
        )
    );

-- Leads: Sales team can view assigned leads
DROP POLICY IF EXISTS "Sales team can view assigned leads" ON leads;
CREATE POLICY "Sales team can view assigned leads" ON leads
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            assigned_to = auth.uid() OR
            auth.uid() IN (SELECT id FROM sales_team WHERE role IN ('admin', 'senior'))
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create leads" ON leads;
CREATE POLICY "Authenticated users can create leads" ON leads
    FOR INSERT WITH CHECK (true); -- Allow lead capture from anywhere

-- Builders: Can view own data
DROP POLICY IF EXISTS "Builders can view own data" ON builders;
CREATE POLICY "Builders can view own data" ON builders
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Builders can update own data" ON builders;
CREATE POLICY "Builders can update own data" ON builders
    FOR UPDATE USING (user_id = auth.uid());

-- Locality insights: Public read
DROP POLICY IF EXISTS "Locality insights are public" ON locality_insights;
CREATE POLICY "Locality insights are public" ON locality_insights
    FOR SELECT USING (true);

-- RERA verification: Public read
DROP POLICY IF EXISTS "RERA data is public" ON rera_verification;
CREATE POLICY "RERA data is public" ON rera_verification
    FOR SELECT USING (true);

-- ===========================================
-- 13. SEED DATA FOR CHENNAI
-- ===========================================

-- Insert Chennai localities with market data
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
-- SUCCESS MESSAGE
-- ===========================================
-- Schema created successfully!
-- Next: Run backend API implementation
-- ===========================================
