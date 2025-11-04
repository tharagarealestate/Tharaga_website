-- ============================================
-- PRICING & SUBSCRIPTION TABLES (9 TABLES)
-- Migration: 020_pricing_system.sql
-- Created: 2025-01-XX
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PRICING PLANS (Master configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT UNIQUE CHECK (plan_type IN ('builder_free', 'builder_pro', 'builder_enterprise', 'buyer_free', 'buyer_premium', 'buyer_vip')),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  base_price_monthly DECIMAL(10,2) NOT NULL, -- In INR
  base_price_yearly DECIMAL(10,2), -- NULL if not applicable
  commission_rate DECIMAL(5,2), -- Percentage (e.g., 10.00 for 10%)
  features JSONB NOT NULL, -- { 'property_limit': 50, 'lead_limit': null, 'analytics': true }
  limits JSONB NOT NULL, -- { 'projects': 10, 'properties_per_project': 50 }
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USER SUBSCRIPTIONS (Active subscriptions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.pricing_plans(id),
  status TEXT CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused')) DEFAULT 'active',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  pricing_model TEXT CHECK (pricing_model IN ('subscription', 'commission', 'hybrid')), -- For Builder Pro
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_customer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. COMMISSION RATES (Dynamic commission configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS public.commission_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_type TEXT CHECK (rate_type IN ('standard', 'promotional', 'premium', 'custom')),
  percentage DECIMAL(5,2) NOT NULL,
  min_deal_value DECIMAL(12,2),
  max_deal_value DECIMAL(12,2),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  applicable_to JSONB, -- { 'plan_types': ['builder_free', 'builder_pro'], 'locations': ['bangalore'] }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. COMMISSION TRANSACTIONS (Track all commissions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.commission_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  lead_id BIGINT REFERENCES public.leads(id),
  property_id UUID REFERENCES public.properties(id),
  deal_value DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'paid', 'disputed', 'refunded')),
  payment_date TIMESTAMPTZ,
  razorpay_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. LAWYER VERIFICATION PRICING
-- ============================================
CREATE TABLE IF NOT EXISTS public.lawyer_verification_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL UNIQUE, -- 'rera_certificate', 'title_deed', 'sale_agreement', etc.
  base_price DECIMAL(10,2) NOT NULL, -- What buyer pays (₹500-1,000)
  lawyer_payout DECIMAL(10,2) NOT NULL, -- What lawyer receives (₹400-800)
  platform_fee DECIMAL(10,2) NOT NULL, -- Tharaga's cut (₹100-200)
  estimated_turnaround_hours INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. LAWYER CONSULTATION PRICING
-- ============================================
CREATE TABLE IF NOT EXISTS public.lawyer_consultation_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_type TEXT UNIQUE CHECK (consultation_type IN ('text_question', 'call_15min', 'call_30min', 'call_60min')),
  base_price DECIMAL(10,2) NOT NULL,
  lawyer_payout DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. AFFILIATE COMMISSION RATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_commission_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_type TEXT CHECK (affiliate_type IN ('bank_loan', 'insurance', 'interior_design', 'legal_services', 'packers_movers')),
  commission_type TEXT CHECK (commission_type IN ('fixed', 'percentage')),
  commission_value DECIMAL(10,2) NOT NULL, -- Fixed amount or percentage
  min_transaction_value DECIMAL(12,2),
  partner_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. PAYMENT HISTORY (All payments)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  payment_type TEXT CHECK (payment_type IN ('subscription', 'commission', 'lawyer_verification', 'lawyer_consultation', 'affiliate')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  payment_method TEXT, -- 'card', 'upi', 'netbanking'
  invoice_url TEXT,
  receipt_url TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. INVOICES (Generated invoices)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  invoice_number TEXT UNIQUE NOT NULL,
  payment_id UUID REFERENCES public.payment_history(id),
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  subtotal DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL, -- 18% GST in India
  total_amount DECIMAL(10,2) NOT NULL,
  line_items JSONB NOT NULL, -- [{ 'description': 'Builder Pro - Monthly', 'amount': 4999 }]
  billing_address JSONB,
  gst_number TEXT,
  status TEXT CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'void')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED DATA FOR PRICING PLANS
-- ============================================

-- Seed data for Builder Plans
-- Note: Using ON CONFLICT to make migration idempotent
INSERT INTO public.pricing_plans (plan_type, name, display_name, description, base_price_monthly, base_price_yearly, commission_rate, features, limits, sort_order) VALUES
(
  'builder_free',
  'Free',
  'Builder Free',
  'Perfect for getting started',
  0.00,
  0.00,
  12.5, -- 12.5% commission on deals
  '{
    "property_limit": 5,
    "lead_scoring": "basic",
    "analytics": "basic",
    "support": "community",
    "api_access": false,
    "team_members": 1,
    "featured_listings": 0,
    "custom_branding": false
  }',
  '{
    "projects": 1,
    "properties_per_project": 5,
    "leads_per_month": 20
  }',
  1
),
(
  'builder_pro',
  'Pro',
  'Builder Pro',
  'For growing businesses - Choose your model',
  2999.00, -- Base subscription (if commission model)
  29990.00, -- Yearly (17% discount)
  10.0, -- 10% commission (promotional rate)
  '{
    "property_limit": 50,
    "lead_scoring": "advanced",
    "analytics": "advanced",
    "support": "priority",
    "api_access": true,
    "team_members": 5,
    "featured_listings": 3,
    "custom_branding": false,
    "crm_integration": true,
    "automated_follow_ups": true
  }',
  '{
    "projects": 10,
    "properties_per_project": 50,
    "leads_per_month": null
  }',
  2
),
(
  'builder_enterprise',
  'Enterprise',
  'Builder Enterprise',
  'For large organizations',
  14999.00,
  149990.00, -- Yearly (17% discount)
  0.0, -- No commission
  '{
    "property_limit": null,
    "lead_scoring": "ai_powered",
    "analytics": "custom",
    "support": "dedicated_manager",
    "api_access": true,
    "team_members": null,
    "featured_listings": 10,
    "custom_branding": true,
    "white_label": true,
    "multi_location": true,
    "custom_integrations": true,
    "sla_99_9": true
  }',
  '{
    "projects": null,
    "properties_per_project": null,
    "leads_per_month": null
  }',
  3
)
ON CONFLICT (plan_type) DO NOTHING;

