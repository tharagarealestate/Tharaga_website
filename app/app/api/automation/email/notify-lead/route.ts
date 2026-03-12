/**
 * LEAD NOTIFICATION — /api/automation/email/notify-lead
 *
 * Triggered fire-and-forget immediately after a new lead is created.
 * Sends two emails:
 *   A) Builder notification: "🔔 New lead for your property"
 *   B) Buyer confirmation:   "✅ Your enquiry is received — builder contacts you within 2 hours"
 *
 * Also schedules a 3-email buyer drip sequence in email_sequence_queue.
 * Works with or without RESEND_API_KEY — logs to DB when key not configured.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Inline client per request — avoids Netlify serverless cold-start crash with singletons
async function getDb() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  metadata: Record<string, string>
): Promise<string | null> {
  const key = process.env.RESEND_API_KEY
  if (!key) return null

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Tharaga <notifications@tharaga.co.in>',
        to:   [to],
        subject,
        html,
        tags: Object.entries(metadata).map(([name, value]) => ({ name, value })),
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (r.ok) {
      const d = await r.json()
      return d?.id || 'sent'
    } else {
      const err = await r.text()
      console.error('[NotifyLead] Resend error:', err)
      return null
    }
  } catch (e) {
    console.error('[NotifyLead] Resend fetch error:', (e as Error).message)
    return null
  }
}

// ─── Builder notification HTML ────────────────────────────────────────────────

function builderNotificationHTML(opts: {
  builderName: string
  leadName: string
  leadEmail: string
  leadPhone: string
  propertyTitle: string
  propertyId: string
  message: string
  score: number
  leadId: string
}): string {
  const scoreColor = opts.score >= 15 ? '#ef4444' : opts.score >= 10 ? '#f59e0b' : '#6b7280'
  const scoreLabel = opts.score >= 15 ? '🔥 Hot Lead' : opts.score >= 10 ? '⚡ Warm Lead' : '📧 New Lead'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:24px 28px;border-bottom:1px solid rgba(251,191,36,0.1);">
      <p style="margin:0 0 2px;font-size:11px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA AI</p>
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#f9fafb;">🔔 New Lead Received!</h1>
    </td>
  </tr>
  <!-- Score badge -->
  <tr>
    <td style="padding:16px 28px;background:rgba(251,191,36,0.04);">
      <span style="display:inline-block;background:${scoreColor};color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">${scoreLabel} · Score ${opts.score}</span>
    </td>
  </tr>
  <!-- Lead info -->
  <tr>
    <td style="padding:4px 28px 20px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong style="color:#f9fafb;">${opts.builderName}</strong>, you have a new enquiry for <strong style="color:#fbbf24;">${opts.propertyTitle}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.07);">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#fbbf24;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Lead Details</p>
          <p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">👤 <strong>${opts.leadName}</strong></p>
          ${opts.leadEmail ? `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">✉️ <a href="mailto:${opts.leadEmail}" style="color:#fbbf24;text-decoration:none;">${opts.leadEmail}</a></p>` : ''}
          ${opts.leadPhone ? `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">📞 <a href="tel:${opts.leadPhone}" style="color:#fbbf24;text-decoration:none;">${opts.leadPhone}</a></p>` : ''}
          ${opts.message  ? `<p style="margin:8px 0 0;font-size:13px;color:#9ca3af;font-style:italic;">"${opts.message.slice(0, 200)}"</p>` : ''}
        </td></tr>
      </table>
    </td>
  </tr>
  <!-- CTA -->
  <tr>
    <td style="padding:0 28px 24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">⚡ Respond within 2 hours to maximise conversion (90% of deals close faster with quick response).</p>
      <table cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          ${opts.leadPhone ? `<td style="padding-right:10px;"><a href="tel:${opts.leadPhone}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:8px;">📞 Call Now</a></td>` : ''}
          <td style="padding-right:10px;"><a href="https://tharaga.co.in/builder?section=leads" style="display:inline-block;background:rgba(255,255,255,0.07);color:#d1d5db;font-size:14px;text-decoration:none;padding:11px 22px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);">View in Dashboard</a></td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Footer -->
  <tr><td style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Buyer confirmation HTML ───────────────────────────────────────────────────

function buyerConfirmationHTML(opts: {
  buyerName: string
  propertyTitle: string
  propertyId: string
  builderName: string
  locality: string
  price: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
  <tr>
    <td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:24px 28px;border-bottom:1px solid rgba(251,191,36,0.1);text-align:center;">
      <p style="margin:0 0 2px;font-size:11px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA REAL ESTATE</p>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#f9fafb;">✅ Enquiry Received!</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
        Hi <strong style="color:#f9fafb;">${opts.buyerName}</strong>,<br/>
        We've received your enquiry for <strong style="color:#fbbf24;">${opts.propertyTitle}</strong> in ${opts.locality}. The builder will contact you within <strong style="color:#f9fafb;">2 hours</strong>.
      </p>
      <!-- Property card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border-radius:10px;border:1px solid rgba(251,191,36,0.1);">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">Your Enquiry Summary</p>
          <p style="margin:0 0 4px;font-size:14px;color:#d1d5db;">🏠 ${opts.propertyTitle}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#d1d5db;">📍 ${opts.locality}</p>
          <p style="margin:0;font-size:14px;color:#fbbf24;font-weight:600;">${opts.price}</p>
        </td></tr>
      </table>
      <!-- Next steps -->
      <p style="margin:20px 0 8px;font-size:14px;font-weight:600;color:#f9fafb;">What happens next?</p>
      ${[
        '📞 Builder contacts you within 2 hours',
        '🏠 Schedule a site visit at your convenience',
        '📋 Get property documents & pricing details',
        '🔑 Move forward with your dream home',
      ].map(s => `<p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">${s}</p>`).join('')}
      <!-- CTA -->
      <p style="margin:20px 0 10px;text-align:center;">
        <a href="https://tharaga.co.in/properties/${opts.propertyId}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">View Property Details →</a>
      </p>
    </td>
  </tr>
  <tr><td style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · Chennai, Tamil Nadu · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Drip email HTML templates ─────────────────────────────────────────────────

function dripEmail1HTML(opts: { buyerName: string; propertyTitle: string; propertyId: string; locality: string; price: string; highlights: string[] }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:28px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
  <tr><td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:24px 28px;border-bottom:1px solid rgba(251,191,36,0.1);">
    <p style="margin:0 0 2px;font-size:11px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA · Day 1</p>
    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f9fafb;">Complete property details inside 🏠</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;">
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">Hi <strong style="color:#f9fafb;">${opts.buyerName}</strong>,<br>Here's everything you need to know about <strong style="color:#fbbf24;">${opts.propertyTitle}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border-radius:10px;margin-bottom:16px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">Key Highlights</p>
        ${opts.highlights.slice(0, 5).map(h => `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">✓ ${h}</p>`).join('')}
        <p style="margin:10px 0 0;font-size:15px;font-weight:700;color:#fbbf24;">${opts.price}</p>
      </td></tr>
    </table>
    <p style="margin:0;text-align:center;"><a href="https://tharaga.co.in/properties/${opts.propertyId}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">View Full Details →</a></p>
  </td></tr>
  <tr><td style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"><p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a> · <a href="https://tharaga.co.in/unsubscribe?lead={{LEAD_ID}}" style="color:#6b7280;text-decoration:none;font-size:10px;">Unsubscribe</a></p></td></tr>
</table>
</td></tr></table>
</body></html>`
}

function dripEmail2HTML(opts: { buyerName: string; propertyTitle: string; propertyId: string; locality: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:28px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
  <tr><td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:24px 28px;border-bottom:1px solid rgba(251,191,36,0.1);">
    <p style="margin:0 0 2px;font-size:11px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA · Day 3</p>
    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f9fafb;">Why ${opts.locality} is Chennai's fastest-growing area 📈</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;">
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">Hi <strong>${opts.buyerName}</strong>, here's why your property in ${opts.locality} is a smart investment right now:</p>
    ${[
      '🏗️ Major infrastructure projects driving 15-20% annual appreciation',
      '🏫 Top-rated schools & hospitals within 3 km',
      '🚇 Metro/transport connectivity boosting desirability',
      '🛒 Premium malls, tech parks & employment hubs nearby',
      '📊 Property values in this micro-market up 12% YoY',
    ].map(s => `<p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">${s}</p>`).join('')}
    <p style="margin:20px 0 0;text-align:center;"><a href="https://tharaga.co.in/properties/${opts.propertyId}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">Book a Site Visit →</a></p>
  </td></tr>
  <tr><td style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"><p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a> · <a href="https://tharaga.co.in/unsubscribe?lead={{LEAD_ID}}" style="color:#6b7280;text-decoration:none;font-size:10px;">Unsubscribe</a></p></td></tr>
</table>
</td></tr></table>
</body></html>`
}

function dripEmail3HTML(opts: { buyerName: string; propertyTitle: string; propertyId: string; price: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:28px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
  <tr><td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:24px 28px;border-bottom:1px solid rgba(251,191,36,0.1);">
    <p style="margin:0 0 2px;font-size:11px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA · Day 7</p>
    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f9fafb;">Your ROI analysis: Is this the right buy? 💰</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;">
    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">Hi <strong>${opts.buyerName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.6;">Still thinking about <strong style="color:#fbbf24;">${opts.propertyTitle}</strong>? Here's a quick investment case at <strong>${opts.price}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border-radius:10px;margin-bottom:16px;">
      <tr><td style="padding:16px 20px;">
        ${[
          ['Estimated Rental Yield', '4–5% per year'],
          ['Capital Appreciation (5yr)', '60–80%'],
          ['EMI (80% loan, 20yr)', 'Approx. ₹25,000–45,000/mo'],
          ['Break-even Horizon', '8–10 years'],
        ].map(([k, v]) => `<p style="margin:0 0 8px;font-size:14px;color:#d1d5db;"><strong style="color:#9ca3af;">${k}:</strong> <span style="color:#fbbf24;font-weight:600;">${v}</span></p>`).join('')}
      </td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;text-align:center;">Limited units — prices may increase soon.</p>
    <p style="margin:0;text-align:center;"><a href="https://tharaga.co.in/properties/${opts.propertyId}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">Secure Your Unit Now →</a></p>
  </td></tr>
  <tr><td style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"><p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a> · <a href="https://tharaga.co.in/unsubscribe?lead={{LEAD_ID}}" style="color:#6b7280;text-decoration:none;font-size:10px;">Unsubscribe</a></p></td></tr>
</table>
</td></tr></table>
</body></html>`
}

// ─── Schedule drip sequence for a lead ────────────────────────────────────────

async function scheduleDripSequence(db: any, opts: {
  leadId: string
  propertyId: string
  builderId: string
  buyerName: string
  propertyTitle: string
  propertyId2: string
  locality: string
  price: string
  highlights: string[]
  buyerEmail: string
}): Promise<void> {
  if (!opts.buyerEmail) return

  const now = new Date()
  const day = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString()

  const emails = [
    {
      sequence_position: 1,
      subject: `Your enquiry for ${opts.propertyTitle} — complete details inside 🏠`,
      html_content: dripEmail1HTML({
        buyerName: opts.buyerName,
        propertyTitle: opts.propertyTitle,
        propertyId: opts.propertyId2,
        locality: opts.locality,
        price: opts.price,
        highlights: opts.highlights,
      }).replace(/{{LEAD_ID}}/g, opts.leadId),
      scheduled_for: day(1),
    },
    {
      sequence_position: 2,
      subject: `Why ${opts.locality} is Chennai's hottest area right now 📈`,
      html_content: dripEmail2HTML({
        buyerName: opts.buyerName,
        propertyTitle: opts.propertyTitle,
        propertyId: opts.propertyId2,
        locality: opts.locality,
      }).replace(/{{LEAD_ID}}/g, opts.leadId),
      scheduled_for: day(3),
    },
    {
      sequence_position: 3,
      subject: `ROI analysis: Is ${opts.propertyTitle} the right investment? 💰`,
      html_content: dripEmail3HTML({
        buyerName: opts.buyerName,
        propertyTitle: opts.propertyTitle,
        propertyId: opts.propertyId2,
        price: opts.price,
      }).replace(/{{LEAD_ID}}/g, opts.leadId),
      scheduled_for: day(7),
    },
  ]

  const rows = emails.map(e => ({
    lead_id:           opts.leadId,
    property_id:       opts.propertyId,
    builder_id:        opts.builderId,
    ...e,
    status:            'scheduled',
    attempts:          0,
    metadata:          { buyer_email: opts.buyerEmail, campaign_type: 'lead_nurture' },
  }))

  const { error } = await db.from('email_sequence_queue').insert(rows)
  if (error) {
    console.error('[NotifyLead] Drip schedule error:', error.message)
  } else {
    console.log('[NotifyLead] Drip sequence scheduled for lead', opts.leadId)
  }
}

// ─── Main POST handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, property_id } = body

    if (!lead_id) {
      return NextResponse.json({ success: false, error: 'lead_id required' }, { status: 400 })
    }

    const db = await getDb()

    // ── Fetch lead ──────────────────────────────────────────────────────────
    const { data: lead, error: leadErr } = await db
      .from('leads')
      .select('id,name,email,phone_number,message,lead_score,builder_id,property_id')
      .eq('id', lead_id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }

    const effectivePropertyId = property_id || lead.property_id
    const builderId = lead.builder_id

    // ── Fetch property ──────────────────────────────────────────────────────
    let property: any = null
    if (effectivePropertyId) {
      const { data: p } = await db
        .from('properties')
        .select('id,title,city,locality,price_inr,bedrooms,sqft,images,amenities')
        .eq('id', effectivePropertyId)
        .maybeSingle()
      property = p
    }

    const propertyTitle = property?.title || 'Property Enquiry'
    const locality      = property?.locality || property?.city || 'Chennai'
    const price         = property?.price_inr ? formatINR(property.price_inr) : 'Price on request'
    const highlights: string[] = []
    if (property?.bedrooms) highlights.push(`${property.bedrooms} BHK`)
    if (property?.sqft)     highlights.push(`${property.sqft.toLocaleString()} sq.ft`)
    if (property?.locality) highlights.push(`Located in ${property.locality}`)
    if (property?.price_inr) highlights.push(`Starting at ${formatINR(property.price_inr)}`)

    // ── Fetch builder email ─────────────────────────────────────────────────
    let builderEmail = ''
    let builderName  = 'Builder'
    if (builderId) {
      try {
        const { data: { user: bu } } = await db.auth.admin.getUserById(builderId)
        builderEmail = bu?.email || ''
        builderName  = bu?.user_metadata?.full_name || builderEmail.split('@')[0] || 'Builder'
      } catch {}
      if (!builderEmail) {
        try {
          const { data: bp } = await db.from('builders').select('email,name').eq('id', builderId).maybeSingle()
          if (bp) { builderEmail = bp.email || ''; builderName = bp.name || builderName }
        } catch {}
      }
    }

    const results: Record<string, any> = {}

    // ── A. Builder notification ─────────────────────────────────────────────
    if (builderEmail) {
      const html = builderNotificationHTML({
        builderName,
        leadName:      lead.name || 'Unknown Buyer',
        leadEmail:     lead.email || '',
        leadPhone:     lead.phone_number || '',
        propertyTitle,
        propertyId:    effectivePropertyId || '',
        message:       lead.message || '',
        score:         lead.lead_score || 0,
        leadId:        String(lead.id),
      })
      const msgId = await sendViaResend(
        builderEmail,
        `🔔 New Lead: ${lead.name || 'Someone'} enquired about "${propertyTitle}"`,
        html,
        { type: 'builder-notification', lead_id: String(lead.id), builder_id: builderId || '' }
      )
      results.builder_email = msgId ? 'sent' : 'skipped_no_key'

      // Log delivery
      db.from('email_delivery_logs').insert({
        property_id:         effectivePropertyId,
        builder_id:          builderId,
        lead_id:             lead.id,
        recipient_email:     builderEmail,
        subject:             `New Lead: ${lead.name || 'Unknown'}`,
        status:              msgId ? 'sent' : 'pending',
        provider_message_id: msgId || null,
        sent_at:             msgId ? new Date().toISOString() : null,
        metadata:            { type: 'builder_notification' },
      }).then(() => {}).catch((e: any) => console.warn('[NotifyLead] delivery log error:', e.message))
    }

    // ── B. Buyer confirmation ───────────────────────────────────────────────
    if (lead.email) {
      const html = buyerConfirmationHTML({
        buyerName:     lead.name || 'There',
        propertyTitle,
        propertyId:    effectivePropertyId || '',
        builderName,
        locality,
        price,
      })
      const msgId = await sendViaResend(
        lead.email,
        `✅ Enquiry received for "${propertyTitle}" — builder contacts you within 2 hrs`,
        html,
        { type: 'buyer-confirmation', lead_id: String(lead.id) }
      )
      results.buyer_email = msgId ? 'sent' : 'skipped_no_key'

      // Log delivery
      db.from('email_delivery_logs').insert({
        property_id:         effectivePropertyId,
        builder_id:          builderId,
        lead_id:             lead.id,
        recipient_email:     lead.email,
        subject:             `Enquiry confirmed — ${propertyTitle}`,
        status:              msgId ? 'sent' : 'pending',
        provider_message_id: msgId || null,
        sent_at:             msgId ? new Date().toISOString() : null,
        metadata:            { type: 'buyer_confirmation' },
      }).then(() => {}).catch((e: any) => console.warn('[NotifyLead] delivery log error:', e.message))
    }

    // ── C. Schedule buyer drip sequence ────────────────────────────────────
    if (lead.email && effectivePropertyId && builderId) {
      await scheduleDripSequence(db, {
        leadId:        String(lead.id),
        propertyId:    effectivePropertyId,
        builderId,
        buyerName:     lead.name || 'There',
        propertyTitle,
        propertyId2:   effectivePropertyId,
        locality,
        price,
        highlights,
        buyerEmail:    lead.email,
      })
      results.drip_sequence = 'scheduled_3_emails'
    }

    return NextResponse.json({
      success: true,
      lead_id,
      results,
      resend_configured: !!process.env.RESEND_API_KEY,
    })

  } catch (error: any) {
    console.error('[NotifyLead] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Notification failed' },
      { status: 500 }
    )
  }
}
