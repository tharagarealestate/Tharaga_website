import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

Deno.serve(async (req) => {
  const secret = req.headers.get("x-secret");
  if (secret !== "apply-015") return new Response("Unauthorized", { status: 401 });

  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  const sql = postgres(dbUrl, { ssl: "require" });
  const results: string[] = [];

  const stmts = [
    `CREATE EXTENSION IF NOT EXISTS vector`,

    // behavioral_signals — no FK constraints to avoid permission issues
    `CREATE TABLE IF NOT EXISTS public.behavioral_signals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id text NOT NULL,
      lead_id uuid,
      signal_type text NOT NULL,
      signal_value jsonb NOT NULL DEFAULT '{}',
      page_url text,
      property_id uuid,
      utm_source text, utm_medium text, utm_campaign text,
      fbclid text, gclid text, fbc text, fbp text,
      user_agent text, ip_address text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_behavioral_signals_session ON public.behavioral_signals(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_behavioral_signals_lead ON public.behavioral_signals(lead_id)`,
    `ALTER TABLE public.behavioral_signals ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "service_role_all_behavioral_signals" ON public.behavioral_signals`,
    `CREATE POLICY "service_role_all_behavioral_signals" ON public.behavioral_signals USING (true) WITH CHECK (true)`,

    // lead_events — no FK constraints
    `CREATE TABLE IF NOT EXISTS public.lead_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id uuid NOT NULL,
      event_type text NOT NULL,
      actor_id uuid,
      actor_type text CHECK (actor_type IN ('system','sales_exec','channel_partner','ai','admin')),
      old_value jsonb DEFAULT '{}', new_value jsonb DEFAULT '{}',
      notes text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id)`,
    `ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "service_role_all_lead_events" ON public.lead_events`,
    `CREATE POLICY "service_role_all_lead_events" ON public.lead_events USING (true) WITH CHECK (true)`,

    // sales_team
    `CREATE TABLE IF NOT EXISTS public.sales_team (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id uuid,
      name text NOT NULL, email text UNIQUE NOT NULL, phone text NOT NULL,
      whatsapp_number text, is_active boolean DEFAULT true,
      tier text NOT NULL DEFAULT 'exec' CHECK (tier IN ('senior','exec','junior')),
      conversion_rate numeric(5,4) DEFAULT 0,
      avg_response_time integer DEFAULT 0,
      leads_handled integer DEFAULT 0, leads_converted integer DEFAULT 0,
      last_assigned_at timestamptz,
      working_hours_start integer DEFAULT 9, working_hours_end integer DEFAULT 21,
      max_daily_leads integer DEFAULT 20, current_daily_count integer DEFAULT 0,
      count_reset_date date DEFAULT CURRENT_DATE,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `ALTER TABLE public.sales_team ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "service_role_all_sales_team" ON public.sales_team`,
    `CREATE POLICY "service_role_all_sales_team" ON public.sales_team USING (true) WITH CHECK (true)`,

    // channel_partners
    `CREATE TABLE IF NOT EXISTS public.channel_partners (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL, company text, email text UNIQUE, phone text NOT NULL,
      whatsapp_number text, rera_number text, is_active boolean DEFAULT true,
      commission_rate numeric(4,2) DEFAULT 2.00,
      leads_sent integer DEFAULT 0, leads_converted integer DEFAULT 0,
      conversion_rate numeric(5,4) DEFAULT 0, last_assigned_at timestamptz,
      cities text[] DEFAULT ARRAY['Chennai'], localities text[],
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `ALTER TABLE public.channel_partners ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "service_role_all_channel_partners" ON public.channel_partners`,
    `CREATE POLICY "service_role_all_channel_partners" ON public.channel_partners USING (true) WITH CHECK (true)`,

    // ad_spend
    `CREATE TABLE IF NOT EXISTS public.ad_spend (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      date date NOT NULL,
      platform text NOT NULL CHECK (platform IN ('meta','google','other')),
      campaign_id text, campaign_name text, ad_set_id text, ad_set_name text,
      spend_inr numeric(12,2) DEFAULT 0, impressions integer DEFAULT 0,
      clicks integer DEFAULT 0, leads integer DEFAULT 0, conversions integer DEFAULT 0,
      cpl_inr numeric(10,2), cpa_inr numeric(10,2), roas numeric(8,4),
      raw_data jsonb DEFAULT '{}', synced_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(date, platform, campaign_id, ad_set_id)
    )`,
    `ALTER TABLE public.ad_spend ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "service_role_all_ad_spend" ON public.ad_spend`,
    `CREATE POLICY "service_role_all_ad_spend" ON public.ad_spend USING (true) WITH CHECK (true)`,

    // whatsapp_conversations — no FK constraints
    `CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone text NOT NULL,
      lead_id uuid,
      qualification_stage text NOT NULL DEFAULT 'greeting'
        CHECK (qualification_stage IN ('greeting','budget','location','timeline','property_type','purpose','loan','complete')),
      extracted_data jsonb NOT NULL DEFAULT '{}',
      messages jsonb NOT NULL DEFAULT '[]',
      last_message_at timestamptz NOT NULL DEFAULT now(),
      window_expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
      is_active boolean DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(phone)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_phone ON public.whatsapp_conversations(phone)`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_stage ON public.whatsapp_conversations(qualification_stage)`,
    `ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "service_role_all_whatsapp_conversations" ON public.whatsapp_conversations`,
    `CREATE POLICY "service_role_all_whatsapp_conversations" ON public.whatsapp_conversations USING (true) WITH CHECK (true)`,

    // Enhance leads
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone_normalized text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone_hash text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email_hash text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS smartscore integer DEFAULT 0`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score_breakdown jsonb DEFAULT '{}'`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS classification text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fbclid text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gclid text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fbc text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fbp text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS event_id text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS capi_lead_fired boolean DEFAULT false`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS capi_visit_fired boolean DEFAULT false`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS capi_purchase_fired boolean DEFAULT false`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to uuid`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assignment_type text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sla_deadline timestamptz`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS zoho_lead_id text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_qualified boolean DEFAULT false`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS qualification_data jsonb DEFAULT '{}'`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS preferred_location text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS timeline_months integer`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS property_type_interest text`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS loan_required boolean`,
    `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS purpose text`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone_normalized ON public.leads(phone_normalized) WHERE phone_normalized IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_leads_smartscore ON public.leads(smartscore DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_classification ON public.leads(classification)`,

    // site_visit_bookings
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS qr_code text`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS checked_in_at timestamptz`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS lead_id uuid`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS booking_token_inr integer DEFAULT 25000`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS razorpay_order_id text`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id text`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS capi_offline_fired boolean DEFAULT false`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS n8n_triggered boolean DEFAULT false`,
    `ALTER TABLE public.site_visit_bookings ADD COLUMN IF NOT EXISTS visit_notes text`,

    // Triggers and functions
    `CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $fn$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $fn$`,
    `DROP TRIGGER IF EXISTS trg_sales_team_updated_at ON public.sales_team`,
    `CREATE TRIGGER trg_sales_team_updated_at BEFORE UPDATE ON public.sales_team FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()`,
    `DROP TRIGGER IF EXISTS trg_channel_partners_updated_at ON public.channel_partners`,
    `CREATE TRIGGER trg_channel_partners_updated_at BEFORE UPDATE ON public.channel_partners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()`,
    `DROP TRIGGER IF EXISTS trg_whatsapp_conv_updated_at ON public.whatsapp_conversations`,
    `CREATE TRIGGER trg_whatsapp_conv_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()`,
  ];

  for (const stmt of stmts) {
    try {
      await sql.unsafe(stmt);
      results.push(`OK: ${stmt.trim().slice(0, 80)}`);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("multiple primary")) {
        results.push(`SKIP: ${stmt.trim().slice(0, 80)}`);
      } else {
        results.push(`ERR: ${stmt.trim().slice(0, 80)} => ${msg.slice(0, 100)}`);
      }
    }
  }

  await sql.end();
  const errors = results.filter(r => r.startsWith("ERR"));
  return Response.json({ total: stmts.length, errors: errors.length, results });
});
