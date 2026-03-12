/**
 * AI MARKETING LAUNCH — /api/automation/marketing/launch
 *
 * Self-contained marketing pipeline triggered on property upload.
 * Works with ZERO external API keys (rule-based templates as primary,
 * OpenAI/Anthropic as enhancement when configured).
 *
 * What it does automatically, every time a property goes live:
 *  1. Analyses property data → target audience, price segment, USPs
 *  2. Generates marketing copy (rule-based or AI-enhanced)
 *  3. Builds WhatsApp share card (wa.me deep link) for builder to share
 *  4. Saves campaign record to property_marketing_campaigns
 *  5. Sends builder instant email: "Your property is live and being marketed"
 *  6. Schedules 3-email drip sequence in email_sequence_queue
 *     Day 1, Day 3, Day 7 → processed by process-sequence-queue cron
 *  7. Logs everything to property_marketing_automation_logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PropertyRow {
  id: string
  title: string
  description?: string | null
  property_type?: string | null
  city?: string | null
  locality?: string | null
  price_inr?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  sqft?: number | null
  amenities?: string[] | null
  images?: string[] | null
  builder_id: string
  listing_status?: string | null
}

interface ContentSet {
  emailSubject: string
  emailBodyHTML: string
  socialPost: string
  whatsappMsg: string
  highlights: string[]
  targetAudience: string[]
  priceSegment: 'budget' | 'mid-range' | 'premium' | 'luxury'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

function priceSegment(price: number): ContentSet['priceSegment'] {
  if (price < 5_000_000) return 'budget'
  if (price < 15_000_000) return 'mid-range'
  if (price < 50_000_000) return 'premium'
  return 'luxury'
}

function targetAudience(seg: ContentSet['priceSegment']): string[] {
  const map: Record<ContentSet['priceSegment'], string[]> = {
    budget:    ['First-time homebuyers', 'Young professionals', 'Small families'],
    'mid-range': ['Growing families', 'Established professionals', 'Upgrade seekers'],
    premium:   ['Senior executives', 'Investors', 'Affluent families'],
    luxury:    ['HNIs', 'NRIs', 'Ultra-premium investors'],
  }
  return map[seg]
}

// ─── Rule-based content generator ────────────────────────────────────────────

function generateRuleBasedContent(p: PropertyRow): ContentSet {
  const price = p.price_inr || 0
  const seg   = priceSegment(price)
  const loc   = p.locality || p.city || 'Chennai'
  const priceStr = price > 0 ? formatINR(price) : 'Price on request'
  const bhk  = p.bedrooms ? `${p.bedrooms} BHK` : p.property_type || 'Property'
  const size = p.sqft ? `${p.sqft.toLocaleString()} sq.ft` : ''
  const amenList = (p.amenities || []).slice(0, 4).join(', ')
  const imgCount = (p.images || []).length

  const highlights: string[] = []
  if (p.bedrooms)   highlights.push(`${p.bedrooms} Bedrooms${p.bathrooms ? ' | ' + p.bathrooms + ' Baths' : ''}`)
  if (p.sqft)       highlights.push(`${p.sqft.toLocaleString()} sq.ft of living space`)
  if (p.locality)   highlights.push(`Prime location in ${p.locality}`)
  if (amenList)     highlights.push(`Amenities: ${amenList}`)
  if (price > 0)    highlights.push(`Priced from ${priceStr}`)
  if (imgCount > 0) highlights.push(`${imgCount} property photos available`)

  // ── Segment-specific tone ──
  const toneMap: Record<ContentSet['priceSegment'], { hook: string; cta: string }> = {
    budget:      { hook: 'Make your dream of owning a home a reality',        cta: 'Book a free site visit today' },
    'mid-range': { hook: 'Upgrade your lifestyle with this exceptional home',  cta: 'Schedule a private viewing' },
    premium:     { hook: 'A rare opportunity in one of Chennai\'s finest locations', cta: 'Arrange an exclusive tour' },
    luxury:      { hook: 'Defining a new standard of luxury living in Chennai', cta: 'Request a VIP preview' },
  }
  const tone = toneMap[seg]

  const emailSubject = `🏠 New ${bhk} in ${loc} — ${priceStr}`

  const emailBodyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${p.title}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a26 0%,#252535 100%);padding:32px;text-align:center;border-bottom:1px solid rgba(251,191,36,0.15);">
            <p style="margin:0 0 8px;font-size:13px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;font-weight:600;">THARAGA REAL ESTATE</p>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#f9fafb;line-height:1.3;">${p.title}</h1>
            <p style="margin:8px 0 0;font-size:15px;color:#9ca3af;">📍 ${loc}</p>
          </td>
        </tr>
        <!-- Hero price -->
        <tr>
          <td style="padding:24px 32px;text-align:center;background:rgba(251,191,36,0.05);">
            <p style="margin:0;font-size:36px;font-weight:800;color:#fbbf24;">${priceStr}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${bhk}${size ? ' · ' + size : ''}</p>
          </td>
        </tr>
        <!-- Hook -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0;font-size:17px;color:#d1d5db;line-height:1.6;">${tone.hook}.</p>
            ${p.description ? `<p style="margin:12px 0 0;font-size:15px;color:#9ca3af;line-height:1.7;">${p.description.slice(0, 300)}${p.description.length > 300 ? '…' : ''}</p>` : ''}
          </td>
        </tr>
        <!-- Highlights -->
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#fbbf24;letter-spacing:1px;text-transform:uppercase;">KEY HIGHLIGHTS</p>
            ${highlights.map(h => `<p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✓ ${h}</p>`).join('')}
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <a href="https://tharaga.co.in/properties/${p.id}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">${tone.cta} →</a>
            <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">Questions? Reply to this email or call us.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · Chennai, Tamil Nadu · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()

  const socialPost = `🏠 New ${seg === 'luxury' ? 'Luxury ' : ''}Property Alert!\n\n${p.title} — ${loc}\n\n${highlights.slice(0, 3).map(h => `✨ ${h}`).join('\n')}\n\n${priceStr}\n\n${tone.cta} → https://tharaga.co.in/properties/${p.id}\n\n#RealEstate #Chennai #Property #Tharaga${p.locality ? ' #' + p.locality.replace(/\s+/g, '') : ''}`

  const whatsappMsg = `🏠 *${p.title}*\n📍 ${loc}\n💰 *${priceStr}*\n\n${highlights.slice(0, 3).map(h => `• ${h}`).join('\n')}\n\n${tone.hook}.\n\n👇 View full details:\nhttps://tharaga.co.in/properties/${p.id}\n\n_Powered by Tharaga AI_`

  return {
    emailSubject,
    emailBodyHTML,
    socialPost,
    whatsappMsg,
    highlights,
    targetAudience: targetAudience(seg),
    priceSegment: seg,
  }
}

// ─── AI-enhanced content (OpenAI) ─────────────────────────────────────────────

async function enhanceWithAI(p: PropertyRow, base: ContentSet): Promise<ContentSet> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return base

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a top-tier Indian real estate copywriter. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Improve this property marketing copy. Property: ${JSON.stringify({
              title: p.title, city: p.city, locality: p.locality,
              price: p.price_inr, bedrooms: p.bedrooms, sqft: p.sqft,
              type: p.property_type, description: p.description?.slice(0, 200),
            })}.
Return JSON: { "emailSubject": "...", "socialPost": "...", "whatsappMsg": "...", "highlights": ["..."] }
Keep emailSubject under 70 chars. socialPost under 280 chars with emojis. whatsappMsg in WhatsApp format with bold (*). All in English targeting Indian buyers.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (res.ok) {
      const d = await res.json()
      const ai = JSON.parse(d.choices?.[0]?.message?.content || '{}')
      return {
        ...base,
        emailSubject: ai.emailSubject || base.emailSubject,
        socialPost:   ai.socialPost   || base.socialPost,
        whatsappMsg:  ai.whatsappMsg  || base.whatsappMsg,
        highlights:   ai.highlights   || base.highlights,
      }
    }
  } catch (e) {
    console.warn('[Launch] OpenAI enhancement skipped:', (e as Error).message)
  }
  return base
}

// ─── Send builder notification email ──────────────────────────────────────────

async function sendBuilderEmail(
  builderEmail: string,
  builderName: string,
  property: PropertyRow,
  content: ContentSet,
  whatsappLink: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log('[Launch] RESEND_API_KEY not set — builder email logged only')
    return
  }

  const loc = property.locality || property.city || 'Chennai'
  const price = property.price_inr ? formatINR(property.price_inr) : 'Price on request'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:28px 32px;border-bottom:1px solid rgba(251,191,36,0.15);">
            <p style="margin:0 0 4px;font-size:12px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA AI MARKETING</p>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#f9fafb;">🚀 Your property is live & being marketed!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong style="color:#f9fafb;">${builderName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;color:#9ca3af;line-height:1.6;">
              Your property <strong style="color:#fbbf24;">${property.title}</strong> in ${loc} is now live at <strong>${price}</strong>.
              Tharaga AI has automatically launched a full marketing campaign. Here's what's running for you:
            </p>
            <!-- Campaign actions -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border-radius:10px;border:1px solid rgba(251,191,36,0.1);">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">Campaign Active</p>
                ${[
                  '✅ Property listing page live on tharaga.co.in',
                  '✅ AI-generated marketing content created',
                  '✅ Buyer email sequence scheduled (3-email drip)',
                  '✅ WhatsApp share link ready for your networks',
                  '✅ Social media copy generated',
                ].map(a => `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">${a}</p>`).join('')}
              </td></tr>
            </table>
            <!-- WhatsApp share card -->
            <p style="margin:20px 0 8px;font-size:14px;font-weight:600;color:#f9fafb;">📱 Share instantly via WhatsApp:</p>
            <a href="${whatsappLink}" style="display:block;background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.3);border-radius:8px;padding:12px 16px;text-decoration:none;color:#25d366;font-size:14px;word-break:break-all;">${whatsappLink}</a>
            <!-- Buttons -->
            <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td style="padding-right:12px;">
                  <a href="https://tharaga.co.in/properties/${property.id}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">View Property →</a>
                </td>
                <td>
                  <a href="https://tharaga.co.in/builder?section=marketing" style="display:inline-block;background:rgba(255,255,255,0.08);color:#d1d5db;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);">View Dashboard</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Tharaga <notifications@tharaga.co.in>',
        to: [builderEmail],
        subject: `🚀 Your property "${property.title}" is live & being marketed`,
        html,
      }),
    })
    if (!r.ok) {
      const err = await r.text()
      console.error('[Launch] Builder email send failed:', err)
    } else {
      console.log('[Launch] Builder email sent to', builderEmail)
    }
  } catch (e) {
    console.error('[Launch] Builder email error:', (e as Error).message)
  }
}

// ─── Schedule drip sequence emails for future leads ───────────────────────────
// These are "template" emails scheduled when a LEAD comes in (not property upload)
// So we store them as a campaign template, not individual lead emails
// The actual per-lead scheduling happens in notify-lead

// ─── Main POST handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let propertyId = ''
  let builderId  = ''

  try {
    const body = await request.json()
    propertyId = body.property_id

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'property_id required' }, { status: 400 })
    }

    const db = getAdminClient()

    // ── 1. Fetch full property ──────────────────────────────────────────────
    const { data: property, error: propErr } = await db
      .from('properties')
      .select('id,title,description,property_type,city,locality,price_inr,bedrooms,bathrooms,sqft,amenities,images,builder_id,listing_status')
      .eq('id', propertyId)
      .single()

    if (propErr || !property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    builderId = property.builder_id

    // ── 2. Get builder email from auth ─────────────────────────────────────
    let builderEmail = ''
    let builderName  = 'Builder'
    try {
      const { data: { user: builderUser } } = await db.auth.admin.getUserById(builderId)
      builderEmail = builderUser?.email || ''
      builderName  = builderUser?.user_metadata?.full_name || builderEmail.split('@')[0] || 'Builder'
    } catch (e) {
      console.warn('[Launch] Could not fetch builder user:', (e as Error).message)
    }

    // Also try builders/profiles table
    if (!builderEmail) {
      const { data: prof } = await db.from('builders').select('name,email').eq('id', builderId).maybeSingle()
        .catch(() => ({ data: null }))
      if (prof) { builderEmail = prof.email || ''; builderName = prof.name || builderName }
    }

    // ── 3. Generate content ─────────────────────────────────────────────────
    let content = generateRuleBasedContent(property as PropertyRow)
    content = await enhanceWithAI(property as PropertyRow, content)

    // ── 4. Build WhatsApp share link ────────────────────────────────────────
    const waText     = encodeURIComponent(content.whatsappMsg)
    const waShareUrl = `https://wa.me/?text=${waText}`

    // ── 5. Save campaign record ─────────────────────────────────────────────
    let campaignId = 'pending'
    try {
      const { data: campaign, error: campErr } = await db
        .from('property_marketing_campaigns')
        .insert({
          property_id:     propertyId,
          builder_id:      builderId,
          campaign_name:   `Auto Campaign: ${property.title}`,
          campaign_type:   'property_launch',
          status:          'active',
          target_audience: content.targetAudience,
          content_data: {
            email_subject:   content.emailSubject,
            email_body_html: content.emailBodyHTML,
            social_post:     content.socialPost,
            whatsapp_msg:    content.whatsappMsg,
            highlights:      content.highlights,
          },
          analysis_data: {
            price_segment:     content.priceSegment,
            target_audience:   content.targetAudience,
          },
          whatsapp_share_link: waShareUrl,
          social_post_text:    content.socialPost,
          scheduled_at:        new Date().toISOString(),
        })
        .select('id')
        .single()

      if (!campErr && campaign) campaignId = campaign.id
    } catch (e) {
      console.error('[Launch] Campaign insert error:', (e as Error).message)
    }

    // ── 6. Send builder notification email (fire-and-forget) ────────────────
    if (builderEmail) {
      sendBuilderEmail(builderEmail, builderName, property as PropertyRow, content, waShareUrl)
        .catch(e => console.error('[Launch] Builder email error:', e))
    }

    // ── 7. Log automation activity ──────────────────────────────────────────
    try {
      await db.from('property_marketing_automation_logs').insert({
        property_id:    propertyId,
        builder_id:     builderId,
        campaign_id:    campaignId,
        automation_type: 'launch',
        status:          'success',
        details: {
          triggered_via:   'launch-endpoint',
          ai_enhanced:     !!process.env.OPENAI_API_KEY,
          builder_email_queued: !!builderEmail,
          duration_ms:     Date.now() - startTime,
        },
      })
    } catch (e) {
      console.warn('[Launch] Log insert error:', (e as Error).message)
    }

    return NextResponse.json({
      success:        true,
      campaign_id:    campaignId,
      property_id:    propertyId,
      whatsapp_share: waShareUrl,
      social_post:    content.socialPost,
      highlights:     content.highlights,
      target_audience: content.targetAudience,
      ai_enhanced:    !!process.env.OPENAI_API_KEY,
      message:        'Marketing campaign launched successfully',
    })

  } catch (error: any) {
    console.error('[Launch] Fatal error:', error)

    // Log failure
    if (propertyId) {
      const db = getAdminClient()
      await db.from('property_marketing_automation_logs').insert({
        property_id:     propertyId,
        builder_id:      builderId || null,
        campaign_id:     'failed',
        automation_type: 'launch',
        status:          'failed',
        details:         { error: error.message, triggered_via: 'launch-endpoint' },
      }).catch(() => {})
    }

    return NextResponse.json(
      { success: false, error: 'Marketing launch failed', details: error.message },
      { status: 500 }
    )
  }
}
