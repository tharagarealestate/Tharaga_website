-- ============================================================
-- MODULE 1: Agentic AI Marketing Funnel — Schema Extension
-- ============================================================
-- Extends existing schema without breaking anything.
-- All phones stored as E.164 (+91XXXXXXXXXX).
-- All money in lakhs, all timestamps in UTC.
-- ============================================================

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ENHANCE EXISTING leads TABLE
-- ============================================================
DO $$ BEGIN
  -- Phone normalization (E.164 +91XXXXXXXXXX)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='phone_normalized') THEN
    ALTER TABLE public.leads ADD COLUMN phone_normalized text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone_normalized ON public.leads(phone_normalized) WHERE phone_normalized IS NOT NULL;
  END IF;

  -- SHA-256 hashes for CAPI deduplication
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='phone_hash') THEN
    ALTER TABLE public.leads ADD COLUMN phone_hash text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='email_hash') THEN
    ALTER TABLE public.leads ADD COLUMN email_hash text;
  END IF;

  -- SmartScore
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='smartscore') THEN
    ALTER TABLE public.leads ADD COLUMN smartscore integer DEFAULT 0 CHECK (smartscore >= 0 AND smartscore <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='score_breakdown') THEN
    ALTER TABLE public.leads ADD COLUMN score_breakdown jsonb DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='classification') THEN
    ALTER TABLE public.leads ADD COLUMN classification text CHECK (classification IN ('lion','monkey','dog'));
  END IF;

  -- UTM + attribution
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_source') THEN
    ALTER TABLE public.leads ADD COLUMN utm_source text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_medium') THEN
    ALTER TABLE public.leads ADD COLUMN utm_medium text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_campaign') THEN
    ALTER TABLE public.leads ADD COLUMN utm_campaign text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_content') THEN
    ALTER TABLE public.leads ADD COLUMN utm_content text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='utm_term') THEN
    ALTER TABLE public.leads ADD COLUMN utm_term text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='fbclid') THEN
    ALTER TABLE public.leads ADD COLUMN fbclid text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='gclid') THEN
    ALTER TABLE public.leads ADD COLUMN gclid text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='fbc') THEN
    ALTER TABLE public.leads ADD COLUMN fbc text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='fbp') THEN
    ALTER TABLE public.leads ADD COLUMN fbp text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='event_id') THEN
    ALTER TABLE public.leads ADD COLUMN event_id text; -- browser pixel dedup ID
  END IF;

  -- CAPI tracking flags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='capi_lead_fired') THEN
    ALTER TABLE public.leads ADD COLUMN capi_lead_fired boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='capi_visit_fired') THEN
    ALTER TABLE public.leads ADD COLUMN capi_visit_fired boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='capi_purchase_fired') THEN
    ALTER TABLE public.leads ADD COLUMN capi_purchase_fired boolean DEFAULT false;
  END IF;

  -- Assignment + SLA
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='assigned_to') THEN
    ALTER TABLE public.leads ADD COLUMN assigned_to uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='assignment_type') THEN
    ALTER TABLE public.leads ADD COLUMN assignment_type text CHECK (assignment_type IN ('sales_exec','channel_partner'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='sla_deadline') THEN
    ALTER TABLE public.leads ADD COLUMN sla_deadline timestamptz;
  END IF;

  -- Zoho CRM sync
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='zoho_lead_id') THEN
    ALTER TABLE public.leads ADD COLUMN zoho_lead_id text;
  END IF;

  -- WhatsApp qualification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='whatsapp_qualified') THEN
    ALTER TABLE public.leads ADD COLUMN whatsapp_qualified boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='qualification_data') THEN
    ALTER TABLE public.leads ADD COLUMN qualification_data jsonb DEFAULT '{}';
  END IF;

  -- Location + interest
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='preferred_location') THEN
    ALTER TABLE public.leads ADD COLUMN preferred_location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='timeline_months') THEN
    ALTER TABLE public.leads ADD COLUMN timeline_months integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='property_type_interest') THEN
    ALTER TABLE public.leads ADD COLUMN property_type_interest text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='loan_required') THEN
    ALTER TABLE public.leads ADD COLUMN loan_required boolean;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='purpose') THEN
    ALTER TABLE public.leads ADD COLUMN purpose text CHECK (purpose IN ('self_use','investment','rental'));
  END IF;

  -- Vector embedding for semantic matching
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='embedding') THEN
    ALTER TABLE public.leads ADD COLUMN embedding vector(1536);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_smartscore ON public.leads(smartscore DESC);
