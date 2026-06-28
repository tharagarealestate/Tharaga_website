/**
 * THARAGA AI — WhatsApp Inbound Message Handler
 * POST /api/whatsapp/inbound
 *
 * AiSensy calls this webhook when a lead sends a WhatsApp message.
 * Implements the 6-stage qualification engine:
 *   GREETING → QUALIFICATION → BUDGET_CHECK → TIMELINE_CHECK → OBJECTION_HANDLING → BOOKING
 *
 * Each inbound message:
 *   1. Identifies lead by phone number
 *   2. Determines current AI stage from qualification_data
 *   3. Extracts structured info using Claude (Anthropic)
 *   4. Updates lead record with new qualification data
 *   5. Advances to next stage if info collected
 *   6. Recomputes smartscore
 *   7. Sends AI-generated reply via AiSensy
 *   8. Supabase Realtime broadcasts update to builder dashboard
 *
 * Required env vars:
 *   AISENSY_API_KEY, AISENSY_API_URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendMetaConversionEvent } from '@/lib/meta-capi'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type AIStage =
  | 'GREETING'
  | 'QUALIFICATION'
  | 'BUDGET_CHECK'
  | 'TIMELINE_CHECK'
  | 'OBJECTION_HANDLING'
  | 'BOOKING'

interface QualificationData {
  stage:            AIStage
  purpose?:         string   // buy / invest / rent
  bedrooms?:        string
  location?:        string
  budget?:          number   // in INR
  timeline?:        string   // immediate / 3-6 months / 6-12 months / 1+ year
  objection?:       string
  site_visit_date?: string
  confirmed?:       boolean
  meta_leadgen_id?: string
  [key: string]:    unknown
}

// ─── Stage ordering ───────────────────────────────────────────────────────────

const STAGE_ORDER: AIStage[] = [
  'GREETING', 'QUALIFICATION', 'BUDGET_CHECK',
  'TIMELINE_CHECK', 'OBJECTION_HANDLING', 'BOOKING',
]

function nextStage(current: AIStage): AIStage {
  const idx = STAGE_ORDER.indexOf(current)
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : 'BOOKING'
}

// ─── SmartScore computation ───────────────────────────────────────────────────

function computeSmartScore(qd: QualificationData): { score: number; breakdown: Record<string, number> } {
  const breakdown = { budget: 0, timeline: 0, behavioral: 0, intent: 0 }

  // Budget (max 30)
  if (qd.budget) {
    if      (qd.budget >= 10000000) breakdown.budget = 30   // 1Cr+
    else if (qd.budget >= 5000000)  breakdown.budget = 25   // 50L+
    else if (qd.budget >= 2500000)  breakdown.budget = 18   // 25L+
    else                             breakdown.budget = 10
  }

  // Timeline (max 30)
  if      (qd.timeline === 'immediate')     breakdown.timeline = 30
  else if (qd.timeline === '3-6months')     breakdown.timeline = 22
  else if (qd.timeline === '6-12months')    breakdown.timeline = 15
  else if (qd.timeline === '1year+')        breakdown.timeline = 8

  // Behavioral — based on stage progress (max 25)
  const stageIdx = STAGE_ORDER.indexOf(qd.stage)
  breakdown.behavioral = Math.round((stageIdx / (STAGE_ORDER.length - 1)) * 25)

  // Intent — purpose & specificity (max 15)
  if      (qd.purpose === 'buy' || qd.purpose === 'invest') breakdown.intent = 15
  else if (qd.purpose === 'rent')                           breakdown.intent = 8
  else if (qd.purpose)                                      breakdown.intent = 5

  const score = Math.min(100, Object.values(breakdown).reduce((s, v) => s + v, 0))
  return { score, breakdown }
}

// ─── Claude AI extraction + response ─────────────────────────────────────────

async function runAIStage(
  stage: AIStage,
  inboundMessage: string,
  leadName: string,
  existingQD: QualificationData,
): Promise<{ reply: string; extracted: Partial<QualificationData>; advance: boolean }> {

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompts: Record<AIStage, string> = {
    GREETING: `You are Tharaga AI, a friendly real estate assistant on WhatsApp for Tharaga (Chennai).
This is the opening conversation. Warmly greet ${leadName}, briefly introduce Tharaga, and ask ONE question:
what kind of property are they looking for? (buy/invest/rent, flat/villa/plot, number of bedrooms).
Keep it under 60 words. Be warm, professional, in English but naturally bilingual if they respond in Tamil/Hindi.`,

    QUALIFICATION: `You are Tharaga AI. The lead ${leadName} has expressed interest.
Based on their reply, extract: purpose (buy/invest/rent), property type, number of bedrooms, preferred location in Chennai.
Ask a follow-up question about their preferred location or locality.
Keep reply under 60 words.`,

    BUDGET_CHECK: `You are Tharaga AI. You need to ask about budget naturally without being intrusive.
Ask ${leadName} for their approximate budget range in a friendly way — "just so we can shortlist the right properties for you".
Keep reply under 50 words. Common Chennai ranges: 25L-50L, 50L-1Cr, 1Cr-2Cr, 2Cr+.`,

    TIMELINE_CHECK: `You are Tharaga AI. Ask ${leadName} about their purchase timeline.
Options: immediate possession, 3–6 months, 6–12 months, or 1+ year.
Explain that this helps you show them the right ready-to-move-in vs under-construction options.
Keep reply under 50 words.`,

    OBJECTION_HANDLING: `You are Tharaga AI. Address any hesitation or objection ${leadName} may have mentioned.
Empathize, provide a brief reassurance, and offer to share 2-3 curated property options matching their criteria.
Keep reply under 70 words.`,

    BOOKING: `You are Tharaga AI. ${leadName} is ready for a site visit!
Propose 2-3 time slots (use tomorrow and day-after) and confirm address will be WhatsApp'd separately.
Build excitement. Keep reply under 60 words.`,
  }

  // Build extraction prompt
  const extractionSystem = `You are a data extractor. From the WhatsApp message reply, extract structured data as JSON.
Return ONLY valid JSON with these fields (only include fields that were clearly mentioned):
{
  "purpose": "buy|invest|rent|null",
  "bedrooms": "1BHK|2BHK|3BHK|4BHK|villa|plot|null",
  "location": "locality name or null",
  "budget": number in INR or null,
  "timeline": "immediate|3-6months|6-12months|1year+|null",
  "objection": "brief objection summary or null",
  "site_visit_date": "ISO date string or null",
  "advance": true or false (should we advance to next stage based on this reply?)
}
Do not include markdown or explanation — only JSON.`

  const [extractionRes, replyRes] = await Promise.all([
    anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     extractionSystem,
      messages:   [{ role: 'user', content: `Stage: ${stage}\nLead message: "${inboundMessage}"` }],
    }),
    anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system:     systemPrompts[stage],
      messages:   [
        { role: 'user', content: `Lead name: ${leadName}\nTheir message: "${inboundMessage}"\nExisting data: ${JSON.stringify(existingQD)}` },
      ],
    }),
  ])

  // Parse extraction
  let extracted: Partial<QualificationData> & { advance?: boolean } = {}
  try {
    const raw = (extractionRes.content[0] as { text: string }).text
    extracted = JSON.parse(raw.trim())
  } catch {
    console.warn('[Tharaga AI] Failed to parse extraction JSON')
  }

  const reply   = (replyRes.content[0] as { text: string }).text.trim()
  const advance = extracted.advance === true

  // Clean extracted — remove the "advance" meta field
  const { advance: _a, ...cleanExtracted } = extracted

  return { reply, extracted: cleanExtracted as Partial<QualificationData>, advance }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const phone = String(payload.senderNumber || payload.destination || payload.from || '').trim()
    const body = String(payload.text?.body || payload.message?.text || payload.text || '').trim()

    if (!phone || !body) {
      return NextResponse.json({ error: 'Missing message body or phone' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Find lead by phone ──────────────────────────────────────────────────
    const phoneNorm = phone.replace(/\D/g, '')
    const { data: lead } = await supabase
      .from('leads')
      .select('id, name, ai_stage, qualification_data, smartscore, builder_id, capi_synced, budget, status')
      .or(`phone.eq.${phone},phone_normalized.eq.${phoneNorm}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lead) {
      // Unknown number — create a new lead
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          phone,
          phone_normalized: phoneNorm,
          name: 'Unknown',
          source: 'WhatsApp',
          status: 'new',
          smartscore: 5,
          ai_stage: 'GREETING',
          qualification_data: { stage: 'GREETING' },
        })
        .select('id, name')
        .single()

      const greeting = await runAIStage('GREETING', body, 'there', { stage: 'GREETING' })
      if (newLead) {
        await supabase.from('leads').update({
          qualification_data: { stage: 'GREETING', ...greeting.extracted },
        }).eq('id', newLead.id)
      }
      
      return await sendWebhookReply(phone, greeting.reply)
    }

    // ── Determine current stage ─────────────────────────────────────────────
    const qd: QualificationData = (lead.qualification_data as QualificationData) ?? { stage: 'GREETING' }
    const currentStage: AIStage = (lead.ai_stage as AIStage) ?? qd.stage ?? 'GREETING'

    // Store inbound message in conversations table
    await supabase.from('conversations').insert({
      lead_id:    lead.id,
      builder_id: lead.builder_id,
      direction:  'inbound',
      channel:    'whatsapp',
      message:    body,
      metadata:   { from: phone, stage: currentStage },
    }).then(() => {}) // non-fatal

    // ── Run Tharaga AI for current stage ───────────────────────────────────
    const { reply, extracted, advance } = await runAIStage(
      currentStage,
      body,
      lead.name ?? 'there',
      qd,
    )

    // ── Merge extracted data into qualification_data ────────────────────────
    const updatedQD: QualificationData = {
      ...qd,
      ...Object.fromEntries(Object.entries(extracted).filter(([, v]) => v != null)),
      stage: advance ? nextStage(currentStage) : currentStage,
    }

    // ── Compute updated SmartScore ──────────────────────────────────────────
    const { score, breakdown } = computeSmartScore(updatedQD)

    // ── Sync to Meta CAPI if HOT lead reaching Lion tier (USP 4) ────────────
    let capiSynced = lead.capi_synced ?? false
    if (!capiSynced && score >= 75) {
      const isSynced = await sendMetaConversionEvent({
        eventName: 'Lion_Lead_Qualified',
        phone: phoneNorm,
        firstName: lead.name || 'Unknown',
        sourceUrl: 'whatsapp_automation'
      })
      if (isSynced) capiSynced = true
    }

    // ── Update lead in Supabase (triggers Realtime to dashboard) ────────────
    await supabase.from('leads').update({
      ai_stage:           updatedQD.stage,
      qualification_data: updatedQD,
      smartscore:         score,
      score_breakdown:    breakdown,
      budget:             updatedQD.budget    ?? lead.budget   ?? null,
      purpose:            updatedQD.purpose   ?? null,
      preferred_location: updatedQD.location  ?? null,
      status:             updatedQD.stage === 'BOOKING' ? 'qualified' : lead.status,
      capi_synced:        capiSynced,
      // Set SLA deadline for HOT leads (score ≥ 75)
      sla_deadline: score >= 75
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()   // 15 min Lion
        : score >= 40
        ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()  // 2 hr Monkey
        : null,
    }).eq('id', lead.id)

    // Store outbound reply in conversations
    await supabase.from('conversations').insert({
      lead_id:    lead.id,
      builder_id: lead.builder_id,
      direction:  'outbound',
      channel:    'whatsapp',
      message:    reply,
      metadata:   { stage: updatedQD.stage, smartscore: score },
    }).then(() => {})

    console.log(`[Tharaga AI] lead=${lead.id} ${currentStage}→${updatedQD.stage} score=${score}`)

    return await sendWebhookReply(phone, reply)
  } catch (err: any) {
    console.error('[Tharaga AI] Unhandled error:', err)
    return NextResponse.json({ success: false, error: 'Internal issue' })
  }
}

// Helper to send AiSensy outbound reply natively
async function sendWebhookReply(phone: string, replyText: string) {
  if (process.env.AISENSY_API_KEY && process.env.AISENSY_API_URL) {
    try {
      const cleanPhone = phone.replace('+', '').replace(/^9191/, '91');
      await fetch(`${process.env.AISENSY_API_URL}/messages/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: process.env.AISENSY_API_KEY,
          to: cleanPhone,
          text: replyText
        })
      });
    } catch (e) {
      console.error('[AiSensy Outbound] Error:', e)
    }
  }
  return NextResponse.json({ success: true })
}
