// =============================================
// TWILIO WEBHOOK ENDPOINT
// Handles Twilio SMS/WhatsApp/Call webhook events
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { WebhookTriggerListener } from '@/lib/automation/triggers/webhookTriggers';
import { eventListener } from '@/lib/automation/triggers/eventListener';

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

/**
 * Handle Twilio webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Twilio sends form-encoded data, so we need to get it as text first
    const bodyText = await req.text();
    const headersList = headers();
    const signature = headersList.get('x-twilio-signature') || headersList.get('X-Twilio-Signature');
    const requestUrl = headersList.get('x-twilio-request-url') || 
                      headersList.get('X-Twilio-Request-Url') ||
                      req.url;

    // Parse form data
    const formData = new URLSearchParams(bodyText);
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      body[key] = value;
    });

    console.log(`📥 Twilio webhook received: ${body.MessageStatus || body.CallStatus || 'unknown'}`);

    // Verify webhook signature if provided
    if (signature) {
      const isValid = await verifyTwilioSignature(signature, bodyText, requestUrl);
      if (!isValid) {
        console.error('❌ Twilio signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('✅ Twilio webhook signature verified');
    } else {
      console.warn('⚠️ Twilio webhook received without signature');
      // In production, you might want to require signatures
    }

    // Determine event type
    const eventType = determineEventType(body);

    // Find builder by Twilio account SID
    const builderId = await findBuilderByTwilioAccount(body.AccountSid as string);

    if (!builderId) {
      console.warn('⚠️ No builder found for Twilio account:', body.AccountSid);
      return NextResponse.json(
        { error: 'Builder not found' },
        { status: 404 }
      );
    }

    // Process webhook through trigger listener
    const webhookListener = new WebhookTriggerListener(
      eventListener.handleTriggerEvent.bind(eventListener)
    );

    // Convert headers to plain object
    const headersObj: Record<string, string> = {};
    headersList.forEach((value, key) => {
      headersObj[key] = value;
    });

    const result = await webhookListener.processWebhook({
      source: 'twilio',
      event_type: eventType,
      event_id: body.MessageSid as string || body.CallSid as string,
      headers: headersObj,
      body,
      signature: signature || undefined,
      builder_id: builderId,
      metadata: {
        account_sid: body.AccountSid,
        from: body.From,
        to: body.To,
        message_sid: body.MessageSid,
        call_sid: body.CallSid,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Handle specific Twilio events (optional business logic)
    await handleTwilioEvent(body, eventType, builderId);

    // Twilio expects TwiML response for some webhooks (status callbacks)
    // Return empty TwiML response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 
          'Content-Type': 'text/xml',
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Twilio webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Twilio webhook signature
 */
async function verifyTwilioSignature(
  signature: string,
  body: string,
  url: string
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.warn('Twilio auth token not configured');
    return false;
  }

  try {
    // Try to use Twilio SDK if available
    try {
      const twilio = await import('twilio');
      return twilio.validateRequest(
        authToken,
        signature,
        url,
        body
      );
    } catch (sdkError) {
      // Fallback to manual verification
      console.warn('Twilio SDK not available, using manual verification');
      return verifyTwilioSignatureManual(signature, body, url, authToken);
    }
  } catch (error) {
    console.error('Twilio signature verification failed:', error);
    return false;
  }
}

/**
 * Manual Twilio signature verification (fallback)
 */
