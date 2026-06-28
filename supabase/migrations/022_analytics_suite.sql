-- =====================================================
-- COMPREHENSIVE ANALYTICS SUITE
-- Migration: 022_analytics_suite.sql
-- Created: 2025-01-04
-- Description: Full analytics system with platform metrics, revenue tracking, user events, funnels, and A/B testing
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PLATFORM METRICS TABLE (Daily snapshots)
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Date
    metric_date DATE NOT NULL UNIQUE,
    
    -- User Metrics
    total_builders INTEGER DEFAULT 0,
    new_builders INTEGER DEFAULT 0,
    active_builders INTEGER DEFAULT 0,
    churned_builders INTEGER DEFAULT 0,
    
    total_buyers INTEGER DEFAULT 0,
    new_buyers INTEGER DEFAULT 0,
    active_buyers INTEGER DEFAULT 0,
    
    -- Property Metrics
    total_properties INTEGER DEFAULT 0,
    new_properties INTEGER DEFAULT 0,
    available_properties INTEGER DEFAULT 0,
    sold_properties INTEGER DEFAULT 0,
    
    -- Lead Metrics
    total_leads INTEGER DEFAULT 0,
    new_leads INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    converted_leads INTEGER DEFAULT 0,
    
    -- Revenue Metrics (in paise - smallest currency unit)
    mrr BIGINT DEFAULT 0, -- Monthly Recurring Revenue
    arr BIGINT DEFAULT 0, -- Annual Recurring Revenue
    new_revenue BIGINT DEFAULT 0,
    churned_revenue BIGINT DEFAULT 0,
    
    -- Engagement Metrics
    total_searches INTEGER DEFAULT 0,
    total_property_views INTEGER DEFAULT 0,
    total_site_visits INTEGER DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0, -- seconds
    
    -- Conversion Metrics
    search_to_view_rate DECIMAL(5,2),
    view_to_inquiry_rate DECIMAL(5,2),
    inquiry_to_visit_rate DECIMAL(5,2),
    visit_to_conversion_rate DECIMAL(5,2),
    
    -- Performance Metrics
    avg_page_load_time INTEGER DEFAULT 0, -- milliseconds
    error_rate DECIMAL(5,2),
    uptime_percentage DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REVENUE METRICS TABLE (Detailed tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS revenue_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Revenue (in paise)
    gross_revenue BIGINT DEFAULT 0,
    net_revenue BIGINT DEFAULT 0,
    refunds BIGINT DEFAULT 0,
    
    -- Subscriptions
    new_subscriptions INTEGER DEFAULT 0,
    renewed_subscriptions INTEGER DEFAULT 0,
    cancelled_subscriptions INTEGER DEFAULT 0,
    upgraded_subscriptions INTEGER DEFAULT 0,
    downgraded_subscriptions INTEGER DEFAULT 0,
    
    -- Plan Breakdown
    revenue_by_plan JSONB DEFAULT '{}'::jsonb, -- {basic: 50000, pro: 150000, enterprise: 200000}
    
    -- Customer Metrics
    new_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    
    -- Lifetime Value
    avg_ltv BIGINT DEFAULT 0,
    avg_cac BIGINT DEFAULT 0, -- Customer Acquisition Cost
    ltv_cac_ratio DECIMAL(5,2),
    
    -- Churn
    churn_rate DECIMAL(5,2),
    revenue_churn_rate DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(period_start, period_end, period_type)
);

