-- =====================================================
-- COMPREHENSIVE RERA VERIFICATION SYSTEM
-- Real Estate (Regulation and Development) Act, 2016
-- =====================================================

-- =====================================================
-- EXTEND EXISTING RERA REGISTRATIONS TABLE
-- =====================================================

-- Add missing columns to existing rera_registrations table
DO $$ 
BEGIN
    -- Property Link
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'property_id') THEN
        ALTER TABLE rera_registrations ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE CASCADE;
    END IF;
    
    -- Project Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'project_name') THEN
        ALTER TABLE rera_registrations ADD COLUMN project_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'project_type') THEN
        ALTER TABLE rera_registrations ADD COLUMN project_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'promoter_pan') THEN
        ALTER TABLE rera_registrations ADD COLUMN promoter_pan TEXT;
    END IF;
    
    -- Location Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'project_address') THEN
        ALTER TABLE rera_registrations ADD COLUMN project_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'district') THEN
        ALTER TABLE rera_registrations ADD COLUMN district TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'taluk') THEN
        ALTER TABLE rera_registrations ADD COLUMN taluk TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'village') THEN
        ALTER TABLE rera_registrations ADD COLUMN village TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'survey_numbers') THEN
        ALTER TABLE rera_registrations ADD COLUMN survey_numbers TEXT[];
    END IF;
    
    -- Status field (map to existing verification_status)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'status') THEN
        ALTER TABLE rera_registrations ADD COLUMN status TEXT CHECK (status IN ('active', 'expired', 'suspended', 'cancelled', 'pending'));
    END IF;
    
    -- Project Specifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'total_area_sqm') THEN
        ALTER TABLE rera_registrations ADD COLUMN total_area_sqm DECIMAL(12,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'total_units') THEN
        ALTER TABLE rera_registrations ADD COLUMN total_units INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'residential_units') THEN
        ALTER TABLE rera_registrations ADD COLUMN residential_units INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'commercial_units') THEN
        ALTER TABLE rera_registrations ADD COLUMN commercial_units INTEGER;
    END IF;
    
    -- Financial Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'project_cost') THEN
        ALTER TABLE rera_registrations ADD COLUMN project_cost BIGINT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'sanctioned_plan_approval') THEN
        ALTER TABLE rera_registrations ADD COLUMN sanctioned_plan_approval TEXT;
    END IF;
    
    -- Verification Status (enhanced)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'verified') THEN
        ALTER TABLE rera_registrations ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'last_verified_at') THEN
        ALTER TABLE rera_registrations ADD COLUMN last_verified_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'verification_attempts') THEN
        ALTER TABLE rera_registrations ADD COLUMN verification_attempts INTEGER DEFAULT 0;
    END IF;
    
    -- Documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'sanctioned_plan_url') THEN
        ALTER TABLE rera_registrations ADD COLUMN sanctioned_plan_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'layout_plan_url') THEN
        ALTER TABLE rera_registrations ADD COLUMN layout_plan_url TEXT;
    END IF;
    
    -- Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'raw_data') THEN
        ALTER TABLE rera_registrations ADD COLUMN raw_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_registrations' AND column_name = 'notes') THEN
        ALTER TABLE rera_registrations ADD COLUMN notes TEXT;
    END IF;
END $$;

-- =====================================================
-- RERA VERIFICATION LOGS (Enhanced)
-- =====================================================
-- Note: rera_verification_logs table already exists, we'll add missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rera_verification_logs') THEN
        CREATE TABLE rera_verification_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            rera_registration_id UUID REFERENCES rera_registrations(id) ON DELETE CASCADE,
            rera_number TEXT NOT NULL,
            verification_type TEXT CHECK (verification_type IN ('auto', 'manual', 'api', 'scraper')),
            verification_status TEXT CHECK (verification_status IN ('success', 'failed', 'error')),
            found BOOLEAN DEFAULT false,
            status_on_portal TEXT,
            expiry_status TEXT CHECK (expiry_status IN ('valid', 'expiring_soon', 'expired')),
            api_response JSONB,
            error_message TEXT,
            response_time_ms INTEGER,
            verified_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Add missing columns if table exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'verification_type') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN verification_type TEXT CHECK (verification_type IN ('auto', 'manual', 'api', 'scraper'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'verification_status') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN verification_status TEXT CHECK (verification_status IN ('success', 'failed', 'error'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'found') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN found BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'status_on_portal') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN status_on_portal TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'expiry_status') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN expiry_status TEXT CHECK (expiry_status IN ('valid', 'expiring_soon', 'expired'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'api_response') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN api_response JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'response_time_ms') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN response_time_ms INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'verified_at') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN verified_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rera_verification_logs' AND column_name = 'rera_number') THEN
            ALTER TABLE rera_verification_logs ADD COLUMN rera_number TEXT;
        END IF;
    END IF;
