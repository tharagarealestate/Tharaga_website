/**
 * security-migrate — apply FK indexes + fix null listing_status properties
 */
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

Deno.serve(async (req: Request) => {
  try {
    const secret = req.headers.get('x-migration-secret')
    if (secret !== (Deno.env.get('MIGRATION_SECRET') ?? 'tharaga-sec-2026')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const dbUrl = Deno.env.get('SUPABASE_DB_URL')
    if (!dbUrl) return new Response(JSON.stringify({ error: 'No SUPABASE_DB_URL' }), { status: 500 })

    const pool = new Pool(dbUrl, 1, true)
    const out: Record<string, unknown> = {}

    const s = (v: unknown): unknown => typeof v === 'bigint' ? Number(v) : v
    const serialise = (_: string, v: unknown) => s(v)

    try {
      const conn = await pool.connect()
      try {

        // ── Fix null listing_status → active ─────────────────────────────
        try {
          await conn.queryObject(`
            UPDATE public.properties
            SET listing_status = 'active'
            WHERE listing_status IS NULL
          `)
          const r = await conn.queryObject(`
            SELECT
              COUNT(*) FILTER (WHERE listing_status='active')   AS active,
              COUNT(*) FILTER (WHERE listing_status IS NULL)    AS still_null,
              COUNT(*) AS total
            FROM public.properties
          `)
          out['properties_fix'] = r.rows[0]
        } catch(e) { out['properties_fix_err'] = String(e) }

        // ── Create FK indexes (migration 078) ────────────────────────────
        const indexes = [
          ['idx_ai_generated_content_approved_by',       'ai_generated_content(approved_by)'],
          ['idx_automation_queue_execution_id',           'automation_queue(execution_id)'],
          ['idx_builder_availability_property_id',        'builder_availability(property_id)'],
          ['idx_builder_subscriptions_plan_id',           'builder_subscriptions(plan_id)'],
          ['idx_builder_verifications_rera_registration_id', 'builder_verifications(rera_registration_id)'],
          ['idx_buyer_segments_created_by',               'buyer_segments(created_by)'],
          ['idx_campaign_emails_property_id',             'campaign_emails(property_id)'],
          ['idx_commission_transactions_property_id',     'commission_transactions(property_id)'],
          ['idx_competitor_analysis_property_id',         'competitor_analysis(property_id)'],
          ['idx_competitor_analysis_competitor_property_id', 'competitor_analysis(competitor_property_id)'],
          ['idx_content_generation_queue_property_id',    'content_generation_queue(property_id)'],
          ['idx_content_templates_created_by',            'content_templates(created_by)'],
          ['idx_conversations_lead_id',                   'conversations(lead_id)'],
          ['idx_doc_search_analytics_clicked_result',     'doc_search_analytics(clicked_result_feature_key)'],
          ['idx_document_permissions_granted_by',         'document_permissions(granted_by)'],
          ['idx_document_share_links_created_by',         'document_share_links(created_by)'],
          ['idx_document_share_links_document_id',        'document_share_links(document_id)'],
          ['idx_email_deliveries_template_id',            'email_deliveries(template_id)'],
          ['idx_job_execution_logs_trigger_event_id',     'job_execution_logs(trigger_event_id)'],
          ['idx_job_queue_execution_log_id',              'job_queue(execution_log_id)'],
          ['idx_properties_builder_id_status',            'properties(builder_id, listing_status)'],
          ['idx_properties_listed_at_desc',               'properties(listed_at DESC)'],
          ['idx_leads_created_at_desc',                   'leads(created_at DESC)'],
          ['idx_audit_logs_user_id',                      'audit_logs(user_id)'],
          ['idx_interactions_created_at',                 'interactions(created_at DESC)'],
        ]

        const indexResults: { name: string; ok: boolean; note: string }[] = []
        for (const [name, cols] of indexes) {
          try {
            await conn.queryObject(
              `CREATE INDEX IF NOT EXISTS ${name} ON public.${cols}`
            )
            indexResults.push({ name, ok: true, note: 'created/already exists' })
          } catch(e) {
            indexResults.push({ name, ok: false, note: String(e).slice(0, 100) })
          }
        }
        out['indexes_created'] = indexResults

        // ── Final verification ───────────────────────────────────────────
        try {
          const r = await conn.queryObject(`
            SELECT
              (SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=false)::int AS tables_no_rls,
              (SELECT COUNT(*) FROM public.properties WHERE listing_status IS NULL)::int  AS null_status_props,
              (SELECT COUNT(*) FROM public.properties WHERE listing_status='active')::int AS active_props,
              (SELECT COUNT(*) FROM public.properties)::int AS total_props,
              (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'idx_%')::int AS total_indexes
          `)
          out['final_state'] = r.rows[0]
        } catch(e) { out['final_state_err'] = String(e) }

      } finally {
        conn.release()
      }
    } finally {
      await pool.end()
    }

    return new Response(JSON.stringify({ ok: true, data: out }, serialise, 2), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch(topErr: unknown) {
    return new Response(
      JSON.stringify({ ok: false, error: topErr instanceof Error ? topErr.message : String(topErr) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