-- =====================================================
-- USER BEHAVIOR TABLE (Event tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event
    event_name TEXT NOT NULL,
    event_category TEXT CHECK (event_category IN (
        'page_view', 'search', 'property_interaction', 
        'lead_action', 'payment', 'account'
    )),
    
    -- Properties
    event_properties JSONB DEFAULT '{}'::jsonb,
    
    -- Session
    session_id TEXT,
    
    -- Device
    device_type TEXT,
    browser TEXT,
    os TEXT,
    
    -- Location
    city TEXT,
    country TEXT,
    
    -- Timing
    duration INTEGER, -- milliseconds
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONVERSION FUNNEL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversion_funnels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Funnel Type
    funnel_type TEXT CHECK (funnel_type IN ('buyer', 'builder', 'payment')),
    
    -- Date
    funnel_date DATE NOT NULL,
    
    -- Steps (as counts)
    step_1_count INTEGER DEFAULT 0, -- e.g., Page visit
    step_2_count INTEGER DEFAULT 0, -- e.g., Search
    step_3_count INTEGER DEFAULT 0, -- e.g., View property
    step_4_count INTEGER DEFAULT 0, -- e.g., Inquiry
    step_5_count INTEGER DEFAULT 0, -- e.g., Conversion
    
    -- Drop-off rates
    drop_off_1_2 DECIMAL(5,2),
    drop_off_2_3 DECIMAL(5,2),
    drop_off_3_4 DECIMAL(5,2),
    drop_off_4_5 DECIMAL(5,2),
    
    -- Overall
    overall_conversion_rate DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(funnel_type, funnel_date)
);

-- =====================================================
-- A/B TEST RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Test Details
    test_name TEXT NOT NULL,
    test_description TEXT,
    
    -- Variants
    variant_a_name TEXT DEFAULT 'Control',
    variant_b_name TEXT DEFAULT 'Test',
    
    -- Metrics
    variant_a_users INTEGER DEFAULT 0,
    variant_b_users INTEGER DEFAULT 0,
    
    variant_a_conversions INTEGER DEFAULT 0,
    variant_b_conversions INTEGER DEFAULT 0,
    
    variant_a_revenue BIGINT DEFAULT 0,
    variant_b_revenue BIGINT DEFAULT 0,
    
    -- Results
    conversion_rate_a DECIMAL(5,2),
    conversion_rate_b DECIMAL(5,2),
    improvement_percentage DECIMAL(5,2),
    statistical_significance DECIMAL(5,2),
    
    -- Status
    test_status TEXT CHECK (test_status IN ('running', 'completed', 'cancelled')),
    winner TEXT CHECK (winner IN ('variant_a', 'variant_b', 'inconclusive', NULL)),
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON platform_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_period ON revenue_metrics(period_start DESC, period_type);
CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_category ON user_events(event_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_type_date ON conversion_funnels(funnel_type, funnel_date DESC);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_test_results(test_status);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Only admins can view platform metrics
CREATE POLICY "Platform metrics viewable by admins"
    ON platform_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can insert/update platform metrics
CREATE POLICY "Platform metrics modifiable by admins"
    ON platform_metrics FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can view revenue metrics
CREATE POLICY "Revenue metrics viewable by admins"
    ON revenue_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can view their own events
CREATE POLICY "Users can view own events"
    ON user_events FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Anyone can insert events (for tracking)
CREATE POLICY "Anyone can insert events"
    ON user_events FOR INSERT
    WITH CHECK (true);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
    ON user_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can view conversion funnels
CREATE POLICY "Conversion funnels viewable by admins"
    ON conversion_funnels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can view A/B test results
CREATE POLICY "AB test results viewable by admins"
    ON ab_test_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate MRR (Updated to use new single-tier pricing)
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS BIGINT AS $$
DECLARE
    v_mrr BIGINT;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN bs.billing_cycle = 'monthly' THEN bs.current_price
            WHEN bs.billing_cycle = 'yearly' THEN (bs.current_price / 12)
            ELSE 0
        END
    ), 0) INTO v_mrr
    FROM builder_subscriptions bs
    WHERE bs.status = 'active' AND bs.is_trial = false;
    
    RETURN v_mrr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate churn rate (Updated to use new single-tier pricing)
CREATE OR REPLACE FUNCTION calculate_churn_rate(
    p_period_days INTEGER DEFAULT 30
)
RETURNS DECIMAL AS $$
DECLARE
    v_start_count INTEGER;
    v_churned_count INTEGER;
    v_churn_rate DECIMAL;
