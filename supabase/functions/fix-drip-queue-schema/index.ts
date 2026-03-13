// One-shot edge function: fix email_sequence_queue schema + harden ALL leads triggers
// Problems fixed:
//   1) email_sequence_queue.lead_id UUID → BIGINT (leads.id is BIGINT)
//   2) email_sequence_queue.builder_id NOT NULL → nullable (public leads may have null)
//   3) trigger_update_performance_on_lead: missing/broken EXCEPTION handler causes lead INSERT to fail
//   4) calculate_listing_performance: no top-level exception handler

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ has_db_url: !!dbUrl }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!dbUrl) {
    return new Response(JSON.stringify({ success: false, error: 'No SUPABASE_DB_URL' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts")
    const client = new Client(dbUrl)
    await client.connect()

    const fixes: string[] = []

    // ── Fix 1: Harden trigger_update_performance_on_lead ──────────────────────
    // This trigger fires AFTER INSERT on leads and calls calculate_listing_performance.
    // If that function throws (e.g. FK violation), the lead INSERT fails.
    // Fix: wrap the entire body in EXCEPTION WHEN OTHERS so it's always non-fatal.
    await client.queryArray(`
      CREATE OR REPLACE FUNCTION public.trigger_update_performance_on_lead()
      RETURNS TRIGGER AS $$
      DECLARE
        v_property_uuid UUID;
      BEGIN
        BEGIN
          IF NEW.property_id IS NOT NULL THEN
            BEGIN
              v_property_uuid := NEW.property_id::uuid;
              PERFORM public.calculate_listing_performance(v_property_uuid);
            EXCEPTION WHEN OTHERS THEN
              RAISE WARNING '[PerfTrigger] error processing lead % property %: %', NEW.id, NEW.property_id, SQLERRM;
            END;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING '[PerfTrigger] unexpected error for lead %: %', NEW.id, SQLERRM;
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    fixes.push('trigger_update_performance_on_lead: double EXCEPTION handler applied')

    // ── Fix 2: Wrap calculate_listing_performance in exception safety ─────────
    // The function itself does an UPSERT into listing_performance_metrics.
    // If the property_id FK doesn't exist, it throws. Add top-level handler.
    await client.queryArray(`
      CREATE OR REPLACE FUNCTION public.calculate_listing_performance(p_property_id UUID)
      RETURNS VOID AS $$
      DECLARE
        v_total_views INTEGER := 0;
        v_unique_viewers INTEGER := 0;
        v_avg_time DECIMAL(10,2) := 0;
        v_bounce_rate DECIMAL(5,2) := 0;
        v_saves INTEGER := 0;
        v_shares INTEGER := 0;
        v_contact_requests INTEGER := 0;
        v_leads INTEGER := 0;
        v_qualified_leads INTEGER := 0;
        v_hot_leads INTEGER := 0;
        v_view_to_save DECIMAL(5,2) := 0;
        v_view_to_contact DECIMAL(5,2) := 0;
        v_last_7_days INTEGER := 0;
        v_last_30_days INTEGER := 0;
        v_trend TEXT := 'stable';
        v_overall_score DECIMAL(5,2) := 0;
        v_market_position INTEGER := 1;
        v_property RECORD;
      BEGIN
        -- Verify property exists before doing anything
        SELECT * INTO v_property FROM public.properties WHERE id = p_property_id;
        IF NOT FOUND THEN
          RAISE WARNING '[ListingPerf] property % not found — skipping', p_property_id;
          RETURN;
        END IF;

        -- Get behavior tracking metrics from user_behavior table
        SELECT
          COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' THEN id END)::INTEGER,
          COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' THEN user_id END)::INTEGER,
          AVG(CASE WHEN behavior_type = 'property_view' THEN duration ELSE NULL END)::DECIMAL(10,2),
          COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' AND duration < 10 THEN id END)::DECIMAL(5,2) /
            NULLIF(COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' THEN id END), 0) * 100,
          COUNT(DISTINCT CASE WHEN behavior_type = 'saved_property' THEN id END)::INTEGER,
          COUNT(DISTINCT CASE WHEN behavior_type = 'compared_properties' THEN id END)::INTEGER,
          COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' AND timestamp > NOW() - INTERVAL '7 days' THEN id END)::INTEGER,
          COUNT(DISTINCT CASE WHEN behavior_type = 'property_view' AND timestamp > NOW() - INTERVAL '30 days' THEN id END)::INTEGER
        INTO
          v_total_views, v_unique_viewers, v_avg_time, v_bounce_rate,
          v_saves, v_shares, v_last_7_days, v_last_30_days
        FROM public.user_behavior
        WHERE property_id = p_property_id;

        -- Get lead metrics
        SELECT
          COUNT(*)::INTEGER,
          COUNT(*) FILTER (WHERE smartscore_v2 >= 70)::INTEGER,
          COUNT(*) FILTER (WHERE smartscore_v2 >= 90)::INTEGER
        INTO v_leads, v_qualified_leads, v_hot_leads
        FROM public.leads
        WHERE property_id = p_property_id::text;

        -- Get contact requests
        SELECT COUNT(*)::INTEGER INTO v_contact_requests
        FROM public.leads
        WHERE property_id = p_property_id::text
          AND status IN ('contacted', 'interested', 'qualified');

        -- Calculate conversion rates
        v_view_to_save := CASE WHEN v_total_views > 0 THEN (v_saves::DECIMAL / v_total_views * 100) ELSE 0 END;
        v_view_to_contact := CASE WHEN v_total_views > 0 THEN (v_contact_requests::DECIMAL / v_total_views * 100) ELSE 0 END;

        -- View trend
        IF v_last_7_days > (v_last_30_days / 4.0) THEN v_trend := 'increasing';
        ELSIF v_last_7_days < (v_last_30_days / 4.0 * 0.7) THEN v_trend := 'decreasing';
        ELSE v_trend := 'stable';
        END IF;

        -- Overall score
        v_overall_score := (
          (LEAST(v_total_views::DECIMAL / 100.0, 1.0) * 20) +
          (LEAST(COALESCE(v_avg_time, 0)::DECIMAL / 120.0, 1.0) * 15) +
          (v_view_to_save * 0.25) +
          (v_view_to_contact * 0.30) +
          ((100 - COALESCE(v_bounce_rate, 50)) * 0.10)
        );

        -- Market position
        SELECT COUNT(*)::INTEGER + 1 INTO v_market_position
        FROM public.listing_performance_metrics lpm
        INNER JOIN public.properties p ON p.id = lpm.property_id
        WHERE p.location = v_property.location
          AND p.property_type = v_property.property_type
          AND p.bedrooms = v_property.bedrooms
          AND lpm.overall_score > v_overall_score
          AND p.id != p_property_id;

        -- Upsert performance metrics
        INSERT INTO public.listing_performance_metrics (
          property_id, total_views, unique_viewers, avg_time_on_listing_sec, bounce_rate,
          saves_count, shares_count, contact_requests, leads_generated, qualified_leads, hot_leads,
          view_to_save_rate, view_to_contact_rate, last_7_days_views, last_30_days_views,
          view_trend, overall_score, market_position, calculated_at, updated_at
        ) VALUES (
          p_property_id, v_total_views, v_unique_viewers, COALESCE(v_avg_time, 0), COALESCE(v_bounce_rate, 0),
          v_saves, v_shares, v_contact_requests, v_leads, v_qualified_leads, v_hot_leads,
          v_view_to_save, v_view_to_contact, v_last_7_days, v_last_30_days,
          v_trend, v_overall_score, v_market_position, NOW(), NOW()
        )
        ON CONFLICT (property_id) DO UPDATE SET
          total_views = EXCLUDED.total_views,
          unique_viewers = EXCLUDED.unique_viewers,
          avg_time_on_listing_sec = EXCLUDED.avg_time_on_listing_sec,
          bounce_rate = EXCLUDED.bounce_rate,
          saves_count = EXCLUDED.saves_count,
          shares_count = EXCLUDED.shares_count,
          contact_requests = EXCLUDED.contact_requests,
          leads_generated = EXCLUDED.leads_generated,
          qualified_leads = EXCLUDED.qualified_leads,
          hot_leads = EXCLUDED.hot_leads,
          view_to_save_rate = EXCLUDED.view_to_save_rate,
          view_to_contact_rate = EXCLUDED.view_to_contact_rate,
          last_7_days_views = EXCLUDED.last_7_days_views,
          last_30_days_views = EXCLUDED.last_30_days_views,
          view_trend = EXCLUDED.view_trend,
          overall_score = EXCLUDED.overall_score,
          market_position = EXCLUDED.market_position,
          calculated_at = NOW(),
          updated_at = NOW();

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[ListingPerf] error for property %: %', p_property_id, SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `)
    fixes.push('calculate_listing_performance: added property existence check + top-level EXCEPTION handler')

    // ── Fix 2b: Drop builder_id and property_id FK constraints on email_sequence_queue
    //    These are optional context columns — FK violations block all drip inserts.
    //    Keep lead_id FK (required). Drop builder_id/property_id FKs (optional metadata).
    const dropFkResult = await client.queryArray(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'email_sequence_queue'
        AND constraint_type = 'FOREIGN KEY'
    `)
    const fkNames = dropFkResult.rows.map((r: any) => r[0] as string)
    fixes.push(`email_sequence_queue FKs found: ${fkNames.join(', ')}`)

    for (const fkName of fkNames) {
      // Drop all FKs except lead_id FK (which we'll re-add if needed)
      if (fkName !== 'email_sequence_queue_lead_id_fkey') {
        try {
          await client.queryArray(`ALTER TABLE public.email_sequence_queue DROP CONSTRAINT IF EXISTS "${fkName}"`)
          fixes.push(`email_sequence_queue: dropped FK ${fkName}`)
        } catch (e: any) {
          fixes.push(`email_sequence_queue: could not drop FK ${fkName}: ${e.message}`)
        }
      }
    }

    // ── Fix 3: email_sequence_queue.lead_id UUID → BIGINT ─────────────────────
    const tableCheck = await client.queryArray(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'email_sequence_queue'
      ) AS exists
    `)
    const tableExists = tableCheck.rows[0]?.[0]

    if (tableExists) {
      const typeCheck = await client.queryArray(`
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'email_sequence_queue' AND column_name = 'lead_id'
      `)
      const currentType = typeCheck.rows[0]?.[0] as string

      if (currentType !== 'bigint') {
        await client.queryArray(`ALTER TABLE public.email_sequence_queue DROP CONSTRAINT IF EXISTS email_sequence_queue_lead_id_fkey`)
        await client.queryArray(`ALTER TABLE public.email_sequence_queue ALTER COLUMN lead_id DROP NOT NULL`)
        await client.queryArray(`DELETE FROM public.email_sequence_queue WHERE lead_id IS NULL OR lead_id::TEXT NOT SIMILAR TO '[0-9]+'`)
        await client.queryArray(`ALTER TABLE public.email_sequence_queue ALTER COLUMN lead_id TYPE BIGINT USING lead_id::TEXT::BIGINT`)
        await client.queryArray(`ALTER TABLE public.email_sequence_queue ALTER COLUMN lead_id SET NOT NULL`)
        await client.queryArray(`ALTER TABLE public.email_sequence_queue ADD CONSTRAINT email_sequence_queue_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE`)
        fixes.push('email_sequence_queue.lead_id: UUID → BIGINT')
      } else {
        fixes.push('email_sequence_queue.lead_id already BIGINT — skipped')
      }

      // ── Fix 4: Make builder_id nullable ─────────────────────────────────────
      const nullableCheck = await client.queryArray(`
        SELECT is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'email_sequence_queue' AND column_name = 'builder_id'
      `)
      const isNullable = nullableCheck.rows[0]?.[0] as string

      if (isNullable === 'NO') {
        await client.queryArray(`ALTER TABLE public.email_sequence_queue DROP CONSTRAINT IF EXISTS email_sequence_queue_builder_id_fkey`)
        await client.queryArray(`ALTER TABLE public.email_sequence_queue ALTER COLUMN builder_id DROP NOT NULL`)
        await client.queryArray(`ALTER TABLE public.email_sequence_queue ADD CONSTRAINT email_sequence_queue_builder_id_fkey FOREIGN KEY (builder_id) REFERENCES auth.users(id) ON DELETE CASCADE`)
        fixes.push('email_sequence_queue.builder_id: NOT NULL removed, FK re-added as nullable')
      } else {
        fixes.push('email_sequence_queue.builder_id already nullable — skipped')
      }
    } else {
      fixes.push('email_sequence_queue table not found — skipped')
    }

    // ── Fix 5: Add ALL potentially missing columns to email_sequence_queue ──────
    if (tableExists) {
      // Get existing columns
      const colResult = await client.queryArray(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'email_sequence_queue'
        ORDER BY ordinal_position
      `)
      const existingCols = new Set(colResult.rows.map((r: any) => r[0] as string))
      fixes.push(`email_sequence_queue existing columns: ${[...existingCols].join(', ')}`)

      // Add each missing column individually (IF NOT EXISTS is safest)
      const colsToAdd: Array<[string, string]> = [
        ['property_id',        'UUID REFERENCES public.properties(id) ON DELETE SET NULL'],
        ['sequence_position',  'INTEGER NOT NULL DEFAULT 1'],
        ['scheduled_for',      'TIMESTAMPTZ NOT NULL DEFAULT NOW()'],
        ['subject',            'TEXT NOT NULL DEFAULT \'\''],
        ['html_content',       'TEXT NOT NULL DEFAULT \'\''],
        ['text_content',       'TEXT'],
        ['cta',                'TEXT'],
        ['status',             "TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent','delivered','cancelled','paused','deferred'))"],
        ['provider_message_id','TEXT'],
        ['sent_at',            'TIMESTAMPTZ'],
        ['attempts',           'INTEGER DEFAULT 0'],
        ['max_attempts',       'INTEGER DEFAULT 3'],
        ['paused_reason',      'TEXT'],
        ['paused_at',          'TIMESTAMPTZ'],
        ['metadata',           "JSONB DEFAULT '{}'::jsonb"],
        ['buyer_email',        'TEXT'],
        ['campaign_type',      "TEXT DEFAULT 'lead_nurture'"],
        ['updated_at',         'TIMESTAMPTZ NOT NULL DEFAULT NOW()'],
      ]

      for (const [col, def] of colsToAdd) {
        if (!existingCols.has(col)) {
          try {
            await client.queryArray(`ALTER TABLE public.email_sequence_queue ADD COLUMN IF NOT EXISTS ${col} ${def}`)
            fixes.push(`email_sequence_queue: added column ${col}`)
          } catch (e: any) {
            fixes.push(`email_sequence_queue: FAILED to add ${col}: ${e.message}`)
          }
        }
      }
    }

    await client.end()

    return new Response(JSON.stringify({
      success: true,
      message: 'All fixes applied: listing_performance trigger + email_sequence_queue schema',
      fixes,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message, stack: err.stack }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
