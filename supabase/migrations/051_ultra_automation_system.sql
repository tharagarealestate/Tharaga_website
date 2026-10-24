-- =============================================
-- ULTRA AUTOMATION SYSTEM - COMPLETE SCHEMA
-- 10-Layer Automation System for Maximum Conversion
-- =============================================

-- =============================================
-- LAYER 1: INTELLIGENT LEAD GENERATION
-- =============================================

-- Enhanced generated_leads with intent matching
ALTER TABLE generated_leads ADD COLUMN IF NOT EXISTS 
  intent_score DECIMAL(5,2) DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100);

ALTER TABLE generated_leads ADD COLUMN IF NOT EXISTS 
  buyer_persona TEXT; -- 'young_couple', 'investor', 'family', 'professional'

ALTER TABLE generated_leads ADD COLUMN IF NOT EXISTS 
  payment_capacity TEXT CHECK (payment_capacity IN ('pre_approved', 'savings', 'needs_loan', 'cash_ready'));

ALTER TABLE generated_leads ADD COLUMN IF NOT EXISTS 
  budget_min NUMERIC;
ALTER TABLE generated_leads ADD COLUMN IF NOT EXISTS 
  budget_max NUMERIC;

ALTER TABLE generated_leads ADD COLUMN IF NOT EXISTS 
  market_analysis JSONB DEFAULT '{}'::jsonb; -- Market comparables, demand data

-- Property analysis cache
CREATE TABLE IF NOT EXISTS public.property_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Market analysis
  market_position TEXT CHECK (market_position IN ('premium', 'mid', 'budget')),
  comparable_properties JSONB DEFAULT '[]'::jsonb,
  demand_score INTEGER CHECK (demand_score >= 0 AND demand_score <= 100),
  
  -- Buyer persona analysis
  ideal_buyer_persona JSONB DEFAULT '{}'::jsonb,
  target_budget_range JSONB DEFAULT '{}'::jsonb,
  target_timeline TEXT,
  
  -- Analysis metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  analysis_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_analysis_property ON public.property_analysis(property_id);

-- =============================================
-- LAYER 2: BUYER JOURNEY AUTOMATION
-- =============================================

-- Buyer journey tracking
CREATE TABLE IF NOT EXISTS public.buyer_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.generated_leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Journey state
  current_stage TEXT NOT NULL DEFAULT 'discovery' CHECK (current_stage IN (
    'discovery', 'social_proof', 'urgency', 'alternative', 'builder_intro', 
    'viewing_scheduled', 'viewing_completed', 'negotiation', 'contract', 'closed'
  )),
  stage_started_at TIMESTAMPTZ DEFAULT NOW(),
  next_action_at TIMESTAMPTZ,
  
  -- Engagement tracking
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  last_engagement_at TIMESTAMPTZ,
  
  -- Response tracking
  has_responded BOOLEAN DEFAULT false,
  response_type TEXT, -- 'interested', 'not_interested', 'questions', 'viewing_request'
  response_data JSONB DEFAULT '{}'::jsonb,
  
  -- Journey metadata
  journey_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_journey_lead ON public.buyer_journey(lead_id);
CREATE INDEX IF NOT EXISTS idx_buyer_journey_property ON public.buyer_journey(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_journey_stage ON public.buyer_journey(current_stage, next_action_at);
CREATE INDEX IF NOT EXISTS idx_buyer_journey_builder ON public.buyer_journey(builder_id);

-- Email sequence templates
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_name TEXT NOT NULL,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN (
    'discovery', 'social_proof', 'urgency', 'alternative', 'builder_intro',
    'follow_up', 'viewing_reminder', 'post_viewing', 'negotiation', 'contract'
  )),
  
  -- Email details
  email_number INTEGER NOT NULL, -- 1, 2, 3, 4, 5
  subject_template TEXT NOT NULL,
  html_body_template TEXT NOT NULL,
  text_body_template TEXT,
  
  -- Trigger conditions
  trigger_after_hours INTEGER, -- Hours after previous email
  trigger_on_action TEXT, -- 'opened', 'clicked', 'no_response', 'responded'
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  
  -- Personalization
  personalization_variables JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_type ON public.email_sequences(sequence_type, email_number);

