/**
 * EMAIL SEQUENCE QUEUE PROCESSOR — /api/automation/email/process-sequence-queue
 *
 * Processes scheduled drip emails from email_sequence_queue.
 * Called by the Netlify scheduled function every 30 minutes.
 *
 * Key design decisions:
 * - Uses buyer_email column from the queue row (no lead join required for recipient)
 * - Does NOT gate on builder_subscriptions (lead nurture is a platform feature, not per-subscription)
 * - Adds email open/click tracking pixels
 * - Retries up to 3 times, marks failed after 3 attempts
 * - Works with inline Resend fetch (no npm package dependency)
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getDb() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  emailId: string,
  leadId: string | number
): Promise<{ id: string | null; error: string | null }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { id: null, error: 'RESEND_API_KEY not configured' }

  // Add tracking pixel before </body>
  const trackBase = `https://tharaga.co.in/api/track`
  const pixel = `<img src="${trackBase}/open?eid=${emailId}&lid=${leadId}" width="1" height="1" alt="" style="display:none;" />`
  const htmlWithTracking = html.includes('</body>')
    ? html.replace('</body>', `${pixel}</body>`)
    : html + pixel

  // Wrap links for click tracking
  const htmlTracked = htmlWithTracking.replace(
    /<a href="(https:\/\/tharaga\.co\.in[^"]*)"/g,
    (_, url) => `<a href="${trackBase}/click?eid=${emailId}&lid=${leadId}&url=${encodeURIComponent(url)}"`
  )

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Tharaga <notifications@tharaga.co.in>',
        to: [to],
        subject,
        html: htmlTracked,
        headers: {
          'X-Entity-Ref-ID': emailId,
          'List-Unsubscribe': `<https://tharaga.co.in/unsubscribe?lead=${leadId}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (r.ok) {
      const d = await r.json()
      return { id: d?.id || 'sent', error: null }
    } else {
      const err = await r.text()
      return { id: null, error: err.slice(0, 200) }
    }
  } catch (e: any) {
    return { id: null, error: e.message }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth: accept either CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY in Authorization header
    // Both are valid callers: Netlify scheduled cron (CRON_SECRET) or internal admin triggers
    const authHeader = request.headers.get('authorization')
    const cronSecret   = process.env.CRON_SECRET
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY
    const token        = authHeader?.replace('Bearer ', '').trim()
    const isAuthorized = !cronSecret ||  // no secret required → open
      (token && (token === cronSecret || token === serviceKey))
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized — pass CRON_SECRET or service key' }, { status: 401 })
    }

    const db = await getDb()

    // Fetch emails that are due (scheduled_for <= now, status = scheduled, attempts < max_attempts)
    const { data: dueEmails, error: fetchErr } = await db
      .from('email_sequence_queue')
      .select('id,lead_id,builder_id,property_id,buyer_email,sequence_position,subject,html_content,status,attempts,max_attempts,metadata,campaign_type')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', 3)
      .order('scheduled_for', { ascending: true })
      .limit(50)

    if (fetchErr) {
      console.error('[SeqQueue] Fetch error:', fetchErr.message)
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!dueEmails || dueEmails.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No emails due' })
    }

    console.log(`[SeqQueue] Processing ${dueEmails.length} due email(s)`)
    const results: Array<{ id: string; status: string; error?: string }> = []

    for (const row of dueEmails as any[]) {
      try {
        // Determine recipient email
        // 1. Use buyer_email column (stored at schedule time — most reliable)
        // 2. Fall back to lead.email via join
        let recipientEmail = row.buyer_email || ''

        if (!recipientEmail) {
          // Fallback: fetch lead email
          try {
            const { data: lead } = await db
              .from('leads')
              .select('email')
              .eq('id', row.lead_id)
              .maybeSingle()
            recipientEmail = lead?.email || ''
          } catch { /* ignore */ }
        }

        if (!recipientEmail) {
          // No email address — cancel this drip entry
          await db
            .from('email_sequence_queue')
            .update({ status: 'cancelled', metadata: { ...row.metadata, reason: 'no_recipient_email' } })
            .eq('id', row.id)
          results.push({ id: row.id, status: 'cancelled', error: 'no_recipient_email' })
          continue
        }

        // Check lead status — skip if won/closed/lost
        let leadStatus = 'active'
        try {
          const { data: lead } = await db.from('leads').select('status').eq('id', row.lead_id).maybeSingle()
          leadStatus = lead?.status || 'active'
        } catch { /* ignore */ }

        if (['won', 'closed', 'sold', 'converted'].includes(leadStatus)) {
          await db
            .from('email_sequence_queue')
            .update({ status: 'cancelled', metadata: { ...row.metadata, reason: `lead_status_${leadStatus}` } })
            .eq('id', row.id)
          results.push({ id: row.id, status: 'cancelled', error: `lead_${leadStatus}` })
          continue
        }

        // Send email
        const { id: msgId, error: sendErr } = await sendViaResend(
          recipientEmail,
          row.subject,
          row.html_content || '',
          row.id,
          row.lead_id
        )

        if (msgId) {
          // Mark as sent
          await db
            .from('email_sequence_queue')
            .update({
              status:              'sent',
              sent_at:             new Date().toISOString(),
              provider_message_id: msgId,
              attempts:            (row.attempts || 0) + 1,
            })
            .eq('id', row.id)

          // Log delivery (non-blocking)
          db.from('email_delivery_logs').insert({
            property_id:         row.property_id,
            builder_id:          row.builder_id,
            lead_id:             row.lead_id,
            recipient_email:     recipientEmail,
            subject:             row.subject,
            status:              'sent',
            provider_message_id: msgId,
            sent_at:             new Date().toISOString(),
            metadata: {
              sequence_id:       row.id,
              sequence_position: row.sequence_position,
              campaign_type:     row.campaign_type || 'lead_nurture',
            },
          }).then(() => {}).catch((e: any) => console.warn('[SeqQueue] Log error:', e.message))

          results.push({ id: row.id, status: 'sent' })
          console.log(`[SeqQueue] Sent seq:${row.sequence_position} to ${recipientEmail} (lead ${row.lead_id})`)

        } else {
          // Sending failed — increment attempts, mark failed if max reached
          const newAttempts = (row.attempts || 0) + 1
          const newStatus = newAttempts >= (row.max_attempts || 3) ? 'failed' : 'scheduled'
          await db
            .from('email_sequence_queue')
            .update({
              attempts: newAttempts,
              status:   newStatus,
              metadata: { ...row.metadata, last_error: sendErr, last_attempt: new Date().toISOString() },
            })
            .eq('id', row.id)
          results.push({ id: row.id, status: newStatus, error: sendErr || 'send_failed' })
          console.error(`[SeqQueue] Send failed for ${row.id}: ${sendErr}`)
        }

      } catch (rowErr: any) {
        console.error(`[SeqQueue] Row error for ${row.id}:`, rowErr.message)
        await db
          .from('email_sequence_queue')
          .update({
            attempts: (row.attempts || 0) + 1,
            status:   (row.attempts || 0) >= 2 ? 'failed' : 'scheduled',
            metadata: { ...row.metadata, last_error: rowErr.message, last_attempt: new Date().toISOString() },
          })
          .eq('id', row.id)
        results.push({ id: row.id, status: 'error', error: rowErr.message })
      }
    }

    const sent    = results.filter(r => r.status === 'sent').length
    const failed  = results.filter(r => r.status === 'failed' || r.status === 'error').length
    const skipped = results.filter(r => r.status === 'cancelled').length

    return NextResponse.json({
      success:   true,
      processed: results.length,
      sent,
      failed,
      skipped,
      results,
    })

  } catch (err: any) {
    console.error('[SeqQueue] Fatal error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// Also support GET for health-check / manual trigger via browser
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Email sequence queue processor. POST to this endpoint to process due emails.',
    endpoint: '/api/automation/email/process-sequence-queue',
  })
}