BEGIN
    -- Count active subscriptions at start of period
    SELECT COUNT(*) INTO v_start_count
    FROM builder_subscriptions
    WHERE status = 'active' AND is_trial = false
    AND current_period_start <= NOW() - (p_period_days || ' days')::INTERVAL;
    
    -- Count subscriptions that churned during period
    SELECT COUNT(*) INTO v_churned_count
    FROM builder_subscriptions
    WHERE status = 'cancelled'
    AND updated_at >= NOW() - (p_period_days || ' days')::INTERVAL
    AND updated_at <= NOW();
    
    IF v_start_count > 0 THEN
        v_churn_rate := (v_churned_count::DECIMAL / v_start_count::DECIMAL) * 100;
    ELSE
        v_churn_rate := 0;
    END IF;
    
    RETURN ROUND(v_churn_rate, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track user event
CREATE OR REPLACE FUNCTION track_event(
    p_event_name TEXT,
    p_event_category TEXT,
    p_properties JSONB DEFAULT '{}'::jsonb,
    p_session_id TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_browser TEXT DEFAULT NULL,
    p_os TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO user_events (
        user_id,
        event_name,
        event_category,
        event_properties,
        session_id,
        device_type,
        browser,
        os,
        city,
        country
    ) VALUES (
        p_user_id,
        p_event_name,
        p_event_category,
        p_properties,
        p_session_id,
        p_device_type,
        p_browser,
        p_os,
        p_city,
        p_country
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update platform metrics (daily snapshot)
CREATE OR REPLACE FUNCTION update_platform_metrics()
RETURNS void AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_total_builders INTEGER;
    v_new_builders INTEGER;
    v_active_builders INTEGER;
    v_total_buyers INTEGER;
    v_new_buyers INTEGER;
    v_total_properties INTEGER;
    v_new_properties INTEGER;
    v_total_leads INTEGER;
    v_new_leads INTEGER;
BEGIN
    -- Count builders
    SELECT COUNT(DISTINCT user_id) INTO v_total_builders
    FROM user_roles WHERE role = 'builder';
    
    SELECT COUNT(DISTINCT user_id) INTO v_new_builders
    FROM user_roles 
    WHERE role = 'builder' 
    AND DATE(created_at) = v_today;
    
    -- Count buyers
    SELECT COUNT(DISTINCT user_id) INTO v_total_buyers
    FROM user_roles WHERE role = 'buyer';
    
    SELECT COUNT(DISTINCT user_id) INTO v_new_buyers
    FROM user_roles 
    WHERE role = 'buyer' 
    AND DATE(created_at) = v_today;
    
    -- Count properties
    SELECT COUNT(*) INTO v_total_properties FROM properties;
    
    SELECT COUNT(*) INTO v_new_properties
    FROM properties WHERE DATE(created_at) = v_today;
    
    -- Count leads
    SELECT COUNT(*) INTO v_total_leads FROM leads;
    
    SELECT COUNT(*) INTO v_new_leads
    FROM leads WHERE DATE(created_at) = v_today;
    
    -- Insert or update metrics for today
    INSERT INTO platform_metrics (
        metric_date,
        total_builders,
        new_builders,
        total_buyers,
        new_buyers,
        total_properties,
        new_properties,
        total_leads,
        new_leads,
        mrr
    ) VALUES (
        v_today,
        v_total_builders,
        v_new_builders,
        v_total_buyers,
        v_new_buyers,
        v_total_properties,
        v_new_properties,
        v_total_leads,
        v_new_leads,
        calculate_mrr()
    )
    ON CONFLICT (metric_date) 
    DO UPDATE SET
        total_builders = EXCLUDED.total_builders,
        new_builders = EXCLUDED.new_builders,
        total_buyers = EXCLUDED.total_buyers,
        new_buyers = EXCLUDED.new_buyers,
        total_properties = EXCLUDED.total_properties,
        new_properties = EXCLUDED.new_properties,
        total_leads = EXCLUDED.total_leads,
        new_leads = EXCLUDED.new_leads,
        mrr = EXCLUDED.mrr,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_metrics_updated_at
    BEFORE UPDATE ON platform_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE platform_metrics IS 'Daily snapshots of platform-wide metrics';
COMMENT ON TABLE revenue_metrics IS 'Detailed revenue tracking by period';
COMMENT ON TABLE user_events IS 'Event tracking for user behavior analytics';
COMMENT ON TABLE conversion_funnels IS 'Conversion funnel analysis by type';
COMMENT ON TABLE ab_test_results IS 'A/B test results and statistical analysis';

