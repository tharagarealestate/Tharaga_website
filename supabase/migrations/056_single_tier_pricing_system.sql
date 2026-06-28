-- =====================================================
-- SINGLE-TIER PRICING SYSTEM MIGRATION
-- Migration: 056_single_tier_pricing_system.sql
-- Created: 2025-01-XX
-- Description: Implements ₹4,999/month unlimited plan with 14-day free trial
-- =====================================================

-- Drop old pricing tables if they exist (we'll keep them for now but mark as deprecated)
-- We'll migrate data later if needed

-- =====================================================
-- SINGLE PLAN TABLE (Only One Plan!)
-- =====================================================
CREATE TABLE IF NOT EXISTS tharaga_plan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Plan Details
    plan_name TEXT DEFAULT 'Tharaga Pro' NOT NULL,
    plan_slug TEXT DEFAULT 'tharaga-pro' NOT NULL UNIQUE,
    
    -- Pricing (in paise - smallest currency unit)
    monthly_price BIGINT DEFAULT 499900 NOT NULL, -- ₹4,999 in paise
    yearly_price BIGINT DEFAULT 4999200 NOT NULL, -- ₹49,992 in paise (₹4,166/mo - 17% discount)
    trial_days INTEGER DEFAULT 14,
    
    -- Features (ALL features included - no limits!)
    features JSONB DEFAULT '{
        "properties": "unlimited",
        "leads": "unlimited",
        "team_members": "unlimited",
        "storage": "unlimited",
        "ai_scoring": true,
        "voice_search": true,
        "automation": true,
        "crm": true,
        "analytics": true,
        "rera_verification": true,
        "api_access": true,
        "white_label": true,
        "priority_support": true,
        "phone_support": true,
        "dedicated_manager": true,
        "custom_domain": true,
        "webhooks": true
    }'::jsonb,
    
    -- Display
    tagline TEXT DEFAULT 'Everything Unlimited. One Simple Price.',
    description TEXT DEFAULT 'Unlimited properties, AI-powered leads, full automation, and enterprise features',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the single plan
INSERT INTO tharaga_plan (
    plan_name,
    plan_slug,
    monthly_price,
    yearly_price,
    trial_days,
    tagline,
    description
) VALUES (
    'Tharaga Pro',
    'tharaga-pro',
    499900, -- ₹4,999
    4999200, -- ₹49,992/year (₹4,166/month)
    14,
    'Everything Unlimited. One Simple Price.',
    'Unlimited properties, unlimited AI leads, full CRM, automation, analytics, and priority support. Everything you need to dominate real estate in Chennai.'
) ON CONFLICT (plan_slug) DO NOTHING;

-- =====================================================
-- BUILDER SUBSCRIPTIONS (Simplified - replaces old builder_subscriptions)
-- =====================================================
-- Drop old builder_subscriptions if it exists and recreate
DROP TABLE IF EXISTS builder_subscriptions_new CASCADE;

CREATE TABLE builder_subscriptions_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Builder
    builder_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Plan (always same plan, but kept for consistency)
    plan_id UUID REFERENCES tharaga_plan(id) DEFAULT (SELECT id FROM tharaga_plan LIMIT 1),
    
    -- Billing
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
    current_price BIGINT NOT NULL, -- Amount they're paying (in paise)
    currency TEXT DEFAULT 'INR',
    
    -- Status
    status TEXT CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'paused')) DEFAULT 'trial',
    
    -- Trial
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    is_trial BOOLEAN DEFAULT true,
    
    -- Billing Periods
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    
    -- Razorpay Integration
    razorpay_subscription_id TEXT UNIQUE,
    razorpay_customer_id TEXT,
    razorpay_plan_id TEXT,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Usage Tracking (for analytics only - no limits!)
    properties_count INTEGER DEFAULT 0,
    leads_count INTEGER DEFAULT 0,
    team_members_count INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT, -- Admin only
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing data if builder_subscriptions exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'builder_subscriptions') THEN
        INSERT INTO builder_subscriptions_new (
            builder_id,
            status,
            trial_started_at,
            trial_ends_at,
            is_trial,
            created_at,
            updated_at
        )
        SELECT 
            builder_id,
            CASE 
                WHEN tier = 'trial' THEN 'trial'
                ELSE 'active'
            END,
            trial_started_at,
            trial_expires_at,
            (tier = 'trial'),
            created_at,
            updated_at
        FROM builder_subscriptions
        ON CONFLICT (builder_id) DO NOTHING;
    END IF;
END $$;

-- Rename tables
ALTER TABLE IF EXISTS builder_subscriptions RENAME TO builder_subscriptions_old;
ALTER TABLE builder_subscriptions_new RENAME TO builder_subscriptions;