function verifyTwilioSignatureManual(
  signature: string,
  body: string,
  url: string,
  authToken: string
): boolean {
  try {
    const data = url + body;
    const expected = crypto
      .createHmac('sha1', authToken)
      .update(data)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch (error) {
    console.error('Error in manual Twilio signature verification:', error);
    return false;
  }
}

/**
 * Determine Twilio event type
 */
function determineEventType(body: Record<string, string>): string {
  if (body.MessageSid) {
    // SMS/WhatsApp event
    const status = (body.MessageStatus || 'unknown').toLowerCase();
    return `message.${status}`;
  } else if (body.CallSid) {
    // Call event
    const status = (body.CallStatus || 'unknown').toLowerCase();
    return `call.${status}`;
  }
  return 'unknown';
}

/**
 * Find builder by Twilio account SID
 */
async function findBuilderByTwilioAccount(accountSid: string): Promise<string | null> {
  if (!accountSid) {
    return null;
  }

  try {
    const adminClient = getAdminClient();
    
    // Look up in integrations table
    // Twilio config is stored in config JSONB column
    const { data, error } = await adminClient
      .from('integrations')
      .select('builder_id, config')
      .eq('integration_type', 'messaging')
      .eq('provider', 'twilio')
      .eq('is_active', true)
      .eq('is_connected', true);

    if (error || !data || data.length === 0) {
      console.warn('No active Twilio integration found');
      return null;
    }

    // Find integration with matching account_sid in config
    const matchingIntegration = data.find(integration => {
      const config = integration.config as any;
      return config?.account_sid === accountSid || config?.AccountSid === accountSid;
    });

    if (!matchingIntegration) {
      console.warn('No Twilio integration found for account SID:', accountSid);
      return null;
    }

    return matchingIntegration.builder_id;
  } catch (error) {
    console.error('Error finding builder by Twilio account:', error);
    return null;
  }
}

/**
 * Handle specific Twilio events (optional business logic)
 */
async function handleTwilioEvent(
  body: Record<string, string>,
  eventType: string,
  builderId: string
) {
  try {
    switch (eventType) {
      case 'message.sent':
        await handleMessageSent(body, builderId);
        break;

      case 'message.delivered':
        await handleMessageDelivered(body, builderId);
        break;

      case 'message.failed':
      case 'message.undelivered':
        await handleMessageFailed(body, builderId);
        break;

      case 'call.initiated':
      case 'call.ringing':
        await handleCallRinging(body, builderId);
        break;

      case 'call.answered':
      case 'call.in-progress':
        await handleCallAnswered(body, builderId);
        break;

      case 'call.completed':
        await handleCallCompleted(body, builderId);
        break;

      case 'call.busy':
      case 'call.no-answer':
      case 'call.failed':
        await handleCallFailed(body, builderId);
        break;

      default:
        console.log(`ℹ️ Unhandled Twilio event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling Twilio event ${eventType}:`, error);
  }
}

/**
 * Handle message sent
 */
async function handleMessageSent(body: Record<string, string>, builderId: string) {
  console.log(`📤 Message sent: ${body.MessageSid} to ${body.To}`);
  
  // TODO: Update message status in database
  // This will be triggered through automation rules
}

/**
 * Handle message delivered
 */
async function handleMessageDelivered(body: Record<string, string>, builderId: string) {
  console.log(`✅ Message delivered: ${body.MessageSid}`);
  
  // TODO: Update message delivery status
  // This will be triggered through automation rules
}

/**
 * Handle message failed
 */
async function handleMessageFailed(body: Record<string, string>, builderId: string) {
  console.log(`❌ Message failed: ${body.MessageSid} - ${body.ErrorMessage || 'Unknown error'}`);
  
  // TODO: Log failed message and notify builder
  // This will be triggered through automation rules
}

/**
 * Handle call ringing
 */
async function handleCallRinging(body: Record<string, string>, builderId: string) {
  console.log(`📞 Call ringing: ${body.CallSid} to ${body.To}`);
  
  // TODO: Log call initiation
  // This will be triggered through automation rules
}

/**
 * Handle call answered
 */
async function handleCallAnswered(body: Record<string, string>, builderId: string) {
  console.log(`✅ Call answered: ${body.CallSid}`);
  
  // TODO: Update call status
  // This will be triggered through automation rules
}

/**
 * Handle call completed
 */
async function handleCallCompleted(body: Record<string, string>, builderId: string) {
  console.log(`📞 Call completed: ${body.CallSid} - Duration: ${body.CallDuration || 0}s`);
  
  // TODO: Store call duration and outcome
  // This will be triggered through automation rules
}

/**
 * Handle call failed
 */
async function handleCallFailed(body: Record<string, string>, builderId: string) {
  console.log(`❌ Call failed: ${body.CallSid}`);
  
  // TODO: Log failed call
  // This will be triggered through automation rules
}

/**
 * GET endpoint for webhook verification (Twilio may require this)
 */
export async function GET(request: NextRequest) {
  try {
    // Return webhook endpoint status
    return NextResponse.json({
      status: 'Webhook endpoint active',
      provider: 'twilio',
      timestamp: new Date().toISOString(),
      methods: ['GET', 'POST'],
      note: 'Twilio webhooks are sent as POST requests with form-encoded data',
    });
  } catch (error: any) {
    console.error('Error in webhook GET handler:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Webhook endpoint error',
      },
      { status: 500 }
    );
  }
}

