import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

import { resendClient } from '@/lib/email/resendClient'

const SIGNATURE_HEADER = 'svix-signature'
const TIMESTAMP_HEADER = 'svix-timestamp'

function verifySignature({
  payload,
  signatureHeader,
  timestamp,
  secret,
}: {
  payload: string
  signatureHeader: string
  timestamp: string
  secret: string
}): boolean {
  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64')

  const signatures = signatureHeader
    .split(',')
    .map((entry) => entry.trim().split('='))
    .filter((parts) => parts.length === 2 && parts[1])
    .map(([, value]) => value)

  if (signatures.length === 0) return false

  const expectedBuffer = Buffer.from(expectedSignature)

  return signatures.some((sig) => {
    try {
      const provided = Buffer.from(sig)
      return (
        provided.length === expectedBuffer.length &&
        timingSafeEqual(provided, expectedBuffer)
      )
    } catch {
      return false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    const signatureHeader = request.headers.get(SIGNATURE_HEADER)
    const timestamp = request.headers.get(TIMESTAMP_HEADER)

    if (!signatureHeader || !timestamp) {
      return NextResponse.json(
        { error: 'Missing Svix signature headers' },
        { status: 400 },
      )
    }

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Resend webhook] Missing RESEND_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 },
      )
    }

    const isValid = verifySignature({
      payload: rawBody,
      signatureHeader,
      timestamp,
      secret: webhookSecret,
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    await resendClient.handleWebhook(event)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Resend webhook] Error processing event', error)
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}

