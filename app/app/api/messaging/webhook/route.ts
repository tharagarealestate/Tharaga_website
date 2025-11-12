// =============================================
// TWILIO WEBHOOK HANDLER
// POST /api/messaging/webhook
// Handle Twilio webhooks for message status updates
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { twilioClient } from '@/lib/integrations/messaging/twilioClient';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    const signature = request.headers.get('x-twilio-signature');
    const url = request.url;
    const body = await request.text();

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Twilio signature' },
        { status: 401 }
      );
    }

    // Validate signature
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      console.error('TWILIO_AUTH_TOKEN not configured');
      return NextResponse.json(
        { error: 'Webhook authentication failed' },
        { status: 500 }
      );
    }

    const params = new URLSearchParams(body);
    const twilioSignature = twilio.validateRequest(
      authToken,
      signature,
      url,
      Object.fromEntries(params)
    );

    if (!twilioSignature) {
      return NextResponse.json(
        { error: 'Invalid Twilio signature' },
        { status: 401 }
      );
    }

    // Parse webhook data
    const webhookData = {
      MessageSid: params.get('MessageSid') || '',
      MessageStatus: params.get('MessageStatus') || '',
      ErrorCode: params.get('ErrorCode') || undefined,
      ErrorMessage: params.get('ErrorMessage') || undefined,
      From: params.get('From') || '',
      To: params.get('To') || '',
    };

    // Handle webhook
    await twilioClient.handleWebhook(webhookData);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Twilio webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