-- Email sequence executions
CREATE TABLE IF NOT EXISTS public.email_sequence_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.buyer_journey(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  
  -- Execution details
  email_number INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Email content (snapshot)
  subject TEXT NOT NULL,
  personalized_html TEXT,
  
  -- Delivery status
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'bounced', 'failed')),
  provider_message_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sequence_executions_journey ON public.email_sequence_executions(journey_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_executions_sent ON public.email_sequence_executions(sent_at);

-- =============================================
-- LAYER 3: BUILDER COMMUNICATION AUTOMATION
-- =============================================

-- Communication suggestions
CREATE TABLE IF NOT EXISTS public.communication_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.buyer_journey(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Suggestion context
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'first_contact', 'follow_up', 'objection_handling', 'price_negotiation',
    'viewing_pitch', 'closing_pitch'
  )),
  buyer_context JSONB DEFAULT '{}'::jsonb, -- Buyer type, actions, preferences
  
  -- Suggested message
  suggested_message TEXT NOT NULL,
  suggested_subject TEXT,
  talking_points JSONB DEFAULT '[]'::jsonb,
  
  -- Strategy
  strategy_reasoning TEXT,
  expected_outcome TEXT,
  
  -- Usage tracking
  was_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  outcome TEXT, -- 'positive', 'neutral', 'negative'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communication_suggestions_journey ON public.communication_suggestions(journey_id);
CREATE INDEX IF NOT EXISTS idx_communication_suggestions_type ON public.communication_suggestions(suggestion_type);

-- Message templates by buyer type
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  buyer_type TEXT CHECK (buyer_type IN ('budget_conscious', 'time_sensitive', 'quality_focused', 'investor', 'family')),
  context TEXT CHECK (context IN ('first_contact', 'follow_up', 'objection', 'negotiation', 'closing')),
  
  -- Template content
  message_template TEXT NOT NULL,
  subject_template TEXT,
  talking_points JSONB DEFAULT '[]'::jsonb,
  
  -- Effectiveness tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_buyer_type ON public.message_templates(buyer_type, context);

-- =============================================
-- LAYER 4: VIEWING AUTOMATION
-- =============================================

