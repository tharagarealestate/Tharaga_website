/**
 * WhatsApp Leads Outreach API
 * Finds leads matching a property and sends them personalised WhatsApp messages
 * via the Twilio REST API (no SDK dependency).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  phone: string | null
  first_name?: string | null
  name?: string | null
  city?: string | null
  locality?: string | null
  budget_max?: number | null
}

interface Property {
  id: string
  title: string
  price_inr: number | null
  city: string | null
  locality: string | null
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

/** Normalise phone → E.164 (+91XXXXXXXXXX for 10-digit Indian numbers) */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`
  if (digits.startsWith('+')) return raw.trim()
  return null // unrecognisable
}

/** Format price as ₹XL or ₹X.XXCr */
function formatPrice(price: number | null): string {
  if (!price) return 'Price on request'
  if (price >= 10_000_000) {
    const cr = price / 10_000_000
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)}Cr`
  }
  if (price >= 100_000) {
    const l = price / 100_000
    return `₹${l % 1 === 0 ? l : l.toFixed(1)}L`
  }
  return `₹${price.toLocaleString('en-IN')}`
}

/** Build a personalised message for a lead */
function buildMessage(
  lead: Lead,
  property: Property,
  template?: string
): string {
  const name = lead.first_name ?? lead.name ?? 'there'
  const price = formatPrice(property.price_inr)
  const location = [property.locality, property.city].filter(Boolean).join(', ') || 'Chennai'
  const url = `https://tharaga.co.in/properties/${property.id}`

  if (template) {
    return template
      .replace(/\{name\}/gi, name)
      .replace(/\{title\}/gi, property.title)
      .replace(/\{price\}/gi, price)
      .replace(/\{location\}/gi, location)
      .replace(/\{url\}/gi, url)
  }

  return (
    `Hi ${name}! 👋\n\n` +
    `We have a property that matches your requirements:\n\n` +
    `*${property.title}*\n` +
    `📍 ${location}\n` +
    `💰 ${price}\n\n` +
    `View full details: ${url}\n\n` +
    `Reply YES to book a site visit 📅`
  )
}

/** Sleep for ms milliseconds */
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// ── main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: {
    property_id?: string
    message_template?: string
    max_leads?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { property_id, message_template } = body
  const maxLeads = Math.min(body.max_leads ?? 25, 50)

  if (!property_id) {
    return NextResponse.json({ success: false, error: 'property_id is required' }, { status: 400 })
  }

  // 2. Check Twilio env vars
  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER

  if (!twilioSid || !twilioToken || !twilioNumber) {
    return NextResponse.json(
      {
        success: false,
        error: 'Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_NUMBER) are not configured',
        skipped: true,
      },
      { status: 200 }
    )
  }

  const supabase = getSupabaseAdmin()

  // 3. Fetch property
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, title, price_inr, city, locality')
    .eq('id', property_id)
    .single()

  if (propError || !property) {
    return NextResponse.json(
      { success: false, error: propError?.message ?? 'Property not found' },
      { status: 404 }
    )
  }

  // 4. Query matching leads
  // Match on: status, phone exists, and (location match OR budget within 15% of price)
  let leadsQuery = supabase
    .from('leads')
    .select('id, phone, first_name, name, city, locality, budget_max')
    .in('status', ['new', 'qualified', 'contacted'])
    .not('phone', 'is', null)
    .limit(maxLeads)

  // We apply OR conditions only if we have useful property data
  const priceFloor = property.price_inr ? property.price_inr * 0.85 : null

  if (property.locality && property.city && priceFloor) {
    leadsQuery = leadsQuery.or(
      `locality.eq.${property.locality},city.eq.${property.city},budget_max.gte.${priceFloor}`
    )
  } else if (property.city && priceFloor) {
    leadsQuery = leadsQuery.or(`city.eq.${property.city},budget_max.gte.${priceFloor}`)
  } else if (priceFloor) {
    leadsQuery = leadsQuery.gte('budget_max', priceFloor)
  }
  // If no useful filter criteria, fall back to all leads with valid status/phone

  const { data: leads, error: leadsError } = await leadsQuery

  if (leadsError) {
    return NextResponse.json(
      { success: false, error: `Failed to query leads: ${leadsError.message}` },
      { status: 500 }
    )
  }

  const allLeads: Lead[] = leads ?? []
  const totalLeadsMatched = allLeads.length

  // 5. Send messages
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
  const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')
  const fromNumber = `whatsapp:${twilioNumber.startsWith('+') ? twilioNumber : `+${twilioNumber}`}`

  let sent = 0
  let failed = 0
  let skippedNoPhone = 0

  for (const lead of allLeads) {
    const phone = lead.phone ? normalisePhone(lead.phone) : null

    if (!phone) {
      skippedNoPhone++
      // Store skipped record
      await storeSendAttempt(supabase, {
        lead_id: lead.id,
        property_id,
        phone: lead.phone ?? '',
        message: '',
        status: 'skipped_invalid_phone',
        twilio_sid: null,
      })
      continue
    }

    const message = buildMessage(lead, property as Property, message_template)
    let twilioSidResult: string | null = null
    let status: string

    try {
      const formBody = new URLSearchParams({
        From: fromNumber,
        To: `whatsapp:${phone}`,
        Body: message,
      })

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      })

      const data = await res.json()

      if (res.ok && data.sid) {
        twilioSidResult = data.sid as string
        status = 'sent'
        sent++
      } else {
        status = `failed: ${data.message ?? data.error_message ?? res.status}`
        failed++
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      status = `error: ${msg}`
      failed++
    }

    // Store attempt (best-effort)
    await storeSendAttempt(supabase, {
      lead_id: lead.id,
      property_id,
      phone,
      message,
      status,
      twilio_sid: twilioSidResult,
    })

    // Rate limit: 800 ms between messages
    await sleep(800)
  }

  // 6. Return summary
  return NextResponse.json({
    success: true,
    sent,
    failed,
    skipped_no_phone: skippedNoPhone,
    total_leads_matched: totalLeadsMatched,
  })
}

// ── DB helper ─────────────────────────────────────────────────────────────────

async function storeSendAttempt(
  supabase: ReturnType<typeof createClient>,
  row: {
    lead_id: string
    property_id: string
    phone: string
    message: string
    status: string
    twilio_sid: string | null
  }
) {
  try {
    await supabase.from('whatsapp_messages').upsert(
      {
        lead_id: row.lead_id,
        property_id: row.property_id,
        phone: row.phone,
        message: row.message,
        status: row.status,
        twilio_sid: row.twilio_sid,
        sent_at: new Date().toISOString(),
      },
      { onConflict: 'lead_id,property_id' }
    )
  } catch {
    // Table may not exist yet — skip silently
  }
}