-- =====================================================
-- PAYMENT HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_history_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    builder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES builder_subscriptions(id) ON DELETE SET NULL,
    
    -- Payment Details
    razorpay_payment_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    
    amount BIGINT NOT NULL, -- in paise
    currency TEXT DEFAULT 'INR',
    
    -- Status
    status TEXT CHECK (status IN ('created', 'authorized', 'captured', 'refunded', 'failed')),
    
    -- Method
    payment_method TEXT, -- card, upi, netbanking, wallet
    
    -- Period Covered
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    
    -- Metadata
    receipt_url TEXT,
    invoice_url TEXT,
    razorpay_response JSONB,
    
    -- Timestamps
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing payment_history if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_history') THEN
        INSERT INTO payment_history_new (
            builder_id,
            razorpay_payment_id,
            razorpay_order_id,
            amount,
            currency,
            status,
            payment_method,
            razorpay_response,
            paid_at,
            created_at
        )
        SELECT 
            user_id as builder_id,
            razorpay_payment_id,
            razorpay_order_id,
            (amount * 100)::BIGINT, -- Convert to paise
            currency,
            status,
            payment_method,
            metadata as razorpay_response,
            paid_at,
            created_at
        FROM payment_history
        WHERE payment_type = 'subscription'
        ON CONFLICT (razorpay_payment_id) DO NOTHING;
    END IF;
END $$;

-- Rename tables
ALTER TABLE IF EXISTS payment_history RENAME TO payment_history_old;
ALTER TABLE payment_history_new RENAME TO payment_history;

