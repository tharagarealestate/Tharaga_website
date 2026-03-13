/**
 * LEAD NOTIFICATION — /api/automation/email/notify-lead
 *
 * Triggered fire-and-forget immediately after a new lead is created.
 * Sends two emails:
 *   A) Builder notification: "🔔 New lead for your property" + WhatsApp deep link
 *   B) Buyer confirmation:   "✅ Your enquiry is received"
 *
 * Also schedules a 7-email buyer drip sequence in email_sequence_queue.
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

/** Generate WhatsApp deep link to message a lead directly */
function buildWhatsAppLeadLink(phone: string, buyerName: string, propertyTitle: string): string {
  const msg = `Hi ${buyerName}, this is regarding your enquiry for "${propertyTitle}" on Tharaga. When would be a good time to connect?`
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
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

// ─── Builder notification HTML (includes WhatsApp deep link) ──────────────────

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
  whatsappLink: string | null
}): string {
  const scoreColor = opts.score >= 8 ? '#ef4444' : opts.score >= 6 ? '#f59e0b' : '#6b7280'
  const scoreLabel = opts.score >= 8 ? '🔥 Hot Lead' : opts.score >= 6 ? '⚡ Warm Lead' : '📧 New Lead'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
  <tr>
    <td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:24px 28px;border-bottom:1px solid rgba(251,191,36,0.1);">
      <p style="margin:0 0 2px;font-size:11px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA AI</p>
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#f9fafb;">🔔 New Lead Received!</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 28px;background:rgba(251,191,36,0.04);">
      <span style="display:inline-block;background:${scoreColor};color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">${scoreLabel} · Score ${opts.score}/10</span>
    </td>
  </tr>
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
  <tr>
    <td style="padding:0 28px 24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">⚡ Respond within 2 hours — 90% of deals close faster with quick first contact.</p>
      <table cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          ${opts.leadPhone ? `<td style="padding-right:10px;"><a href="tel:${opts.leadPhone}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:8px;">📞 Call Now</a></td>` : ''}
          ${opts.whatsappLink ? `<td style="padding-right:10px;"><a href="${opts.whatsappLink}" style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:8px;">💬 WhatsApp</a></td>` : ''}
          <td><a href="https://tharaga.co.in/builder?section=leads" style="display:inline-block;background:rgba(255,255,255,0.07);color:#d1d5db;font-size:14px;text-decoration:none;padding:11px 22px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);">View Dashboard</a></td>
        </tr>
      </table>
    </td>
  </tr>
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
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border-radius:10px;border:1px solid rgba(251,191,36,0.1);">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">Your Enquiry Summary</p>
          <p style="margin:0 0 4px;font-size:14px;color:#d1d5db;">🏠 ${opts.propertyTitle}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#d1d5db;">📍 ${opts.locality}</p>
          <p style="margin:0;font-size:14px;color:#fbbf24;font-weight:600;">${opts.price}</p>
        </td></tr>
      </table>
      <p style="margin:20px 0 8px;font-size:14px;font-weight:600;color:#f9fafb;">What happens next?</p>
      ${[
        '📞 Builder contacts you within 2 hours',
        '🏠 Schedule a site visit at your convenience',
        '📋 Get property documents & pricing details',
        '🔑 Move forward with your dream home',
      ].map(s => `<p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">${s}</p>`).join('')}
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

// ─── 7-email drip HTML templates ──────────────────────────────────────────────

function emailHdr(day: string, headline: string) {
  return `<tr><td style="background:linear-gradient(135deg,#1a1a26,#252535);padding:24px 28px;border-bottom:1px solid rgba(251,191,36,0.1);">
    <p style="margin:0 0 2px;font-size:11px;color:#fbbf24;letter-spacing:2px;text-transform:uppercase;">THARAGA · ${day}</p>
    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f9fafb;">${headline}</h1>
  </td></tr>`
}

function emailFooter(leadId: string) {
  return `<tr><td style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="margin:0;font-size:11px;color:#4b5563;">Tharaga Real Estate · <a href="https://tharaga.co.in" style="color:#fbbf24;text-decoration:none;">tharaga.co.in</a> · <a href="https://tharaga.co.in/unsubscribe?lead=${leadId}" style="color:#6b7280;text-decoration:none;font-size:10px;">Unsubscribe</a></p>
  </td></tr>`
}

function wrapEmail(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:28px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a26;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
${body}
</table></td></tr></table></body></html>`
}

function ctaBtn(url: string, label: string) {
  return `<p style="margin:20px 0 0;text-align:center;"><a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">${label}</a></p>`
}

// Day 1 — Full property details + highlights
function dripDay1(opts: { name: string; title: string; pid: string; locality: string; price: string; highlights: string[]; leadId: string }): string {
  return wrapEmail(`
    ${emailHdr('Day 1', 'Complete property details inside 🏠')}
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong style="color:#f9fafb;">${opts.name}</strong>, here's everything about <strong style="color:#fbbf24;">${opts.title}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border-radius:10px;margin-bottom:16px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">Key Highlights</p>
          ${opts.highlights.slice(0, 5).map(h => `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">✓ ${h}</p>`).join('')}
          <p style="margin:10px 0 0;font-size:15px;font-weight:700;color:#fbbf24;">${opts.price}</p>
        </td></tr>
      </table>
      ${ctaBtn(`https://tharaga.co.in/properties/${opts.pid}`, 'View Full Details →')}
    </td></tr>
    ${emailFooter(opts.leadId)}`)
}

// Day 3 — Locality intelligence
function dripDay3(opts: { name: string; title: string; pid: string; locality: string; leadId: string }): string {
  return wrapEmail(`
    ${emailHdr('Day 3', `Why ${opts.locality} is Chennai's fastest-growing area 📈`)}
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong>${opts.name}</strong>, here's why <strong style="color:#fbbf24;">${opts.locality}</strong> is a smart investment right now:</p>
      ${[
        '🏗️ Major infrastructure projects driving 15–20% annual appreciation',
        '🏫 Top-rated schools & hospitals within 3 km',
        '🚇 Metro/transport connectivity boosting desirability',
        '🛒 Premium malls, tech parks & employment hubs nearby',
        '📊 Property values in this micro-market up 12% YoY',
      ].map(s => `<p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">${s}</p>`).join('')}
      ${ctaBtn(`https://tharaga.co.in/properties/${opts.pid}`, 'Book a Site Visit →')}
    </td></tr>
    ${emailFooter(opts.leadId)}`)
}

// Day 5 — ROI calculator (personalized link)
function dripDay5(opts: { name: string; title: string; pid: string; price: string; leadId: string }): string {
  const roiUrl = `https://tharaga.co.in/tools?t=roi&property=${opts.pid}`
  return wrapEmail(`
    ${emailHdr('Day 5', 'Calculate your exact returns in 60 seconds 💹')}
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong>${opts.name}</strong>, wondering if <strong style="color:#fbbf24;">${opts.title}</strong> makes financial sense?</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border-radius:10px;margin-bottom:16px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fbbf24;">Our ROI Calculator shows you:</p>
          ${[
            '📈 Expected rental yield (% per year)',
            '💰 Capital appreciation over 5 & 10 years',
            '🏦 Monthly EMI estimate (pre-filled for this property)',
            '⏱️ Break-even horizon in years',
            '📊 Compared to FD, mutual funds & gold',
          ].map(s => `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">${s}</p>`).join('')}
        </td></tr>
      </table>
      ${ctaBtn(roiUrl, 'Calculate My Returns →')}
      <p style="margin:12px 0 0;font-size:12px;color:#6b7280;text-align:center;">Pre-filled with ${opts.title} · ${opts.price}</p>
    </td></tr>
    ${emailFooter(opts.leadId)}`)
}

// Day 7 — Investment case / ROI analysis
function dripDay7(opts: { name: string; title: string; pid: string; price: string; leadId: string }): string {
  return wrapEmail(`
    ${emailHdr('Day 7', 'Your ROI analysis: Is this the right buy? 💰')}
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;">Still thinking about <strong style="color:#fbbf24;">${opts.title}</strong>? Here's a quick investment case at <strong>${opts.price}</strong>:</p>
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
      ${ctaBtn(`https://tharaga.co.in/properties/${opts.pid}`, 'Secure Your Unit Now →')}
    </td></tr>
    ${emailFooter(opts.leadId)}`)
}

// Day 14 — Social proof + urgency
function dripDay14(opts: { name: string; title: string; pid: string; locality: string; leadId: string }): string {
  return wrapEmail(`
    ${emailHdr('Day 14', 'High demand alert for your shortlisted property 🔥')}
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;">Quick update on <strong style="color:#fbbf24;">${opts.title}</strong>:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.06);border-radius:10px;border:1px solid rgba(239,68,68,0.2);margin-bottom:16px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;">⚠️ Demand Alert</p>
          ${[
            '👨‍👩‍👧 Multiple families have visited this property this week',
            '📋 Several enquiries received since your initial interest',
            '📈 Prices in ' + opts.locality + ' have moved up this month',
            '🔑 Only a limited number of units remain available',
          ].map(s => `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">${s}</p>`).join('')}
        </td></tr>
      </table>
      <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;text-align:center;">Don't let this one slip away. Book your site visit now — it's free and takes just 45 minutes.</p>
      ${ctaBtn(`https://tharaga.co.in/properties/${opts.pid}`, 'Book Free Site Visit →')}
    </td></tr>
    ${emailFooter(opts.leadId)}`)
}

// Day 21 — Price movement + special offer
function dripDay21(opts: { name: string; title: string; pid: string; price: string; leadId: string }): string {
  return wrapEmail(`
    ${emailHdr('Day 21', 'The builder has a special offer — act before it expires 🎯')}
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;">We have an update on <strong style="color:#fbbf24;">${opts.title}</strong> that you'll want to see:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.06);border-radius:10px;border:1px solid rgba(251,191,36,0.2);margin-bottom:16px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">Limited-Time Offer</p>
          ${[
            '🎁 Special pricing for buyers who complete formalities this month',
            '🏦 Zero floor-rise charges for bookings made now',
            '📋 Free legal documentation assistance',
            '🤝 Flexible payment schedule available',
          ].map(s => `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">${s}</p>`).join('')}
          <p style="margin:12px 0 0;font-size:15px;font-weight:700;color:#fbbf24;">Starting at ${opts.price} · Offer valid this month only</p>
        </td></tr>
      </table>
      ${ctaBtn(`https://tharaga.co.in/properties/${opts.pid}`, 'Claim This Offer →')}
    </td></tr>
    ${emailFooter(opts.leadId)}`)
}

// Day 30 — Final re-engagement
function dripDay30(opts: { name: string; title: string; pid: string; locality: string; leadId: string }): string {
  const listingUrl = `https://tharaga.co.in/property-listing?city=Chennai&locality=${encodeURIComponent(opts.locality)}`
  return wrapEmail(`
    ${emailHdr('Day 30', 'Still searching? We have new options in your area 🏡')}
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;">Hi <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;">It's been a month since you enquired about <strong style="color:#fbbf24;">${opts.title}</strong>. Still looking for your dream home in ${opts.locality}?</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.07);margin-bottom:16px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fbbf24;">We can help you find the right home:</p>
          ${[
            '🏠 Browse 50+ active listings in Chennai',
            '📊 Use our AI property comparison tool',
            '🏦 Check your loan eligibility in 2 minutes',
            '📍 Filter by metro proximity, schools, IT parks',
          ].map(s => `<p style="margin:0 0 6px;font-size:14px;color:#d1d5db;">${s}</p>`).join('')}
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:4px;">
        <tr>
          <td style="padding-right:10px;width:50%;">
            ${ctaBtn(`https://tharaga.co.in/properties/${opts.pid}`, 'Back to This Property →').replace('margin:20px', 'margin:0')}
          </td>
          <td style="width:50%;">
            ${ctaBtn(listingUrl, 'Browse All Listings →').replace('background:linear-gradient(135deg,#f59e0b,#d97706)', 'background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15)').replace('margin:20px', 'margin:0')}
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#6b7280;text-align:center;">If you've already found your home, congratulations! 🎉 We'll stop sending updates after this email.</p>
    </td></tr>
    ${emailFooter(opts.leadId)}`)
}

// ─── Schedule 7-email drip sequence ───────────────────────────────────────────

async function scheduleDripSequence(db: any, opts: {
  leadId: string
  propertyId: string
  builderId: string | null
  buyerName: string
  propertyTitle: string
  locality: string
  price: string
  highlights: string[]
  buyerEmail: string
}): Promise<{ ok: boolean; count: number }> {
  if (!opts.buyerEmail) return { ok: false, count: 0 }

  const now = new Date()
  const day = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString()

  const base = { name: opts.buyerName, title: opts.propertyTitle, pid: opts.propertyId, locality: opts.locality, price: opts.price, leadId: opts.leadId }

  const emails = [
    { sequence_position: 1, subject: `Your enquiry for ${opts.propertyTitle} — complete details inside 🏠`,    html_content: dripDay1({ ...base, highlights: opts.highlights }), scheduled_for: day(1)  },
    { sequence_position: 2, subject: `Why ${opts.locality} is Chennai's hottest area right now 📈`,             html_content: dripDay3(base),                                       scheduled_for: day(3)  },
    { sequence_position: 3, subject: `Calculate your returns on ${opts.propertyTitle} 💹`,                      html_content: dripDay5(base),                                       scheduled_for: day(5)  },
    { sequence_position: 4, subject: `ROI analysis: Is ${opts.propertyTitle} the right investment? 💰`,         html_content: dripDay7(base),                                       scheduled_for: day(7)  },
    { sequence_position: 5, subject: `⚠️ High demand for your shortlisted property in ${opts.locality}`,        html_content: dripDay14(base),                                      scheduled_for: day(14) },
    { sequence_position: 6, subject: `Special offer on ${opts.propertyTitle} — expires soon 🎯`,                html_content: dripDay21(base),                                      scheduled_for: day(21) },
    { sequence_position: 7, subject: `Still looking for a home in ${opts.locality}? New options available 🏡`,  html_content: dripDay30(base),                                      scheduled_for: day(30) },
  ]

  // Verify property exists in DB before including FK'd column
  let safePropertyId: string | null = null
  if (opts.propertyId) {
    try {
      const { data: propCheck } = await db.from('properties').select('id').eq('id', opts.propertyId).maybeSingle()
      safePropertyId = propCheck?.id || null
    } catch { /* ignore — leave property_id null */ }
  }

  const rows = emails.map(e => ({
    lead_id:           Number(opts.leadId),    // BIGINT — must be number not string
    property_id:       safePropertyId,         // null if property not in DB
    builder_id:        opts.builderId || null, // nullable UUID
    buyer_email:       opts.buyerEmail,        // ← CRITICAL: stored so processor can send without joining leads
    campaign_type:     'lead_nurture',
    ...e,
    status:            'scheduled',
    attempts:          0,
    max_attempts:      3,
  }))

  const { error } = await db.from('email_sequence_queue').insert(rows)
  if (error) {
    console.error('[NotifyLead] Drip schedule error:', error.message, error.code)
    return { ok: false, count: 0 }
  }
  console.log('[NotifyLead] Drip sequence: 7 emails scheduled for lead', opts.leadId)
  return { ok: true, count: 7 }
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

    // ── Fetch property ──────────────────────────────────────────────────────
    let property: any = null
    if (effectivePropertyId) {
      const { data: p } = await db
        .from('properties')
        .select('id,title,city,locality,price_inr,bedrooms,sqft,images,amenities,builder_id')
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

    // Resolve builderId — lead.builder_id first, fall back to property.builder_id
    const effectiveBuilderId = lead.builder_id || property?.builder_id || null

    // ── Fetch builder email via auth.admin only (builders table has no email col) ─
    let builderEmail = ''
    let builderName  = 'Builder'
    if (effectiveBuilderId) {
      try {
        const { data: { user: bu } } = await db.auth.admin.getUserById(effectiveBuilderId)
        builderEmail = bu?.email || ''
        builderName  = bu?.user_metadata?.full_name || bu?.user_metadata?.name || builderEmail.split('@')[0] || 'Builder'
      } catch { /* ignore */ }
    }

    const results: Record<string, any> = {
      resend_key_set: !!process.env.RESEND_API_KEY,
      builder_id_resolved: effectiveBuilderId || 'null',
    }

    // ── A. Builder notification email ───────────────────────────────────────
    if (builderEmail) {
      const waLink = lead.phone_number
        ? buildWhatsAppLeadLink(lead.phone_number, lead.name || 'the buyer', propertyTitle)
        : null

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
        whatsappLink:  waLink,
      })
      const msgId = await sendViaResend(
        builderEmail,
        `🔔 New Lead: ${lead.name || 'Someone'} enquired about "${propertyTitle}"`,
        html,
        { type: 'builder-notification', lead_id: String(lead.id), builder_id: effectiveBuilderId || '' }
      )
      results.builder_email = msgId ? 'sent' : 'skipped_no_key'

      db.from('email_delivery_logs').insert({
        property_id:         effectivePropertyId,
        builder_id:          effectiveBuilderId,
        lead_id:             lead.id,
        recipient_email:     builderEmail,
        subject:             `New Lead: ${lead.name || 'Unknown'}`,
        status:              msgId ? 'sent' : 'pending',
        provider_message_id: msgId || null,
        sent_at:             msgId ? new Date().toISOString() : null,
        metadata:            { type: 'builder_notification' },
      }).then(() => {}).catch((e: any) => console.warn('[NotifyLead] delivery log error:', e.message))
    } else {
      results.builder_email = 'skipped_no_builder_email'
    }

    // ── B. Buyer confirmation email ─────────────────────────────────────────
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

      db.from('email_delivery_logs').insert({
        property_id:         effectivePropertyId,
        builder_id:          effectiveBuilderId,
        lead_id:             lead.id,
        recipient_email:     lead.email,
        subject:             `Enquiry confirmed — ${propertyTitle}`,
        status:              msgId ? 'sent' : 'pending',
        provider_message_id: msgId || null,
        sent_at:             msgId ? new Date().toISOString() : null,
        metadata:            { type: 'buyer_confirmation' },
      }).then(() => {}).catch((e: any) => console.warn('[NotifyLead] delivery log error:', e.message))
    } else {
      results.buyer_email = 'skipped_no_email'
    }

    // ── C. Schedule 7-email drip sequence ──────────────────────────────────
    // Gate: buyer must have email + we must know which property
    if (lead.email && effectivePropertyId) {
      const drip = await scheduleDripSequence(db, {
        leadId:        String(lead.id),
        propertyId:    effectivePropertyId,
        builderId:     effectiveBuilderId || null,
        buyerName:     lead.name || 'There',
        propertyTitle,
        locality,
        price,
        highlights,
        buyerEmail:    lead.email,
      })
      results.drip_sequence = drip.ok ? `scheduled_${drip.count}_emails` : 'schedule_failed'
    } else {
      results.drip_sequence = lead.email ? 'skipped_no_property' : 'skipped_no_buyer_email'
    }

    return NextResponse.json({
      success:            true,
      lead_id,
      builder_email_found: !!builderEmail,
      results,
    })

  } catch (error: any) {
    console.error('[NotifyLead] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Notification failed' },
      { status: 500 }
    )
  }
}
