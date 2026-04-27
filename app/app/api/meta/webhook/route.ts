/**
 * META LEAD ADS WEBHOOK
 * GET  /api/meta/webhook  — verification challenge (Meta one-time handshake)
 * POST /api/meta/webhook  — incoming Lead Gen event → create lead → trigger Tharaga AI greeting
 *
 * Required env vars:
 *   META_WEBHOOK_VERIFY_TOKEN   — secret token you set in Meta Business Manager
 *   META_APP_SECRET             — used to verify X-Hub-Signature-256
 *   META_PAGE_ACCESS_TOKEN      — page-level long-lived token for Graph API calls
 *
 * Meta Business Manager setup:
 *   Webhooks → New subscription → Page → leadgen field
 *   Callback URL: https://tharaga.co.in/api/meta/webhook
 *   Verify token: (value of META_WEBHOOK_VERIFY_TOKEN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Meta Graph API helper ────────────────────────────────────────────────────

async function fetchLeadgenData(leadgenId: string) {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured')

  const url = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Meta Graph API error: ${res.status}`)
  return res.json() as Promise<{
    id: string
    created_time: string
    ad_id?: string
    adset_id?: string
    campaign_id?: string
    form_id?: string
    field_data: Array<{ name: string; values: string[] }>
  }>
}

function extractField(fieldData: Array<{ name: string; values: string[] }>, names: string[]): string | null {
  for (const name of names) {
    const f = fieldData.find(f => f.name.toLowerCase() === name.toLowerCase())
    if (f?.values?.[0]) return f.values[0]
  }
  return null
}

// ─── GET — webhook verification ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verification successful')
    return new Response(challenge, { status: 200 })
  }

  console.warn('[Meta Webhook] Verification failed — token mismatch or wrong mode')
  return new Response('Forbidden', { status: 403 })
}

// ─── POST — incoming lead gen event ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // ── Verify X-Hub-Signature-256 ──────────────────────────────────────────
    const appSecret = process.env.META_APP_SECRET
    if (appSecret) {
      const signature  = request.headers.get('x-hub-signature-256') ?? ''
      const expected   = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
      if (signature !== expected) {
        console.warn('[Meta Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)

    // Only handle leadgen events
    if (payload.object !== 'page') {
      return NextResponse.json({ received: true })
    }

    for (const entry of (payload.entry ?? [])) {
      for (const change of (entry.changes ?? [])) {
        if (change.field !== 'leadgen') continue

        const value: {
          leadgen_id: string
          page_id: string
          ad_id?: string
          adset_id?: string
          campaign_id?: string
          form_id?: string
        } = change.value

        // Fetch lead data from Graph API
        let leadData
        try {
          leadData = await fetchLeadgenData(value.leadgen_id)
        } catch (err) {
          console.error('[Meta Webhook] Failed to fetch lead data:', err)
          continue
        }

        const fields = leadData.field_data ?? []

        const name   = extractField(fields, ['full_name', 'first_name', 'name']) ?? 'Unknown'
        const phone  = extractField(fields, ['phone_number', 'phone', 'mobile'])
        const email  = extractField(fields, ['email', 'work_email'])
        const city   = extractField(fields, ['city', 'preferred_city'])
        const budget = extractField(fields, ['budget', 'property_budget'])

        if (!phone && !email) {
          console.warn('[Meta Webhook] Lead has no phone or email — skipping')
          continue
        }

        const supabase = getSupabase()

        // ── Upsert lead ─────────────────────────────────────────────────────
        const phoneNorm = phone?.replace(/\D/g, '').replace(/^0/, '91') ?? null

        const { data: existing } = await supabase
          .from('leads')
          .select('id, ai_stage, qualification_data')
          .eq('phone', phone ?? '')
          .maybeSingle()

        const leadPayload = {
          name,
          phone:      phone ?? null,
          phone_normalized: phoneNorm,
          email:      email ?? null,
          source:     'Meta Ads',
          utm_source: 'meta',
          utm_medium: 'cpc',
          utm_campaign: value.campaign_id ?? null,
          preferred_location: city ?? null,
          budget: budget ? parseFloat(budget.replace(/[^\d.]/g, '')) || null : null,
          status: 'new',
          smartscore: 10,                  // baseline — will be updated after qualification
          qualification_data: {
            stage:          'GREETING',
            meta_leadgen_id: value.leadgen_id,
            meta_ad_id:     value.ad_id    ?? null,
            meta_adset_id:  value.adset_id ?? null,
            meta_form_id:   value.form_id  ?? null,
          },
          ai_stage:   'GREETING',
          created_at: new Date().toISOString(),
        }

        let leadId: string | null = null

        if (existing) {
          // Don't overwrite an already-active conversation
          leadId = existing.id
          await supabase.from('leads').update({
            source:           leadPayload.source,
            utm_campaign:     leadPayload.utm_campaign,
            email:            email ?? existing.email ?? null,
          }).eq('id', leadId)
        } else {
          const { data: newLead, error: insertErr } = await supabase
            .from('leads')
            .insert(leadPayload)
            .select('id')
            .single()

          if (insertErr || !newLead) {
            console.error('[Meta Webhook] Lead insert failed:', insertErr)
            continue
          }
          leadId = newLead.id
        }

        console.log(`[Meta Webhook] Lead upserted — id=${leadId} name=${name} phone=${phone}`)

        // ── Trigger Tharaga AI greeting via WhatsApp ───────────────────────
        if (phone && !existing) {
          // Fire-and-forget: call the WhatsApp inbound handler logic
          // (we trigger it by calling the internal API — avoids duplicating Twilio logic)
          try {
            const greetingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tharaga.co.in'}/api/whatsapp/send-greeting`
            await fetch(greetingUrl, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '' },
              body:    JSON.stringify({ leadId, phone, name }),
            })
          } catch (err) {
            console.warn('[Meta Webhook] Failed to trigger WhatsApp greeting:', err)
            // Non-fatal — lead is saved, can retry greeting later
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Meta Webhook] Unhandled error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