END $$;

-- =====================================================
-- RERA ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rera_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    rera_registration_id UUID REFERENCES rera_registrations(id) ON DELETE CASCADE,
    builder_id UUID REFERENCES builder_profiles(id) ON DELETE CASCADE,
    
    -- Alert Details
    alert_type TEXT CHECK (alert_type IN (
        'expiry_warning', 'expired', 'suspended', 
        'cancelled', 'verification_failed', 'status_changed'
    )),
    alert_priority TEXT CHECK (alert_priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Message
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_required TEXT,
    
    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RERA STATE CONFIGURATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS rera_state_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    state_code TEXT UNIQUE NOT NULL, -- 'TN', 'KA', 'MH', etc.
    state_name TEXT NOT NULL,
    
    -- API Configuration
    api_enabled BOOLEAN DEFAULT false,
    api_url TEXT,
    api_key TEXT,
    api_type TEXT, -- 'rest', 'soap', 'graphql', 'scraper'
    
    -- Endpoints
    verification_endpoint TEXT,
    search_endpoint TEXT,
    details_endpoint TEXT,
    
    -- Rate Limits
    rate_limit_per_hour INTEGER DEFAULT 100,
    rate_limit_per_day INTEGER DEFAULT 1000,
    
    -- Status
    active BOOLEAN DEFAULT true,
    last_health_check TIMESTAMPTZ,
    health_status TEXT CHECK (health_status IN ('healthy', 'degraded', 'down')),
    
    -- Metadata
    notes TEXT,
    documentation_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_rera_registrations_property ON rera_registrations(property_id);
CREATE INDEX IF NOT EXISTS idx_rera_registrations_builder ON rera_registrations(builder_id);
CREATE INDEX IF NOT EXISTS idx_rera_registrations_number ON rera_registrations(rera_number);
CREATE INDEX IF NOT EXISTS idx_rera_registrations_state ON rera_registrations(rera_state);
CREATE INDEX IF NOT EXISTS idx_rera_registrations_status ON rera_registrations(status);
CREATE INDEX IF NOT EXISTS idx_rera_registrations_expiry ON rera_registrations(expiry_date);
CREATE INDEX IF NOT EXISTS idx_rera_registrations_verified ON rera_registrations(verified);
CREATE INDEX IF NOT EXISTS idx_rera_verification_logs_rera ON rera_verification_logs(rera_registration_id);
CREATE INDEX IF NOT EXISTS idx_rera_verification_logs_at ON rera_verification_logs(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_rera_alerts_builder ON rera_alerts(builder_id, read);
CREATE INDEX IF NOT EXISTS idx_rera_alerts_type ON rera_alerts(alert_type, resolved);
CREATE INDEX IF NOT EXISTS idx_rera_alerts_priority ON rera_alerts(alert_priority, created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE rera_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rera_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rera_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rera_state_configs ENABLE ROW LEVEL SECURITY;

-- Builders can view their own RERA registrations
DROP POLICY IF EXISTS "Builders view own RERA registrations" ON rera_registrations;
CREATE POLICY "Builders view own RERA registrations"
    ON rera_registrations FOR SELECT
    USING (
        builder_id IN (
            SELECT id FROM builder_profiles WHERE user_id = auth.uid()
        )
    );

-- Builders can insert RERA registrations
DROP POLICY IF EXISTS "Builders insert RERA registrations" ON rera_registrations;
CREATE POLICY "Builders insert RERA registrations"
    ON rera_registrations FOR INSERT
    WITH CHECK (
        builder_id IN (
            SELECT id FROM builder_profiles WHERE user_id = auth.uid()
        )
    );

-- Builders can update their own RERA registrations
DROP POLICY IF EXISTS "Builders update own RERA registrations" ON rera_registrations;
CREATE POLICY "Builders update own RERA registrations"
    ON rera_registrations FOR UPDATE
    USING (
        builder_id IN (
            SELECT id FROM builder_profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        builder_id IN (
            SELECT id FROM builder_profiles WHERE user_id = auth.uid()
        )
    );

-- Public can view verified RERA registrations
DROP POLICY IF EXISTS "Public view verified RERA" ON rera_registrations;
CREATE POLICY "Public view verified RERA"
    ON rera_registrations FOR SELECT
    USING (verified = true OR (verification_status = 'verified' AND is_active = true));

-- Builders can view their alerts
DROP POLICY IF EXISTS "Builders view own alerts" ON rera_alerts;
CREATE POLICY "Builders view own alerts"
    ON rera_alerts FOR SELECT
    USING (
        builder_id IN (
            SELECT id FROM builder_profiles WHERE user_id = auth.uid()
        )
    );

-- Builders can update their alerts
DROP POLICY IF EXISTS "Builders update own alerts" ON rera_alerts;
CREATE POLICY "Builders update own alerts"
    ON rera_alerts FOR UPDATE
    USING (
        builder_id IN (
            SELECT id FROM builder_profiles WHERE user_id = auth.uid()
        )
    );

-- Anyone can view state configs
DROP POLICY IF EXISTS "Public view state configs" ON rera_state_configs;
CREATE POLICY "Public view state configs"
    ON rera_state_configs FOR SELECT
    USING (active = true);

-- Service role can manage verification logs
DROP POLICY IF EXISTS "Service role manage verification logs" ON rera_verification_logs;
CREATE POLICY "Service role manage verification logs"
    ON rera_verification_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Builders can view logs for their RERA registrations
DROP POLICY IF EXISTS "Builders view own verification logs" ON rera_verification_logs;
CREATE POLICY "Builders view own verification logs"
    ON rera_verification_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rera_registrations r
            JOIN builder_profiles bp ON r.builder_id = bp.id
            WHERE r.id = rera_verification_logs.rera_registration_id
            AND bp.user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check RERA expiry
CREATE OR REPLACE FUNCTION check_rera_expiry()
RETURNS void AS $$
BEGIN
    -- Update status for expired RERA
    UPDATE rera_registrations
    SET status = 'expired', verification_status = 'expired', is_active = false
    WHERE expiry_date < CURRENT_DATE
    AND (status = 'active' OR (verification_status = 'verified' AND is_active = true));
    
    -- Create alerts for expiring RERA (30 days warning)
    INSERT INTO rera_alerts (
        rera_registration_id,
        builder_id,
        alert_type,
        alert_priority,
        title,
        message,
        action_required
    )
    SELECT 
        r.id,
        r.builder_id,
        'expiry_warning',
        CASE 
            WHEN r.expiry_date - CURRENT_DATE <= 7 THEN 'critical'
            WHEN r.expiry_date - CURRENT_DATE <= 15 THEN 'high'
            ELSE 'medium'
        END,
        'RERA Expiring Soon',
        'RERA registration ' || r.rera_number || ' expires on ' || r.expiry_date,
        'Renew RERA registration immediately'
    FROM rera_registrations r
    WHERE r.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
    AND (r.status = 'active' OR (r.verification_status = 'verified' AND r.is_active = true))
    AND NOT EXISTS (
        SELECT 1 FROM rera_alerts a
        WHERE a.rera_registration_id = r.id
        AND a.alert_type = 'expiry_warning'
        AND a.created_at > CURRENT_DATE - INTERVAL '7 days'
        AND a.resolved = false
    );
END;
$$ LANGUAGE plpgsql;

-- Function to verify RERA number format
CREATE OR REPLACE FUNCTION validate_rera_number(
    p_rera_number TEXT,
    p_state TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Tamil Nadu RERA format: TN/01/Building/0001/2016
    IF p_state = 'tamil_nadu' OR p_state = 'TN' THEN
        RETURN p_rera_number ~ '^TN/[0-9]{2}/(Building|Layout|Plot)/[0-9]{4}/[0-9]{4}$';
    END IF;
    
    -- Karnataka RERA format: PRM/KA/RERA/1234/2017
    IF p_state = 'karnataka' OR p_state = 'KA' THEN
        RETURN p_rera_number ~ '^PRM/KA/RERA/[0-9]+/[0-9]{4}$';
    END IF;
    
    -- Maharashtra RERA format: P51700000001
    IF p_state = 'maharashtra' OR p_state = 'MH' THEN
        RETURN p_rera_number ~ '^P[0-9]{11}$';
    END IF;
    
    -- Default: accept any alphanumeric with slashes
    RETURN p_rera_number ~ '^[A-Za-z0-9/\\-]+$';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate RERA score (0-100)
CREATE OR REPLACE FUNCTION calculate_rera_score(p_rera_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_rera RECORD;
BEGIN
    SELECT * INTO v_rera FROM rera_registrations WHERE id = p_rera_id;
    
    IF NOT FOUND THEN RETURN 0; END IF;
    
    -- Base score for verified
    IF COALESCE(v_rera.verified, false) OR v_rera.verification_status = 'verified' THEN 
        v_score := v_score + 40; 
    END IF;
    
    -- Status score
    IF v_rera.status IS NOT NULL THEN
        CASE v_rera.status
            WHEN 'active' THEN v_score := v_score + 30;
            WHEN 'expired' THEN v_score := v_score + 0;
            WHEN 'suspended' THEN v_score := v_score + 10;
            ELSE v_score := v_score + 5;
        END CASE;
    ELSIF v_rera.verification_status = 'verified' AND v_rera.is_active = true THEN
        v_score := v_score + 30;
    END IF;
    
    -- Expiry score (time remaining)
    IF v_rera.expiry_date > CURRENT_DATE + 365 THEN
        v_score := v_score + 20;
    ELSIF v_rera.expiry_date > CURRENT_DATE + 180 THEN
        v_score := v_score + 15;
    ELSIF v_rera.expiry_date > CURRENT_DATE + 90 THEN
        v_score := v_score + 10;
    ELSIF v_rera.expiry_date > CURRENT_DATE THEN
        v_score := v_score + 5;
    END IF;
    
    -- Recent verification score
    IF v_rera.last_verified_at > NOW() - INTERVAL '7 days' THEN
        v_score := v_score + 10;
    ELSIF v_rera.last_verified_at > NOW() - INTERVAL '30 days' THEN
        v_score := v_score + 5;
    END IF;
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rera_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rera_updated_at ON rera_registrations;
CREATE TRIGGER trigger_rera_updated_at
    BEFORE UPDATE ON rera_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_rera_updated_at();

DROP TRIGGER IF EXISTS trigger_rera_state_configs_updated_at ON rera_state_configs;
CREATE TRIGGER trigger_rera_state_configs_updated_at
    BEFORE UPDATE ON rera_state_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_rera_updated_at();

-- =====================================================
-- INITIAL STATE CONFIGURATIONS
-- =====================================================
INSERT INTO rera_state_configs (state_code, state_name, api_enabled, api_type, active, notes)
VALUES 
    ('TN', 'Tamil Nadu', false, 'scraper', true, 'TN RERA Portal: https://www.tn-rera.in/'),
    ('KA', 'Karnataka', false, 'scraper', true, 'Karnataka RERA Portal: https://rera.karnataka.gov.in/'),
    ('MH', 'Maharashtra', false, 'scraper', true, 'Maharashtra RERA Portal: https://maharera.mahaonline.gov.in/'),
    ('DL', 'Delhi', false, 'scraper', true, 'Delhi RERA Portal: https://rera.delhi.gov.in/'),
    ('GJ', 'Gujarat', false, 'scraper', true, 'Gujarat RERA Portal: https://gujrera.gujarat.gov.in/')
ON CONFLICT (state_code) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE rera_registrations IS 'Comprehensive RERA registration records with verification status';
COMMENT ON TABLE rera_verification_logs IS 'Logs of all RERA verification attempts';
COMMENT ON TABLE rera_alerts IS 'Alerts for RERA expiry, status changes, and compliance issues';
COMMENT ON TABLE rera_state_configs IS 'Configuration for different state RERA portals';

