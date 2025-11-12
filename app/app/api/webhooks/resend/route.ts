export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// TODO: Import from @/lib/email/resendClient when implemented
// import { getServiceResendClient } from '@/lib/email/resendClient'

/**
 * Resend Webhook Handler
 * 
 * Handles webhook events from Resend for email tracking:
 * - email.sent: Email was successfully sent
 * - email.delivered: Email was delivered to recipient
 * - email.opened: Recipient opened the email
 * - email.clicked: Recipient clicked a link in the email
 * - email.bounced: Email bounced (hard or soft)
 * - email.complained: Recipient marked email as spam
 * - email.failed: Email send failed
 * 
 * Resend uses Svix for webhook delivery with HMAC SHA256 signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature headers (Resend uses Svix)
    const signature = request.headers.get('svix-signature')
    const timestamp = request.headers.get('svix-timestamp')
    const body = await request.text()

    // Validate required headers
    if (!signature || !timestamp) {
      console.warn('[Resend Webhook] Missing signature headers')
      return NextResponse.json(
        { error: 'Missing signature headers' },
        { status: 400 }
      )
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify signature using Svix format
    // Svix signature format: v1,<signature1> v1,<signature2> ...
    // We need to check if any signature matches
    const signatures = signature.split(' ')
    const signedPayload = `${timestamp}.${body}`
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('base64')

    let isValid = false
    for (const sig of signatures) {
      const [version, sigValue] = sig.split(',')
      if (version === 'v1' && sigValue) {
        try {
          const expectedBuffer = Buffer.from(`v1,${expectedSignature}`)
          const providedBuffer = Buffer.from(sig)
          if (expectedBuffer.length === providedBuffer.length) {
            isValid = timingSafeEqual(expectedBuffer, providedBuffer)
            if (isValid) break
          }
        } catch {
          // Continue to next signature
        }
      }
    }

    if (!isValid) {
      console.warn('[Resend Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse event payload
    let event: Record<string, any>
    try {
      event = JSON.parse(body)
    } catch (error) {
      console.error('[Resend Webhook] Invalid JSON payload', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate event structure
    if (!event?.type || !event?.data) {
      console.warn('[Resend Webhook] Invalid event structure', event)
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      )
    }

    // Handle event
    // TODO: Use resendClient.handleWebhook(event) when ResendClient is implemented
    await handleResendWebhookEvent(event)

    console.info(`[Resend Webhook] Processed event: ${event.type}`)

    return NextResponse.json({ received: true, event_type: event.type })
  } catch (error: any) {
    console.error('[Resend Webhook] Error handling webhook:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle Resend webhook events
 * Updates email delivery status, campaign stats, and recipient tracking
 */