-- =====================================================
-- SUBSCRIPTION EVENTS (Audit Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    builder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES builder_subscriptions(id) ON DELETE CASCADE,
    
    -- Event
    event_type TEXT CHECK (event_type IN (
        'trial_started', 'trial_ended', 'trial_converted',
        'subscription_created', 'subscription_activated',
        'payment_succeeded', 'payment_failed',
        'subscription_cancelled', 'subscription_paused', 'subscription_resumed',
        'billing_cycle_changed'
    )),
    
    -- Details
    event_data JSONB,
    
    -- Triggered By
    triggered_by TEXT CHECK (triggered_by IN ('user', 'system', 'admin', 'webhook')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIAL CONVERSION TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS trial_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    builder_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    subscription_id UUID REFERENCES builder_subscriptions(id) ON DELETE CASCADE,
    
    -- Trial Engagement
    properties_added_during_trial INTEGER DEFAULT 0,
    leads_received_during_trial INTEGER DEFAULT 0,
    login_count_during_trial INTEGER DEFAULT 0,
    features_used JSONB DEFAULT '[]'::jsonb,
    
    -- Conversion
    converted_to_paid BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ,
    time_to_conversion_days INTEGER,
    
    -- Cancellation (if didn't convert)
    trial_cancelled BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    exit_survey_response JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_builder_subscriptions_builder ON builder_subscriptions(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_subscriptions_status ON builder_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_builder_subscriptions_trial ON builder_subscriptions(is_trial, trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_builder_subscriptions_period_end ON builder_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_payment_history_builder ON payment_history(builder_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_subscription_events_builder ON subscription_events(builder_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trial_analytics_builder ON trial_analytics(builder_id);
CREATE INDEX IF NOT EXISTS idx_trial_analytics_converted ON trial_analytics(converted_to_paid);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE tharaga_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can view the plan
DROP POLICY IF EXISTS "Anyone can view Tharaga Pro plan" ON tharaga_plan;
CREATE POLICY "Anyone can view Tharaga Pro plan"
    ON tharaga_plan FOR SELECT
    USING (is_active = true);

-- Builders can view their own subscription
DROP POLICY IF EXISTS "Builders view own subscription" ON builder_subscriptions;
CREATE POLICY "Builders view own subscription"
    ON builder_subscriptions FOR SELECT
    USING (builder_id = auth.uid());

-- Builders can view their payment history
DROP POLICY IF EXISTS "Builders view own payments" ON payment_history;
CREATE POLICY "Builders view own payments"
    ON payment_history FOR SELECT
    USING (builder_id = auth.uid());

-- Builders can view their subscription events
DROP POLICY IF EXISTS "Builders view own events" ON subscription_events;
CREATE POLICY "Builders view own events"
    ON subscription_events FOR SELECT
    USING (builder_id = auth.uid());

-- Admins can view all
DROP POLICY IF EXISTS "Admins view all subscriptions" ON builder_subscriptions;
CREATE POLICY "Admins view all subscriptions"
    ON builder_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to start trial
CREATE OR REPLACE FUNCTION start_trial(p_builder_id UUID)
RETURNS UUID AS $$
DECLARE
    v_subscription_id UUID;
    v_plan_id UUID;
    v_trial_end TIMESTAMPTZ;
BEGIN
    -- Get plan
    SELECT id INTO v_plan_id FROM tharaga_plan WHERE is_active = true LIMIT 1;
    
    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'No active plan found';
    END IF;
    
    -- Calculate trial end (14 days from now)
    v_trial_end := NOW() + INTERVAL '14 days';
    
    -- Create subscription
    INSERT INTO builder_subscriptions (
        builder_id,
        plan_id,
        billing_cycle,
        current_price,
        status,
        is_trial,
        trial_started_at,
        trial_ends_at,
        current_period_start,
        current_period_end
    ) VALUES (
        p_builder_id,
        v_plan_id,
        'monthly',
        0, -- Trial is free
        'trial',
        true,
        NOW(),
        v_trial_end,
        NOW(),
        v_trial_end
    )
    ON CONFLICT (builder_id) DO UPDATE SET
        status = 'trial',
        is_trial = true,
        trial_started_at = NOW(),
        trial_ends_at = v_trial_end,
        current_period_start = NOW(),
        current_period_end = v_trial_end,
        updated_at = NOW()
    RETURNING id INTO v_subscription_id;
    
    -- Get subscription ID if updated
    IF v_subscription_id IS NULL THEN
        SELECT id INTO v_subscription_id FROM builder_subscriptions WHERE builder_id = p_builder_id;
    END IF;
    
    -- Log event
    INSERT INTO subscription_events (
        builder_id,
        subscription_id,
        event_type,
        triggered_by
    ) VALUES (
        p_builder_id,
        v_subscription_id,
        'trial_started',
        'system'
    );
    
    -- Create or update trial analytics entry
    INSERT INTO trial_analytics (
        builder_id,
        subscription_id
    ) VALUES (
        p_builder_id,
        v_subscription_id
    )
    ON CONFLICT (builder_id) DO UPDATE SET
        subscription_id = v_subscription_id,
        updated_at = NOW();
    
    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert trial to paid
CREATE OR REPLACE FUNCTION convert_trial_to_paid(
    p_builder_id UUID,
    p_billing_cycle TEXT,
    p_razorpay_subscription_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_price BIGINT;
    v_period_end TIMESTAMPTZ;
    v_subscription_id UUID;
BEGIN
    -- Get price based on billing cycle
    IF p_billing_cycle = 'yearly' THEN
        SELECT yearly_price INTO v_price FROM tharaga_plan WHERE is_active = true LIMIT 1;
        v_period_end := NOW() + INTERVAL '1 year';
    ELSE
        SELECT monthly_price INTO v_price FROM tharaga_plan WHERE is_active = true LIMIT 1;
        v_period_end := NOW() + INTERVAL '1 month';
    END IF;
    
    -- Get subscription ID
    SELECT id INTO v_subscription_id FROM builder_subscriptions WHERE builder_id = p_builder_id;
    
    -- Update subscription
    UPDATE builder_subscriptions
    SET 
        status = 'active',
        is_trial = false,
        billing_cycle = p_billing_cycle,
        current_price = v_price,
        razorpay_subscription_id = p_razorpay_subscription_id,
        current_period_start = NOW(),
        current_period_end = v_period_end,
        updated_at = NOW()
    WHERE builder_id = p_builder_id;
    
    -- Update trial analytics
    UPDATE trial_analytics
    SET 
        converted_to_paid = true,
        converted_at = NOW(),
        time_to_conversion_days = EXTRACT(day FROM NOW() - trial_started_at),
        updated_at = NOW()
    FROM builder_subscriptions bs
    WHERE trial_analytics.builder_id = p_builder_id
    AND trial_analytics.subscription_id = bs.id;
    
    -- Log event
    INSERT INTO subscription_events (
        builder_id,
        subscription_id,
        event_type,
        triggered_by,
        event_data
    ) VALUES (
        p_builder_id,
        v_subscription_id,
        'trial_converted',
        'user',
        jsonb_build_object(
            'billing_cycle', p_billing_cycle,
            'price', v_price
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(p_builder_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM builder_subscriptions
    WHERE builder_id = p_builder_id;
    
    RETURN v_status IN ('trial', 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscription_updated_at ON builder_subscriptions;
CREATE TRIGGER trigger_subscription_updated_at
    BEFORE UPDATE ON builder_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_updated_at();

-- Track property count (if properties table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
        CREATE OR REPLACE FUNCTION track_property_count()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                UPDATE builder_subscriptions
                SET properties_count = (
                    SELECT COUNT(*) FROM properties 
                    WHERE builder_id = NEW.builder_id 
                    AND (status IS NULL OR status != 'sold')
                )
                WHERE builder_id = NEW.builder_id;
            ELSIF TG_OP = 'DELETE' THEN
                UPDATE builder_subscriptions
                SET properties_count = (
                    SELECT COUNT(*) FROM properties 
                    WHERE builder_id = OLD.builder_id 
                    AND (status IS NULL OR status != 'sold')
                )
                WHERE builder_id = OLD.builder_id;
            END IF;
            
            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_track_properties ON properties;
        CREATE TRIGGER trigger_track_properties
            AFTER INSERT OR UPDATE OR DELETE ON properties
            FOR EACH ROW
            EXECUTE FUNCTION track_property_count();
    END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE tharaga_plan IS 'Single-tier pricing plan: ₹4,999/month unlimited everything';
COMMENT ON TABLE builder_subscriptions IS 'Builder subscriptions with trial and paid status';
COMMENT ON TABLE payment_history IS 'Payment history for all subscription payments';
COMMENT ON TABLE subscription_events IS 'Audit log for all subscription events';
COMMENT ON TABLE trial_analytics IS 'Trial engagement and conversion tracking';