CREATE INDEX IF NOT EXISTS idx_leads_classification ON public.leads(classification);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_sla_deadline ON public.leads(sla_deadline);

-- ============================================================
-- NEW TABLE: behavioral_signals
-- Replaces/augments buyer_behavioral_signals for funnel tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.behavioral_signals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text NOT NULL,
  lead_id       uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  signal_type   text NOT NULL, -- page_view, scroll_depth, time_on_page, exit, cta_click, property_view, search
  signal_value  jsonb NOT NULL DEFAULT '{}',
  page_url      text,
  property_id   uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  -- Attribution
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  fbclid        text,
  gclid         text,
  fbc           text,
  fbp           text,
  -- Meta
  user_agent    text,
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_signals_session ON public.behavioral_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_lead ON public.behavioral_signals(lead_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_type ON public.behavioral_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_created ON public.behavioral_signals(created_at DESC);

ALTER TABLE public.behavioral_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_behavioral_signals" ON public.behavioral_signals;
CREATE POLICY "service_role_all_behavioral_signals" ON public.behavioral_signals
  USING (true) WITH CHECK (true);

-- ============================================================
-- NEW TABLE: lead_events (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type  text NOT NULL, -- created, scored, classified, assigned, contacted, qualified, sla_breach, won, lost
  actor_id    uuid,          -- who triggered this event (sales exec, system)
  actor_type  text CHECK (actor_type IN ('system','sales_exec','channel_partner','ai','admin')),
  old_value   jsonb DEFAULT '{}',
  new_value   jsonb DEFAULT '{}',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON public.lead_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lead_events_created ON public.lead_events(created_at DESC);

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_lead_events" ON public.lead_events;
CREATE POLICY "service_role_all_lead_events" ON public.lead_events USING (true) WITH CHECK (true);

-- ============================================================
-- NEW TABLE: sales_team
-- Internal sales executives who receive Lion/Monkey leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_team (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name                text NOT NULL,
  email               text UNIQUE NOT NULL,
  phone               text NOT NULL, -- E.164
  whatsapp_number     text,          -- E.164
  is_active           boolean DEFAULT true,
  tier                text NOT NULL DEFAULT 'exec' CHECK (tier IN ('senior','exec','junior')),
  -- Performance metrics (updated nightly)
  conversion_rate     numeric(5,4) DEFAULT 0,   -- 0.0000 to 1.0000
  avg_response_time   integer DEFAULT 0,         -- seconds
  leads_handled       integer DEFAULT 0,
  leads_converted     integer DEFAULT 0,
  -- Round-robin state
  last_assigned_at    timestamptz,
  -- Working hours (IST, 24h format)
  working_hours_start integer DEFAULT 9,  -- 9am
  working_hours_end   integer DEFAULT 21, -- 9pm
  -- Capacity
  max_daily_leads     integer DEFAULT 20,
  current_daily_count integer DEFAULT 0,
  count_reset_date    date DEFAULT CURRENT_DATE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_team_active ON public.sales_team(is_active, last_assigned_at);
CREATE INDEX IF NOT EXISTS idx_sales_team_conversion ON public.sales_team(conversion_rate DESC);

ALTER TABLE public.sales_team ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_sales_team" ON public.sales_team;
CREATE POLICY "service_role_all_sales_team" ON public.sales_team USING (true) WITH CHECK (true);

-- ============================================================
-- NEW TABLE: channel_partners
-- External channel partner network for Dog-tier leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.channel_partners (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  company           text,
  email             text UNIQUE,
  phone             text NOT NULL, -- E.164
  whatsapp_number   text,
  rera_number       text,          -- RERA registration
  is_active         boolean DEFAULT true,
  commission_rate   numeric(4,2) DEFAULT 2.00, -- percent
  -- Performance
  leads_sent        integer DEFAULT 0,
  leads_converted   integer DEFAULT 0,
  conversion_rate   numeric(5,4) DEFAULT 0,
  -- Assignment state
  last_assigned_at  timestamptz,
  -- Geo coverage
  cities            text[] DEFAULT ARRAY['Chennai'],
  localities        text[],
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_partners_active ON public.channel_partners(is_active, last_assigned_at);

ALTER TABLE public.channel_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_channel_partners" ON public.channel_partners;
CREATE POLICY "service_role_all_channel_partners" ON public.channel_partners USING (true) WITH CHECK (true);

-- ============================================================
-- NEW TABLE: ad_spend
-- Daily Meta + Google Ads spend sync for ROI tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_spend (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  platform      text NOT NULL CHECK (platform IN ('meta','google','other')),
  campaign_id   text,
  campaign_name text,
  ad_set_id     text,
  ad_set_name   text,
  spend_inr     numeric(12,2) DEFAULT 0,
  impressions   integer DEFAULT 0,
  clicks        integer DEFAULT 0,
  leads         integer DEFAULT 0,
  conversions   integer DEFAULT 0,
  cpl_inr       numeric(10,2),   -- cost per lead
  cpa_inr       numeric(10,2),   -- cost per acquisition
  roas          numeric(8,4),    -- return on ad spend
  raw_data      jsonb DEFAULT '{}',
  synced_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, platform, campaign_id, ad_set_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_spend_date ON public.ad_spend(date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_spend_platform ON public.ad_spend(platform, date DESC);

ALTER TABLE public.ad_spend ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_ad_spend" ON public.ad_spend;
CREATE POLICY "service_role_all_ad_spend" ON public.ad_spend USING (true) WITH CHECK (true);

-- ============================================================
-- NEW TABLE: whatsapp_conversations
-- AI chatbot (Priya) conversation state per phone number
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 text NOT NULL,  -- E.164
  lead_id               uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  -- Qualification state machine
  qualification_stage   text NOT NULL DEFAULT 'greeting'
    CHECK (qualification_stage IN ('greeting','budget','location','timeline','property_type','purpose','loan','complete')),
  extracted_data        jsonb NOT NULL DEFAULT '{}', -- collected fields
  -- Message history (ordered array of {role, content, ts})
  messages              jsonb NOT NULL DEFAULT '[]',
  -- Meta
  last_message_at       timestamptz NOT NULL DEFAULT now(),
  window_expires_at     timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active             boolean DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_phone ON public.whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_stage ON public.whatsapp_conversations(qualification_stage);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_active ON public.whatsapp_conversations(is_active, last_message_at DESC);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_whatsapp_conversations" ON public.whatsapp_conversations;
CREATE POLICY "service_role_all_whatsapp_conversations" ON public.whatsapp_conversations USING (true) WITH CHECK (true);

-- ============================================================
-- ENHANCE site_visit_bookings
-- Add QR check-in fields if not present
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='site_visit_bookings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='qr_code') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN qr_code text UNIQUE;
      CREATE INDEX IF NOT EXISTS idx_svb_qr ON public.site_visit_bookings(qr_code);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='checked_in_at') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN checked_in_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='lead_id') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='booking_token_inr') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN booking_token_inr integer DEFAULT 25000;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='razorpay_order_id') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN razorpay_order_id text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='razorpay_payment_id') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN razorpay_payment_id text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='payment_status') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded','failed'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='capi_offline_fired') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN capi_offline_fired boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='n8n_triggered') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN n8n_triggered boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_visit_bookings' AND column_name='visit_notes') THEN
      ALTER TABLE public.site_visit_bookings ADD COLUMN visit_notes text;
    END IF;
  END IF;
