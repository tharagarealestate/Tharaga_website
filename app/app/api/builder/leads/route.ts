/**
 * /api/builder/leads — Server-side leads fetcher using service role key.
 *
 * WHY this route exists (root cause of 8s skeleton loading):
 * Supabase REST from the BROWSER has an 8-12s cold start latency because
 * every page navigation severs the TCP connection and a new one must be
 * established through TLS handshake + Supabase edge infra warm-up.
 *
 * Netlify serverless functions keep a WARM Node.js process with a persistent
 * HTTP/2 connection to Supabase. Routing through this API endpoint reduces
 * the skeleton wait time from 8-12s → <1s.
 *
 * Uses service role key so RLS is bypassed — auth enforced manually:
 * admin sees ALL leads, builder sees only their own.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser } from '../_lib/auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const authed = await getBuilderUser(req)
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, isAdmin, serviceClient } = authed

    const url        = new URL(req.url)
    const limitParam = Number(url.searchParams.get('limit') || '300')
    const limit      = Math.min(Math.max(limitParam, 1), 1000) // clamp 1–1000

    // Build query — service role bypasses RLS; filter manually by role
    let q = serviceClient
      .from('leads')
      .select(
        'id, name, email, phone, phone_normalized, status, smartscore, score, ' +
        'tier, ai_stage, qualification_data, assigned_to, sla_deadline, budget, ' +
        'purpose, source, utm_source, utm_medium, utm_campaign, score_breakdown, ' +
        'preferred_location, property_type_interest, property_id, builder_id, ' +
        'created_at, updated_at'
      )
      .order('smartscore', { ascending: false, nullsFirst: false })
      .limit(limit)

    // Admin sees every lead; builder sees only their own
    if (!isAdmin) {
      q = q.eq('builder_id', user.id)
    }

    const { data, error } = await q

    if (error) {
      console.error('[/api/builder/leads] DB error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const res = NextResponse.json({ leads: data ?? [] })
    // Private (user-specific data) — no CDN or browser caching
    res.headers.set('Cache-Control', 'private, no-store')
    return res
  } catch (e: any) {
    console.error('[/api/builder/leads] Unexpected error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
