/**
 * THARAGA — Lead Ingest API
 * POST /api/leads/ingest
 *
 * The REAL lead capture endpoint. Receives form submissions from the website,
 * calculates SmartScore, inserts into Supabase leads table, fires Meta CAPI,
 * and sets SLA deadline for HOT leads.
 *
 * No auth required — public endpoint. Rate-limited by phone number dedup.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Service client (bypasses RLS so leads always insert) ────────────────────
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── SmartScore calculation ────────────────────────────────────────────────────
// Scores a new lead 0-100 based on form data.
// Breakdown:
//   Budget intent  (0-30): bigger budget = higher score
//   Timeline       (0-25): sooner = higher score
//   Purpose        (0-15): self_use > investment > rental
//   Source quality (0-15): direct > meta > organic
//   Contact info   (0-15): both phone+email > phone only
function calcSmartScore(params: {
  budget?: number          // in lakhs
  timeline_months?: number // 1, 3, 6, 12
  purpose?: string         // self_use | investment | rental
  source?: string          // meta | google | organic | direct
  has_email: boolean
  has_phone: boolean
}): number {
  let score = 0

  // Budget (0-30)
  if (params.budget) {
    if (params.budget >= 200) score += 30
    else if (params.budget >= 120) score += 24
    else if (params.budget >= 80)  score += 20
    else if (params.budget >= 50)  score += 14
    else score += 8
  }

  // Timeline (0-25)
  if (params.timeline_months) {
    if (params.timeline_months <= 1)  score += 25
    else if (params.timeline_months <= 3) score += 20
    else if (params.timeline_months <= 6) score += 12
    else score += 5
  } else {
    score += 8 // unknown = moderate
  }

  // Purpose (0-15)
  if (params.purpose === 'self_use')   score += 15
  else if (params.purpose === 'investment') score += 12
  else if (params.purpose === 'rental')     score += 8
  else score += 8

  // Source quality (0-15)
  const src = (params.source || '').toLowerCase()
  if (src.includes('meta') || src.includes('facebook') || src.includes('instagram')) score += 12
  else if (src.includes('google') || src.includes('gclid')) score += 13
  else if (src.includes('direct') || src === '') score += 10
  else score += 8

  // Contact completeness (0-15)
  if (params.has_phone && params.has_email) score += 15
  else if (params.has_phone)  score += 12
  else if (params.has_email)  score += 8

  return Math.min(100, Math.round(score))
}

function tierFromScore(score: number): 'HOT' | 'WARM' | 'COOL' {
  if (score >= 70) return 'HOT'
  if (score >= 40) return 'WARM'
  return 'COOL'
}

// ─── Normalize phone to E.164 (Indian numbers) ────────────────────────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}

// ─── Meta CAPI fire ──────────────────────────────────────────────────────────
async function fireMetaCAPI(params: {
  event_id: string
  phone?: string
  email?: string
  fbc?: string
  fbp?: string
  budget?: number
  source_url: string
}) {
  const token = process.env.META_CAPI_ACCESS_TOKEN
  const pixelId = process.env.META_PIXEL_ID
  if (!token || !pixelId) return

  const userData: Record<string, string> = {}
  if (params.phone) {
    const digits = params.phone.replace(/\D/g, '')
    const normalized = digits.startsWith('91') ? digits : `91${digits}`
    userData.ph = normalized
  }
  if (params.email) userData.em = params.email.toLowerCase().trim()
  if (params.fbc)   userData.fbc = params.fbc
  if (params.fbp)   userData.fbp = params.fbp

  const eventData: Record<string, unknown> = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.event_id,
    action_source: 'website',
    event_source_url: params.source_url,
    user_data: userData,
    custom_data: {
      currency: 'INR',
      value: (params.budget || 0) * 100000,
      content_category: 'real_estate',
    },
  }

  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [eventData] }),
      }
    )
  } catch {
    // CAPI failure is non-blocking — lead still saved
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name,
      phone,
      email,
      message,
      event_id,
      property_id,
      builder_id,
      budget,         // in lakhs (number)
      timeline_months,
      purpose,
      // UTM attribution
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      // Meta cookies
      fbc,
      fbp,
    } = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    const phoneNormalized = normalizePhone(phone.trim())

    // ── SmartScore ────────────────────────────────────────────────────────────
    const smartscore = calcSmartScore({
      budget:          typeof budget === 'number' ? budget : parseFloat(budget || '0') || undefined,
      timeline_months: typeof timeline_months === 'number' ? timeline_months : parseInt(timeline_months || '0') || undefined,
      purpose,
      source:          utm_source,
      has_email:       Boolean(email?.trim()),
      has_phone:       true,
    })

    const tier = tierFromScore(smartscore)

    // HOT leads get a 15-minute SLA deadline
    const slaDeadline = tier === 'HOT'
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : null

    // ── Insert into Supabase ──────────────────────────────────────────────────
    const supabase = getServiceClient()

    // Dedup: check if phone already submitted in the last 24h to avoid spam
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, created_at')
      .eq('phone_normalized', phoneNormalized)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    let leadId: string

    if (existingLead) {
      // Update existing lead with latest data (don't create duplicate)
      leadId = existingLead.id
      await supabase
        .from('leads')
        .update({
          name: name.trim(),
          email: email?.trim() || null,
          message: message?.trim() || null,
          budget: budget ? parseFloat(budget) : null,
          purpose: purpose || null,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          // Re-score with new data
          smartscore,
          sla_deadline: slaDeadline,
          property_id: property_id || null,
          builder_id: builder_id || null,
        })
        .eq('id', leadId)
    } else {
      // New lead
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          phone_normalized: phoneNormalized,
          email: email?.trim() || null,
          message: message?.trim() || `Interested in properties in Chennai`,
          smartscore,
          score: smartscore / 10,          // keep legacy score column in sync
          status: 'new',
          source: utm_source || 'website',
          budget: budget ? parseFloat(budget) : null,
          purpose: purpose || null,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          sla_deadline: slaDeadline,
          property_id: property_id || null,
          builder_id: builder_id || null,
          fbc: fbc || null,
          fbp: fbp || null,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[/api/leads/ingest] Supabase insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to save lead. Please try again.' },
          { status: 500 }
        )
      }

      leadId = newLead.id
    }

    // ── Meta CAPI (non-blocking) ──────────────────────────────────────────────
    fireMetaCAPI({
      event_id: event_id || leadId,
      phone: phone.trim(),
      email: email?.trim(),
      fbc,
      fbp,
      budget: budget ? parseFloat(budget) : undefined,
      source_url: req.headers.get('referer') || 'https://tharaga.co.in',
    })

    // ── Return ────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      lead_id: leadId,
      smartscore,
      tier,
      message: tier === 'HOT'
        ? 'Lead captured! Our team will contact you within 15 minutes.'
        : 'Lead captured! We\'ll reach out to you shortly.',
    })

  } catch (err: any) {
    console.error('[/api/leads/ingest] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