-- Seed data for Buyer Plans
INSERT INTO public.pricing_plans (plan_type, name, display_name, description, base_price_monthly, base_price_yearly, commission_rate, features, limits, sort_order) VALUES
(
  'buyer_free',
  'Free',
  'Buyer Free',
  'Start your property search',
  0.00,
  0.00,
  0.0,
  '{
    "property_search": "unlimited",
    "saved_properties": 10,
    "comparison_limit": 3,
    "site_visits": "basic_scheduling",
    "ai_recommendations": "basic",
    "document_vault": false,
    "lawyer_consultation": false,
    "priority_support": false
  }',
  '{
    "saved_properties": 10,
    "comparisons": 3
  }',
  1
),
(
  'buyer_premium',
  'Premium',
  'Buyer Premium',
  'Advanced search and insights',
  99.00,
  999.00, -- Yearly (58% discount from 12 × 99 = 1,188)
  0.0,
  '{
    "property_search": "unlimited",
    "saved_properties": 50,
    "comparison_limit": 10,
    "site_visits": "priority_scheduling",
    "ai_recommendations": "advanced",
    "document_vault": true,
    "lawyer_consultation": "3_free_questions",
    "priority_support": true,
    "market_insights": true,
    "price_alerts": true,
    "investment_calculator": true
  }',
  '{
    "saved_properties": 50,
    "comparisons": 10,
    "free_lawyer_questions": 3
  }',
  2
),
(
  'buyer_vip',
  'VIP',
  'Buyer VIP',
  'Complete purchase assistance',
  999.00,
  9999.00, -- Yearly (17% discount from 12 × 999 = 11,988)
  0.0,
  '{
    "property_search": "unlimited",
    "saved_properties": null,
    "comparison_limit": null,
    "site_visits": "concierge_service",
    "ai_recommendations": "personalized",
    "document_vault": true,
    "lawyer_consultation": "unlimited",
    "priority_support": "dedicated_manager",
    "market_insights": true,
    "price_alerts": true,
    "investment_calculator": true,
    "property_visit_coordination": true,
    "negotiation_support": true,
    "end_to_end_assistance": true
  }',
  '{
    "saved_properties": null,
    "comparisons": null,
    "free_lawyer_questions": null
  }',
  3
)
ON CONFLICT (plan_type) DO NOTHING;

-- ============================================
-- SEED DATA FOR COMMISSION RATES
-- ============================================
-- Seed data for commission rates (no unique constraint, will skip duplicates manually if needed)
INSERT INTO public.commission_rates (rate_type, percentage, min_deal_value, max_deal_value, applicable_to) 
SELECT * FROM (VALUES
  ('standard', 12.50, 0, 50000000, '{"plan_types": ["builder_free"]}'::jsonb), -- 12.5% for Free plan
  ('promotional', 10.00, 0, 50000000, '{"plan_types": ["builder_pro"]}'::jsonb), -- 10% for Pro (commission model)
  ('premium', 15.00, 50000001, NULL, '{"plan_types": ["builder_free", "builder_pro"]}'::jsonb) -- 15% for high-value deals
) AS v(rate_type, percentage, min_deal_value, max_deal_value, applicable_to)
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_rates 
  WHERE commission_rates.rate_type = v.rate_type 
  AND commission_rates.percentage = v.percentage
  AND (commission_rates.min_deal_value = v.min_deal_value OR (commission_rates.min_deal_value IS NULL AND v.min_deal_value IS NULL))
);

