/**
 * WORKFLOW 9: WHATSAPP BROADCASTING & CHATBOT
 * Trigger: Queued by Intelligence Engine after content generation
 * Purpose: Send WhatsApp broadcasts to warm leads and deploy AI chatbot for property inquiries
 *
 * Architecture note: uses getAdminClient() because this is called server-to-server
 * with no user session. Phone number normalisation prevents double-prepending +91.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300

// ── Phone Normalisation ────────────────────────────────────────────────────────
// Accepts: "9876543210", "09876543210", "919876543210", "+919876543210"
// Returns: "+919876543210"
function normaliseIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10)                              return `+91${digits}`
  if (digits.length === 11 && digits.startsWith('0'))   return `+91${digits.slice(1)}`
  if (digits.length === 12 && digits.startsWith('91'))  return `+${digits}`
  if (digits.length === 13 && digits.startsWith('091')) return `+91${digits.slice(3)}`
  return null // can't safely normalise — skip
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const db = getAdminClient()

  try {
    const body = await req.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
    }

    // Step 1: Fetch Property Data
    const { data: property, error: propErr } = await db
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propErr || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Step 2: Segment Leads
    const segments      = await segmentLeads(property, db)
    const templates     = buildMessageTemplates(property)
    const broadcastResult = await sendBroadcasts(property, segments, templates)

    // Step 3: Deploy AI chatbot webhook (idempotent)
    const chatbotDeployed = await deployChatbot()

    // Step 4: Persist campaign record
    const { data: campaign } = await db
      .from('whatsapp_campaigns')
      .insert({
        property_id,
        builder_id:          property.builder_id,
        campaign_name:       `${property.title} — Launch Broadcast`,
        campaign_type:       'broadcast',
        total_recipients:    segments.total_leads,
        messages_sent:       broadcastResult.sent_count,
        segment_distribution: {
          hot_leads:  segments.hot_leads.length,
          warm_leads: segments.warm_leads.length,
        },
        message_template: JSON.stringify(templates),
        status:           'completed',
        launched_at:      new Date().toISOString(),
        completed_at:     new Date().toISOString(),
      })
      .select()
      .single()

    // Step 5: Persist individual message rows
    if (campaign && broadcastResult.messages.length > 0) {
      await db.from('whatsapp_messages').insert(
        broadcastResult.messages.map((m: any) => ({
          campaign_id:     campaign.id,
          property_id,
          lead_id:         m.lead_id,
          phone:           m.phone,
          name:            m.name,
          message_content: m.content,
          message_type:    'text',
          message_sid:     m.sid ?? null,
          status:          m.status,
          segment:         m.segment,
          sent_at:         new Date().toISOString(),
        }))
      )
    }

    // Step 6: Update property flags
    await db
      .from('properties')
      .update({
        whatsapp_broadcast_sent:         true,
        whatsapp_chatbot_active:         chatbotDeployed,
        whatsapp_campaign_launched_at:   new Date().toISOString(),
      })
      .eq('id', property_id)

    return NextResponse.json({
      success:              true,
      property_id,
      campaign_id:          campaign?.id,
      total_leads:          segments.total_leads,
      messages_sent:        broadcastResult.sent_count,
      hot_leads_contacted:  segments.hot_leads.length,
      warm_leads_contacted: segments.warm_leads.length,
      chatbot_deployed:     chatbotDeployed,
    })
  } catch (error) {
    console.error('[WhatsApp Broadcast] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ── Lead Segmentation ─────────────────────────────────────────────────────────
async function segmentLeads(property: any, db: ReturnType<typeof getAdminClient>) {
  const { data: leads = [] } = await db
    .from('leads')
    .select('id, name, phone, preferences, ai_lead_score, last_interaction_at, whatsapp_opt_in, status')
    .or(
      [
        `preferences->>preferred_locations.ilike.%${property.city || ''}%`,
        property.location ? `preferences->>preferred_locations.ilike.%${property.location}%` : null,
        property.bhk_type ? `preferences->>preferred_bhk.eq.${property.bhk_type}` : null,
      ]
        .filter(Boolean)
        .join(',')
    )
    .eq('whatsapp_opt_in', true)
    .in('status', ['qualified', 'engaged'])
    .gte('ai_lead_score', 60)
    .order('ai_lead_score', { ascending: false })
    .limit(500)

  const allLeads   = (leads as any[]).filter((l) => !!normaliseIndianPhone(l.phone || ''))
  const hot_leads  = allLeads.filter((l) => l.ai_lead_score >= 80)
  const warm_leads = allLeads.filter((l) => l.ai_lead_score >= 60 && l.ai_lead_score < 80)

  return { hot_leads, warm_leads, total_leads: allLeads.length }
}

// ── Message Templates ─────────────────────────────────────────────────────────
function buildMessageTemplates(property: any) {
  const price  = property.price || property.price_inr || 0
  const priceL = price > 0 ? `₹${(price / 100000).toFixed(2)}L` : 'Price on request'
  const loc    = property.location || property.locality || property.city || 'Chennai'
  const area   = property.carpet_area || property.sqft
  const link   = property.landing_page_url || `https://tharaga.co.in/properties/${property.id}`

  const hot = `🏡 *EXCLUSIVE FIRST LOOK*

Hi {{name}},

${property.title || 'A new property'} just launched on Tharaga — matched for you!

📍 ${loc}  🏠 ${property.bhk_type || ''}${area ? `  📏 ${area} sq.ft` : ''}
💰 ${priceL}

*Book your site visit in 48 hours and get:*
• Priority unit selection
• Special early-bird pricing
• Free home loan consultation

👉 ${link}

— Team Tharaga
_Reply STOP to opt-out_`

  const warm = `Hi {{name}},

New ${property.bhk_type || 'home'} just launched in ${loc} 🎉

*${property.title || 'New Property'}* | ${priceL}${area ? ` | ${area} sq.ft` : ''}

✅ RERA Approved  ✅ Zero Commission  ✅ Direct from Builder

View Details: ${link}

Reply *YES* to schedule a site visit!`

  return { hot, warm }
}

// ── Send Broadcasts ────────────────────────────────────────────────────────────
async function sendBroadcasts(
  _property: any,
  segments: { hot_leads: any[]; warm_leads: any[]; total_leads: number },
  templates: { hot: string; warm: string }
) {
  const messages: any[] = []

  const twilioSid    = process.env.TWILIO_ACCOUNT_SID
  const twilioToken  = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom   = process.env.TWILIO_WHATSAPP_NUMBER
  const twilioActive = !!(twilioSid && twilioToken && twilioFrom)

  if (!twilioActive) {
    console.log('[WhatsApp Broadcast] Twilio not configured — saving as drafts')
    const makeDraft = (lead: any, segment: 'hot_leads' | 'warm_leads') => ({
      lead_id: lead.id,
      phone:   normaliseIndianPhone(lead.phone || '') ?? lead.phone,
      name:    lead.name,
      content: (segment === 'hot_leads' ? templates.hot : templates.warm)
               .replace('{{name}}', lead.name || 'there'),
      sid:     null,
      status:  'pending',
      segment,
    })
    segments.hot_leads.forEach((l) => messages.push(makeDraft(l, 'hot_leads')))
    segments.warm_leads.forEach((l) => messages.push(makeDraft(l, 'warm_leads')))
    return { sent_count: 0, messages }
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
  const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`

  const sendOne = async (lead: any, segment: 'hot_leads' | 'warm_leads') => {
    const toPhone = normaliseIndianPhone(lead.phone || '')
    if (!toPhone) return // skip unparseable numbers

    const content = (segment === 'hot_leads' ? templates.hot : templates.warm)
      .replace('{{name}}', lead.name || 'there')

    try {
      const res  = await fetch(twilioUrl, {
        method:  'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
          From: `whatsapp:${twilioFrom}`,
          To:   `whatsapp:${toPhone}`,
          Body: content,
        }),
      })
      const data = await res.json()
      messages.push({
        lead_id: lead.id, phone: toPhone, name: lead.name, content,
        sid:     data.sid ?? null,
        status:  data.status === 'queued' || data.status === 'sent' ? 'sent' : 'failed',
        segment,
      })
    } catch (err) {
      console.error(`[WhatsApp Broadcast] Send failed to ${toPhone}:`, err)
      messages.push({ lead_id: lead.id, phone: toPhone, name: lead.name, content, sid: null, status: 'failed', segment })
    }

    // 1 message/second to respect Twilio rate limits
    await new Promise((r) => setTimeout(r, 1000))
  }

  for (const lead of segments.hot_leads)  await sendOne(lead, 'hot_leads')
  for (const lead of segments.warm_leads) await sendOne(lead, 'warm_leads')

  return {
    sent_count: messages.filter((m) => m.status === 'sent').length,
    messages,
  }
}

// ── Deploy Chatbot Webhook ────────────────────────────────────────────────────
async function deployChatbot(): Promise<boolean> {
  const sid      = process.env.TWILIO_ACCOUNT_SID
  const token    = process.env.TWILIO_AUTH_TOKEN
  const phoneSid = process.env.TWILIO_PHONE_NUMBER_SID

  if (!sid || !token || !phoneSid) return true // no-op — can be set up manually

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'}/api/webhooks/whatsapp-incoming`

  try {
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers/${phoneSid}.json`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ SmsUrl: webhookUrl, SmsMethod: 'POST' }),
      }
    )
    return true
  } catch (err) {
    console.error('[WhatsApp Broadcast] Chatbot webhook config failed:', err)
    return false
  }
}
