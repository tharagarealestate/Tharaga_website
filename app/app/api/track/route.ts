/**
 * Module 9: Behavioral Signal API Route
 * Receives signals from lib/tracker.ts and stores in Supabase behavioral_signals.
 * Uses SERVICE ROLE KEY — no auth required for anonymous tracking.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.session_id || !body.signal_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const signal: Record<string, unknown> = {
      session_id: body.session_id,
      signal_type: body.signal_type,
      signal_value: body.signal_value || {},
      page_url: body.page_url,
    }

    // Optional fields
    if (body.property_id) signal.property_id = body.property_id
    if (body.lead_id) signal.lead_id = body.lead_id
    if (body.utm_source) signal.utm_source = body.utm_source
    if (body.utm_medium) signal.utm_medium = body.utm_medium
    if (body.utm_campaign) signal.utm_campaign = body.utm_campaign
    if (body.fbclid) signal.fbclid = body.fbclid
    if (body.gclid) signal.gclid = body.gclid
    if (body.fbc) signal.fbc = body.fbc
    if (body.fbp) signal.fbp = body.fbp
    if (body.user_agent || req.headers.get('user-agent')) {
      signal.user_agent = body.user_agent || req.headers.get('user-agent')
    }

    const { error } = await supabase
      .from('behavioral_signals')
      .insert(signal)

    if (error) {
      console.error('[track] Supabase insert error:', error)
      // Return 200 anyway — tracking failures must never break UX
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[track] Error:', err)
    return NextResponse.json({ ok: true }, { status: 200 }) // Always 200
  }
}

// Allow sendBeacon (no CORS preflight needed for same-origin)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