-- ============================================
-- SEED DATA FOR LAWYER VERIFICATION PRICING
-- ============================================
INSERT INTO public.lawyer_verification_pricing (document_type, base_price, lawyer_payout, platform_fee, estimated_turnaround_hours) VALUES
('rera_certificate', 500.00, 400.00, 100.00, 24),
('title_deed', 1000.00, 800.00, 200.00, 48),
('sale_agreement', 800.00, 650.00, 150.00, 48),
('encumbrance_certificate', 600.00, 480.00, 120.00, 72),
('property_tax_receipt', 300.00, 240.00, 60.00, 12),
('building_approval', 700.00, 560.00, 140.00, 36)
ON CONFLICT (document_type) DO NOTHING;

-- ============================================
-- SEED DATA FOR LAWYER CONSULTATION PRICING
-- ============================================
INSERT INTO public.lawyer_consultation_pricing (consultation_type, base_price, lawyer_payout, platform_fee) VALUES
('text_question', 199.00, 150.00, 49.00),
('call_15min', 499.00, 399.00, 100.00),
('call_30min', 899.00, 719.00, 180.00),
('call_60min', 1499.00, 1199.00, 300.00)
ON CONFLICT (consultation_type) DO NOTHING;

-- ============================================
-- SEED DATA FOR AFFILIATE COMMISSION RATES
-- ============================================
-- Seed data for affiliate commission rates (no unique constraint, will skip duplicates manually if needed)
INSERT INTO public.affiliate_commission_rates (affiliate_type, commission_type, commission_value, min_transaction_value, partner_name) 
SELECT * FROM (VALUES
  ('bank_loan', 'fixed', 5000.00, 1000000, 'HDFC/ICICI/SBI'), -- ₹5K per loan sanction (₹10L+ loan)
  ('insurance', 'percentage', 2.00, NULL, 'General Insurance Partners'), -- 2% of premium
  ('interior_design', 'percentage', 10.00, NULL, 'Interior Partners'), -- 10% of project value
  ('legal_services', 'percentage', 15.00, NULL, 'Legal Network'), -- 15% of service fee
  ('packers_movers', 'percentage', 8.00, NULL, 'Logistics Partners') -- 8% of moving cost
) AS v(affiliate_type, commission_type, commission_value, min_transaction_value, partner_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.affiliate_commission_rates 
  WHERE affiliate_commission_rates.affiliate_type = v.affiliate_type
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_user ON public.commission_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_lead ON public.commission_transactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_status ON public.commission_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment ON public.invoices(payment_id);

-- ============================================
-- UPDATE TRIGGER FUNCTION
-- ============================================
-- Create or replace the generic update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER pricing_plans_updated_at 
  BEFORE UPDATE ON public.pricing_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER user_subscriptions_updated_at 
  BEFORE UPDATE ON public.user_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER commission_transactions_updated_at 
  BEFORE UPDATE ON public.commission_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" 
  ON public.user_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" 
  ON public.user_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" 
  ON public.user_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for commission_transactions
CREATE POLICY "Users can view own commissions" 
  ON public.commission_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policies for payment_history
CREATE POLICY "Users can view own payments" 
  ON public.payment_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices" 
  ON public.invoices 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.pricing_plans IS 'Master configuration table for all pricing plans (Builder and Buyer plans)';
COMMENT ON TABLE public.user_subscriptions IS 'Active user subscriptions tracking current plan, billing cycle, and payment status';
COMMENT ON TABLE public.commission_rates IS 'Dynamic commission rate configuration with validity periods and applicability rules';
COMMENT ON TABLE public.commission_transactions IS 'Tracks all commission transactions from property deals';
COMMENT ON TABLE public.lawyer_verification_pricing IS 'Pricing configuration for legal document verification services';
COMMENT ON TABLE public.lawyer_consultation_pricing IS 'Pricing configuration for lawyer consultation services';
COMMENT ON TABLE public.affiliate_commission_rates IS 'Commission rates for affiliate partner services (loans, insurance, etc.)';
COMMENT ON TABLE public.payment_history IS 'Complete payment history for all transaction types';
COMMENT ON TABLE public.invoices IS 'Generated invoices with GST calculations for Indian tax compliance';