async function handleResendWebhookEvent(event: Record<string, any>): Promise<void> {
  const type = event?.type
  const data = event?.data ?? {}
  if (!type || !data?.email_id) return

  const messageId = data.email_id as string
  const timestamp = new Date().toISOString()

  // Get Supabase service client for database updates
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Resend Webhook] Missing Supabase credentials')
    return
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    switch (type) {
      case 'email.sent':
        await supabase
          .from('email_deliveries')
          .update({
            status: 'sent',
            last_attempt_at: timestamp,
            updated_at: timestamp,
          })
          .eq('message_id', messageId)
        break

      case 'email.delivered':
        await supabase
          .from('email_deliveries')
          .update({
            status: 'delivered',
            delivered_at: timestamp,
            updated_at: timestamp,
          })
          .eq('message_id', messageId)

        // Update campaign recipient
        const { data: recipient } = await supabase
          .from('email_campaign_recipients')
          .select('campaign_id, id')
          .eq('message_id', messageId)
          .maybeSingle()

        if (recipient?.campaign_id) {
          await supabase
            .from('email_campaign_recipients')
            .update({
              status: 'delivered',
              delivered_at: timestamp,
            })
            .eq('id', recipient.id)

          // Increment campaign stat
          await supabase.rpc('increment_email_campaign_stat', {
            p_campaign_id: recipient.campaign_id,
            p_column: 'total_delivered',
            p_delta: 1,
          })
        }
        break

      case 'email.opened':
        await supabase
          .from('email_deliveries')
          .update({
            status: 'opened',
            opened_at: timestamp,
            updated_at: timestamp,
          })
          .eq('message_id', messageId)

        const { data: openedRecipient } = await supabase
          .from('email_campaign_recipients')
          .select('campaign_id, id, open_count')
          .eq('message_id', messageId)
          .maybeSingle()

        if (openedRecipient?.campaign_id) {
          await supabase
            .from('email_campaign_recipients')
            .update({
              status: 'opened',
              opened_at: timestamp,
              open_count: (openedRecipient.open_count ?? 0) + 1,
            })
            .eq('id', openedRecipient.id)

          await supabase.rpc('increment_email_campaign_stat', {
            p_campaign_id: openedRecipient.campaign_id,
            p_column: 'total_opened',
            p_delta: 1,
          })
        }
        break

      case 'email.clicked':
        await supabase
          .from('email_deliveries')
          .update({
            status: 'clicked',
            clicked_at: timestamp,
            updated_at: timestamp,
            metadata: { last_clicked_url: data.click?.link ?? null },
          })
          .eq('message_id', messageId)

        const { data: clickedRecipient } = await supabase
          .from('email_campaign_recipients')
          .select('campaign_id, id, click_count')
          .eq('message_id', messageId)
          .maybeSingle()

        if (clickedRecipient?.campaign_id) {
          await supabase
            .from('email_campaign_recipients')
            .update({
              status: 'clicked',
              clicked_at: timestamp,
              click_count: (clickedRecipient.click_count ?? 0) + 1,
              metadata: { last_clicked_url: data.click?.link ?? null },
            })
            .eq('id', clickedRecipient.id)

          await supabase.rpc('increment_email_campaign_stat', {
            p_campaign_id: clickedRecipient.campaign_id,
            p_column: 'total_clicked',
            p_delta: 1,
          })
        }
        break

      case 'email.bounced':
        await supabase
          .from('email_deliveries')
          .update({
            status: 'bounced',
            bounced_at: timestamp,
            error: data.bounce?.message ?? 'Email bounced',
            updated_at: timestamp,
          })
          .eq('message_id', messageId)

        const { data: bouncedRecipient } = await supabase
          .from('email_campaign_recipients')
          .select('campaign_id, id')
          .eq('message_id', messageId)
          .maybeSingle()

        if (bouncedRecipient?.campaign_id) {
          await supabase
            .from('email_campaign_recipients')
            .update({
              status: 'bounced',
              bounce_type: data.bounce?.type ?? 'unknown',
              error_message: data.bounce?.message ?? 'Email bounced',
            })
            .eq('id', bouncedRecipient.id)

          await supabase.rpc('increment_email_campaign_stat', {
            p_campaign_id: bouncedRecipient.campaign_id,
            p_column: 'total_bounced',
            p_delta: 1,
          })
        }
        break

      case 'email.complained':
        await supabase
          .from('email_deliveries')
          .update({
            status: 'complained',
            complaint_at: timestamp,
            error: 'Recipient reported spam',
            updated_at: timestamp,
          })
          .eq('message_id', messageId)

        const { data: complainedRecipient } = await supabase
          .from('email_campaign_recipients')
          .select('campaign_id, id')
          .eq('message_id', messageId)
          .maybeSingle()

        if (complainedRecipient?.campaign_id) {
          await supabase
            .from('email_campaign_recipients')
            .update({
              status: 'complained',
              error_message: 'Recipient reported spam',
            })
            .eq('id', complainedRecipient.id)

          await supabase.rpc('increment_email_campaign_stat', {
            p_campaign_id: complainedRecipient.campaign_id,
            p_column: 'total_complained',
            p_delta: 1,
          })
        }
        break

      case 'email.failed':
        await supabase
          .from('email_deliveries')
          .update({
            status: 'failed',
            error: data.error?.message ?? 'Email send failed',
            updated_at: timestamp,
          })
          .eq('message_id', messageId)
        break

      default:
        console.info(`[Resend Webhook] Unhandled event type: ${type}`)
    }
  } catch (error) {
    console.error(`[Resend Webhook] Error handling ${type}:`, error)
    throw error
  }
}