END $$;

-- ============================================================
-- HELPER FUNCTION: normalize phone to E.164
-- ============================================================
CREATE OR REPLACE FUNCTION public.normalize_phone_e164(p text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  cleaned text;
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  -- Remove everything except digits and leading +
  cleaned := regexp_replace(p, '[^\d+]', '', 'g');
  -- Already E.164
  IF cleaned ~ '^\+91\d{10}$' THEN RETURN cleaned; END IF;
  -- 10-digit Indian number
  IF cleaned ~ '^\d{10}$' THEN RETURN '+91' || cleaned; END IF;
  -- 91XXXXXXXXXX
  IF cleaned ~ '^91\d{10}$' THEN RETURN '+' || cleaned; END IF;
  -- +1 etc — return as-is
  IF left(cleaned,1) = '+' THEN RETURN cleaned; END IF;
  RETURN NULL;
END;
$$;

-- ============================================================
-- TRIGGER: auto-normalize phone on leads insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION public.leads_normalize_phone()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone_normalized := public.normalize_phone_e164(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_normalize_phone ON public.leads;
CREATE TRIGGER trg_leads_normalize_phone
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_normalize_phone();

-- ============================================================
-- TRIGGER: auto-set updated_at on new tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_sales_team_updated_at ON public.sales_team;
CREATE TRIGGER trg_sales_team_updated_at
  BEFORE UPDATE ON public.sales_team
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_channel_partners_updated_at ON public.channel_partners;
CREATE TRIGGER trg_channel_partners_updated_at
  BEFORE UPDATE ON public.channel_partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_whatsapp_conv_updated_at ON public.whatsapp_conversations;
CREATE TRIGGER trg_whatsapp_conv_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
