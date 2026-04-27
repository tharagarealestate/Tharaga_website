/**
 * GET /api/admin/setup-db
 *
 * Admin-only endpoint that:
 *  1. Checks whether the required tables exist (social_posts, behavior_events)
 *  2. Attempts to create any missing tables via Supabase RPC if possible
 *  3. Returns status + ready-to-run SQL for any tables that still need creation
 *
 * Protected: only tharagarealestate@gmail.com can call this.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser, getServiceSupabase } from '../../builder/_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Table definitions ────────────────────────────────────────────────────────

const TABLES: Array<{
  name: string
  checkSql: string
  createSql: string
}> = [
  {
    name: 'social_posts',
    checkSql: `SELECT to_regclass('public.social_posts') IS NOT NULL AS exists`,
    createSql: `
CREATE TABLE IF NOT EXISTS social_posts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id        uuid        REFERENCES builder_profiles(id) ON DELETE CASCADE,
  property_id       text,
  caption           text        NOT NULL,
  platforms         text[]      DEFAULT '{}',
  post_type         text        DEFAULT 'property',
  instagram_post_id text,
  facebook_post_id  text,
  status            text        DEFAULT 'queued',
  created_at        timestamptz DEFAULT now(),
  published_at      timestamptz
);
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_posts' AND policyname='builders_own_posts') THEN
    CREATE POLICY "builders_own_posts" ON social_posts FOR ALL USING (builder_id = auth.uid());
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_social_posts_builder ON social_posts(builder_id, created_at DESC);`.trim(),
  },
  {
    name: 'behavior_events',
    checkSql: `SELECT to_regclass('public.behavior_events') IS NOT NULL AS exists`,
    createSql: `
CREATE TABLE IF NOT EXISTS behavior_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id       uuid        REFERENCES builder_profiles(id) ON DELETE CASCADE,
  property_id      text,
  session_id       text,
  event_type       text        NOT NULL,
  scroll_depth     integer,
  time_on_page_sec integer,
  cta_type         text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='behavior_events' AND policyname='builders_own_events') THEN
    CREATE POLICY "builders_own_events" ON behavior_events FOR ALL USING (builder_id = auth.uid());
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_behavior_events_builder ON behavior_events(builder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_property ON behavior_events(property_id, created_at DESC);`.trim(),
  },
]

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Admin only
  const authed = await getBuilderUser(req)
  if (!authed || !authed.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = getServiceSupabase()
  const results: Array<{
    table: string
    existed: boolean
    created: boolean
    error: string | null
    sql: string
  }> = []

  for (const t of TABLES) {
    let existed = false
    let created = false
    let createError: string | null = null

    // ── 1. Check if table exists ──────────────────────────────────────────
    try {
      // Lightweight probe: SELECT 1 row — if table missing, Supabase returns
      // PGRST106 (relation does not exist) rather than empty rows
      const { error: probeErr } = await serviceClient
        .from(t.name as any)
        .select('id')
        .limit(1)
        .maybeSingle()

      // PGRST106 = table doesn't exist; PGRST116 = table exists, no rows
      if (!probeErr || probeErr.code === 'PGRST116') {
        existed = true
      }
    } catch { /* continue */ }

    // ── 2. Try to create if missing ───────────────────────────────────────
    if (!existed) {
      try {
        // Attempt via exec_sql RPC (only works if the function exists in DB)
        const { error: rpcErr } = await serviceClient.rpc('exec_sql' as any, {
          query: t.createSql,
        })
        if (!rpcErr) {
          created = true
        } else {
          createError = rpcErr.message
        }
      } catch (e: any) {
        createError = e?.message || 'RPC not available'
      }
    }

    results.push({
      table:   t.name,
      existed,
      created,
      error:   createError,
      sql:     existed ? '' : t.createSql,
    })
  }

  const allReady  = results.every(r => r.existed || r.created)
  const needsSQL  = results.filter(r => !r.existed && !r.created)
  const combinedSQL = needsSQL.map(r => `-- ${r.table}\n${r.sql}`).join('\n\n')

  return NextResponse.json({
    success:  allReady,
    results,
    ...(needsSQL.length > 0 && {
      action_required: true,
      instructions: 'Run the following SQL in Supabase Dashboard → SQL Editor:',
      sql_to_run: combinedSQL,
      supabase_url: 'https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new',
    }),
  })
}