-- Property viewings
CREATE TABLE IF NOT EXISTS public.property_viewings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.buyer_journey(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.generated_leads(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Viewing details
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  viewing_type TEXT DEFAULT 'in_person' CHECK (viewing_type IN ('in_person', 'virtual', 'video_call')),
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Calendar integration
  calendar_event_id TEXT,
  calendar_provider TEXT, -- 'google', 'outlook'
  
  -- Viewing results
  buyer_attended BOOLEAN,
  viewing_duration_minutes INTEGER,
  interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 10),
  builder_notes TEXT,
  buyer_feedback TEXT,
  
  -- Follow-up
  follow_up_sent_at TIMESTAMPTZ,
  follow_up_response TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_viewings_journey ON public.property_viewings(journey_id);
CREATE INDEX IF NOT EXISTS idx_property_viewings_scheduled ON public.property_viewings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_property_viewings_status ON public.property_viewings(status);

-- Viewing reminders
CREATE TABLE IF NOT EXISTS public.viewing_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewing_id UUID NOT NULL REFERENCES public.property_viewings(id) ON DELETE CASCADE,
  
  reminder_type TEXT CHECK (reminder_type IN ('24h_before', '1h_before', '30min_before', 'questions_prep')),
  sent_at TIMESTAMPTZ,
  reminder_content TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LAYER 5: NEGOTIATION AUTOMATION
-- =============================================

-- Negotiation tracking
CREATE TABLE IF NOT EXISTS public.negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.buyer_journey(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.generated_leads(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Price details
  listed_price NUMERIC NOT NULL,
  buyer_budget_min NUMERIC,
  buyer_budget_max NUMERIC,
  initial_offer NUMERIC,
  current_offer NUMERIC,
  final_price NUMERIC,
  
  -- Market analysis
  market_comparable_min NUMERIC,
  market_comparable_max NUMERIC,
  market_comparable_avg NUMERIC,
  
  -- Strategy
  suggested_price NUMERIC,
  suggested_strategy TEXT,
  strategy_reasoning TEXT,
  
  -- Negotiation status
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'counter_offer', 'accepted', 'rejected', 'closed')),
  negotiation_rounds INTEGER DEFAULT 0,
  
  -- Timeline
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_offer_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Outcome
  outcome TEXT, -- 'accepted', 'rejected', 'pending'
  outcome_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiations_journey ON public.negotiations(journey_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON public.negotiations(status);

-- Price strategy learning
CREATE TABLE IF NOT EXISTS public.price_strategy_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Strategy parameters
  property_type TEXT,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  location TEXT,
  
  -- Success metrics
  total_negotiations INTEGER DEFAULT 0,
  successful_closes INTEGER DEFAULT 0,
  average_discount_percent DECIMAL(5,2),
  average_days_to_close INTEGER,
  
  -- Optimal strategy
  optimal_price_point NUMERIC,
  optimal_discount_percent DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  
  -- Learning data
  insights JSONB DEFAULT '{}'::jsonb,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_strategy_builder ON public.price_strategy_insights(builder_id);

-- =============================================
-- LAYER 6: CONTRACT AUTOMATION
-- =============================================

-- Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.generated_leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.generated_leads(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contract details
  contract_type TEXT DEFAULT 'sale' CHECK (contract_type IN ('sale', 'lease', 'agreement')),
  contract_number TEXT UNIQUE,
  
  -- Parties
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT,
  
  -- Property details (snapshot)
  property_details JSONB NOT NULL,
  
  -- Financial terms
  contract_price NUMERIC NOT NULL,
  payment_terms JSONB DEFAULT '{}'::jsonb,
  payment_schedule JSONB DEFAULT '[]'::jsonb,
  
  -- Timeline
  possession_date DATE,
  completion_date DATE,
  
  -- Contract status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed_buyer', 'signed_builder', 'executed', 'cancelled')),
  
  -- Digital signature
  buyer_signed_at TIMESTAMPTZ,
  buyer_signature_data JSONB,
  builder_signed_at TIMESTAMPTZ,
  builder_signature_data JSONB,
  
  -- Document
  contract_document_url TEXT,
  contract_document_hash TEXT,
  
  -- Metadata
  contract_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_journey ON public.contracts(journey_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_builder ON public.contracts(builder_id);

-- Contract templates
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  
  -- Template content
  template_html TEXT NOT NULL,
  template_variables JSONB DEFAULT '[]'::jsonb,
  
  -- Builder customization
  builder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LAYER 7: CASH FLOW AUTOMATION
-- =============================================

-- Deal lifecycle tracking
CREATE TABLE IF NOT EXISTS public.deal_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.buyer_journey(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lifecycle stages
  current_stage TEXT NOT NULL DEFAULT 'lead_generated' CHECK (current_stage IN (
    'lead_generated', 'first_contact', 'viewing_scheduled', 'viewing_completed',
    'price_negotiation', 'contract_signed', 'payment_received', 'possession_handover', 'closed'
  )),
  
  -- Stage timestamps
  lead_generated_at TIMESTAMPTZ,
  first_contact_at TIMESTAMPTZ,
  viewing_scheduled_at TIMESTAMPTZ,
  viewing_completed_at TIMESTAMPTZ,
  negotiation_started_at TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,
  first_payment_at TIMESTAMPTZ,
  possession_handover_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Milestone tracking
  milestones JSONB DEFAULT '[]'::jsonb,
  next_milestone TEXT,
  next_milestone_due_at TIMESTAMPTZ,
  
  -- Performance metrics
  days_in_stage INTEGER,
  total_days_to_close INTEGER,
  is_stalling BOOLEAN DEFAULT false,
  stalling_reason TEXT,
  
  -- Alerts
  alerts_sent JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_lifecycle_journey ON public.deal_lifecycle(journey_id);
CREATE INDEX IF NOT EXISTS idx_deal_lifecycle_stage ON public.deal_lifecycle(current_stage);
CREATE INDEX IF NOT EXISTS idx_deal_lifecycle_stalling ON public.deal_lifecycle(is_stalling) WHERE is_stalling = true;

-- Payment milestones
CREATE TABLE IF NOT EXISTS public.payment_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Milestone details
  milestone_name TEXT NOT NULL,
  milestone_type TEXT CHECK (milestone_type IN ('booking', 'construction', 'possession', 'final')),
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  percentage DECIMAL(5,2),
  
  -- Payment status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'paid', 'overdue')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Reminders
  reminders_sent INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_milestones_contract ON public.payment_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_status ON public.payment_milestones(status, due_date);

-- =============================================
-- LAYER 8: COMPETITIVE INTELLIGENCE
-- =============================================

-- Competitor properties
CREATE TABLE IF NOT EXISTS public.competitor_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Competitor details
  competitor_name TEXT,
  competitor_property_url TEXT,
  competitor_price NUMERIC,
  competitor_location TEXT,
  
  -- Comparison
  price_difference NUMERIC,
  price_difference_percent DECIMAL(5,2),
  amenities_comparison JSONB DEFAULT '{}'::jsonb,
  advantages JSONB DEFAULT '[]'::jsonb,
  disadvantages JSONB DEFAULT '[]'::jsonb,
  
  -- Market position
  market_position TEXT, -- 'better', 'similar', 'worse'
  
  -- Tracking
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_properties_property ON public.competitor_properties(property_id);

-- Competitive advantages
CREATE TABLE IF NOT EXISTS public.competitive_advantages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.buyer_journey(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Buyer consideration
  buyer_considering_competitor BOOLEAN DEFAULT false,
  competitor_property_id UUID REFERENCES public.competitor_properties(id) ON DELETE SET NULL,
  
  -- Advantage messaging
  advantage_message TEXT,
  advantage_points JSONB DEFAULT '[]'::jsonb,
  
  -- Usage
  sent_to_buyer BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  buyer_response TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitive_advantages_journey ON public.competitive_advantages(journey_id);

-- =============================================
-- LAYER 9: MULTI-PROPERTY CROSS-SELLING
-- =============================================

-- Cross-sell recommendations
CREATE TABLE IF NOT EXISTS public.cross_sell_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_journey_id UUID NOT NULL REFERENCES public.buyer_journey(id) ON DELETE CASCADE,
  source_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  recommended_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.generated_leads(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recommendation reason
  recommendation_reason TEXT NOT NULL, -- 'price_upgrade', 'location_better', 'amenity_match', 'size_upgrade'
  objection_addressed TEXT, -- Original objection that this property solves
  
  -- Match score
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_factors JSONB DEFAULT '{}'::jsonb,
  
  -- Presentation
  presented_to_buyer BOOLEAN DEFAULT false,
  presented_at TIMESTAMPTZ,
  buyer_interest_level INTEGER CHECK (buyer_interest_level >= 1 AND buyer_interest_level <= 10),
  
  -- Outcome
  outcome TEXT, -- 'interested', 'not_interested', 'viewing_scheduled', 'closed'
  outcome_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_sell_source_journey ON public.cross_sell_recommendations(source_journey_id);
CREATE INDEX IF NOT EXISTS idx_cross_sell_recommended ON public.cross_sell_recommendations(recommended_property_id);

-- =============================================
-- LAYER 10: BUILDER INTELLIGENCE DASHBOARD
-- =============================================

-- Conversion analytics
CREATE TABLE IF NOT EXISTS public.conversion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  
  -- Property metrics
  property_type TEXT,
  location TEXT,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  
  -- Conversion metrics
  total_leads INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  viewings_scheduled INTEGER DEFAULT 0,
  viewings_completed INTEGER DEFAULT 0,
  negotiations_started INTEGER DEFAULT 0,
  contracts_signed INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  
  -- Conversion rates
  contact_rate DECIMAL(5,2), -- leads_contacted / total_leads
  viewing_rate DECIMAL(5,2), -- viewings_completed / leads_contacted
  negotiation_rate DECIMAL(5,2), -- negotiations_started / viewings_completed
  contract_rate DECIMAL(5,2), -- contracts_signed / negotiations_started
  close_rate DECIMAL(5,2), -- deals_closed / contracts_signed
  overall_conversion_rate DECIMAL(5,2), -- deals_closed / total_leads
  
  -- Performance metrics
  average_days_to_contact INTEGER,
  average_days_to_viewing INTEGER,
  average_days_to_close INTEGER,
  average_deal_value NUMERIC,
  
  -- Buyer type metrics
  buyer_type_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Optimal insights
  optimal_follow_up_timing TEXT,
  optimal_price_point NUMERIC,
  optimal_price_range JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_analytics_builder ON public.conversion_analytics(builder_id, period_start);
CREATE INDEX IF NOT EXISTS idx_conversion_analytics_type ON public.conversion_analytics(property_type, location);

-- Builder insights cache
CREATE TABLE IF NOT EXISTS public.builder_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Insight type
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'conversion_rate', 'optimal_price', 'best_timing', 'buyer_type', 
    'property_type', 'location', 'follow_up_strategy'
  )),
  
  -- Insight data
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  insight_recommendation TEXT,
  
  -- Impact
  potential_impact TEXT, -- 'high', 'medium', 'low'
  estimated_improvement DECIMAL(5,2), -- Percentage improvement
  
  -- Status
  is_actioned BOOLEAN DEFAULT false,
  actioned_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_insights_builder ON public.builder_insights(builder_id, insight_type);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DO $$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY[
    'property_analysis', 'buyer_journey', 'email_sequences', 'communication_suggestions',
    'message_templates', 'property_viewings', 'negotiations', 'price_strategy_insights',
    'contracts', 'contract_templates', 'deal_lifecycle', 'payment_milestones',
    'competitor_properties', 'competitive_advantages', 'cross_sell_recommendations',
    'conversion_analytics', 'builder_insights'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all new tables
DO $$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY[
    'property_analysis', 'buyer_journey', 'email_sequences', 'email_sequence_executions',
    'communication_suggestions', 'message_templates', 'property_viewings', 'viewing_reminders',
    'negotiations', 'price_strategy_insights', 'contracts', 'contract_templates',
    'deal_lifecycle', 'payment_milestones', 'competitor_properties', 'competitive_advantages',
    'cross_sell_recommendations', 'conversion_analytics', 'builder_insights'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
    
    -- Builders can view their own data
    EXECUTE format('
      DROP POLICY IF EXISTS "builders_view_own_%I" ON public.%I;
      CREATE POLICY "builders_view_own_%I"
        ON public.%I FOR SELECT
        USING (builder_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.properties p 
          WHERE p.id = (SELECT property_id FROM public.%I WHERE id = %I.id LIMIT 1)
          AND p.builder_id = auth.uid()
        ));
    ', table_name, table_name, table_name, table_name, table_name, table_name);
    
    -- System can insert/update
    EXECUTE format('
      DROP POLICY IF EXISTS "system_manage_%I" ON public.%I;
      CREATE POLICY "system_manage_%I"
        ON public.%I FOR ALL
        WITH CHECK (true);
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.property_analysis IS 'Layer 1: Market and buyer persona analysis for properties';
COMMENT ON TABLE public.buyer_journey IS 'Layer 2: Complete buyer journey tracking and automation';
COMMENT ON TABLE public.email_sequences IS 'Layer 2: Email sequence templates for buyer journey';
COMMENT ON TABLE public.communication_suggestions IS 'Layer 3: AI-powered communication suggestions for builders';
COMMENT ON TABLE public.property_viewings IS 'Layer 4: Property viewing scheduling and tracking';
COMMENT ON TABLE public.negotiations IS 'Layer 5: Price negotiation tracking and strategy';
COMMENT ON TABLE public.contracts IS 'Layer 6: Contract generation and digital signing';
COMMENT ON TABLE public.deal_lifecycle IS 'Layer 7: Complete deal lifecycle and milestone tracking';
COMMENT ON TABLE public.competitor_properties IS 'Layer 8: Competitive intelligence and market analysis';
COMMENT ON TABLE public.cross_sell_recommendations IS 'Layer 9: Multi-property cross-selling recommendations';
COMMENT ON TABLE public.conversion_analytics IS 'Layer 10: Builder conversion analytics and insights';

