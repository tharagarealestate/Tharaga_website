/**
 * THARAGA AI — Send Opening WhatsApp Greeting
 * POST /api/whatsapp/send-greeting
 *
 * Called internally by /api/meta/webhook after a new Meta Lead Ad is captured.
 * Sends the opening "Hi {name}, I'm Tharaga AI..." message via Twilio.
 *
 * Internal-only: validated by x-internal-secret header.
 */

import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Internal secret guard
  const secret = request.headers.get('x-internal-secret')
  if (secret !== (process.env.INTERNAL_API_SECRET ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leadId, phone, name } = await request.json()
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_WHATSAPP_NUMBER

  if (!accountSid || !authToken || !from) {
    console.warn('[send-greeting] Twilio not configured — skipping WhatsApp greeting')
    return NextResponse.json({ skipped: true, reason: 'Twilio not configured' })
  }

  const client = twilio(accountSid, authToken)
  const firstName = (name ?? 'there').split(' ')[0]

  const greetingText =
    `Hi ${firstName}! 👋 I'm Tharaga AI, your personal property assistant.\n\n` +
    `You recently showed interest in a property in Chennai. I'm here to help you find your perfect home! 🏠\n\n` +
    `Quick question — are you looking to *buy*, *invest*, or *rent*? And what type of property interests you? (Apartment/Villa/Plot)`

  try {
    await client.messages.create({
      from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      to:   phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`,
      body: greetingText,
    })
    console.log(`[send-greeting] Greeting sent to ${phone} for lead ${leadId}`)
    return NextResponse.json({ sent: true })
  } catch (err: any) {
    console.error('[send-greeting] Twilio error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
