// =============================================
// RESEND EMAIL WEBHOOK ENDPOINT
// Handles Resend email delivery webhook events
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { WebhookTriggerListener } from '@/lib/automation/triggers/webhookTriggers';
import { eventListener } from '@/lib/automation/triggers/eventListener';

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET!;

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

/**
 * Handle Resend webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const bodyText = await req.text();
    const headersList = headers();
    const signature = headersList.get('svix-signature') || headersList.get('Svix-Signature');
    const timestamp = headersList.get('svix-timestamp') || headersList.get('Svix-Timestamp');
    const messageId = headersList.get('svix-id') || headersList.get('Svix-Id');

    if (!signature || !timestamp) {
      console.error('❌ Missing Resend signature headers');
      return NextResponse.json(
        { error: 'Missing signature headers' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch (error) {
      console.error('❌ Invalid JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Verify webhook signature (using raw body text and timestamp)
    const isValid = verifyResendSignature(bodyText, signature, timestamp);
    if (!isValid) {
      console.error('❌ Resend signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log(`✅ Resend webhook verified: ${body.type}`);

    // Extract builder ID from email metadata/tags
    const builderId = await extractBuilderId(body);

    if (!builderId) {
      console.warn('⚠️ No builder ID found in Resend event');
      // Continue processing but log warning
      // Some events may not have builder_id (e.g., test events)
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
      source: 'resend',
      event_type: body.type,
      event_id: body.data?.email_id || messageId || undefined,
      headers: headersObj,
      body,
      signature,
      builder_id: builderId || undefined,
      metadata: {
        message_id: messageId,
        timestamp,
        email_id: body.data?.email_id,
        recipient: body.data?.to?.[0] || body.data?.email,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Handle specific Resend events (optional business logic)
    if (builderId) {
      await handleResendEvent(body, builderId);
    }

    return NextResponse.json({
      received: true,
      event_type: body.type,
      log_id: result.log_id,
    });

  } catch (error: any) {
    console.error('❌ Resend webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Resend webhook signature (Svix format)
 * Signature format: "v1,signature1 v1,signature2"
 */
function verifyResendSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!webhookSecret) {
    console.warn('Resend webhook secret not configured');
    return false;
  }

  try {
    // Create signed payload: timestamp.payload
    const signedPayload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('base64');

    // Signature format: "v1,signature1 v1,signature2" (can have multiple signatures)
    const signatures = signature.split(' ');

    // Check if any signature matches
    return signatures.some(sig => {
      const [version, sigValue] = sig.split(',');
      if (version !== 'v1') return false;

      try {
        return crypto.timingSafeEqual(
          Buffer.from(sigValue),
          Buffer.from(expectedSignature)
        );
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error('Error verifying Resend signature:', error);
    return false;
  }
}

/**
 * Extract builder ID from Resend webhook payload
 * Checks multiple locations: tags, metadata, or database lookup by email
 */
async function extractBuilderId(body: any): Promise<string | null> {
  try {
    const data = body.data || {};

    // Method 1: Check tags (Resend supports tags)
    if (data.tags?.builder_id) {
      return data.tags.builder_id;
    }

    // Method 2: Check metadata
    if (data.metadata?.builder_id) {
      return data.metadata.builder_id;
    }

    // Method 3: Check tags for organization_id (legacy support)
    if (data.tags?.organization_id) {
      return data.tags.organization_id;
    }

    // Method 4: Check metadata for organization_id (legacy support)
    if (data.metadata?.organization_id) {
      return data.metadata.organization_id;
    }

    // Method 5: Lookup by recipient email in leads table
    const recipientEmail = data.to?.[0] || data.email;
    if (recipientEmail) {
      const builderId = await findBuilderByEmail(recipientEmail);
      if (builderId) {
        return builderId;
      }
    }

    // Method 6: Lookup by email_id if we have a mapping table (future enhancement)
    // This would require storing email_id -> builder_id mapping when sending emails

    return null;
  } catch (error) {
    console.error('Error extracting builder ID from Resend webhook:', error);
    return null;
  }
}

/**
 * Find builder by recipient email (lookup in leads table)
 */
async function findBuilderByEmail(email: string): Promise<string | null> {
  if (!email) {
    return null;
  }

  try {
    const adminClient = getAdminClient();

    // Look up in leads table by email
    const { data, error } = await adminClient
      .from('leads')
      .select('builder_id')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.builder_id;
  } catch (error) {
    console.error('Error finding builder by email:', error);
    return null;
  }
}

/**
 * Handle specific Resend events (optional business logic)
 */
async function handleResendEvent(body: any, builderId: string) {
  try {
    const eventType = body.type;
    const data = body.data || {};

    switch (eventType) {
      case 'email.sent':
        await handleEmailSent(data, builderId);
        break;

      case 'email.delivered':
        await handleEmailDelivered(data, builderId);
        break;

      case 'email.opened':
        await handleEmailOpened(data, builderId);
        break;

      case 'email.clicked':
        await handleEmailClicked(data, builderId);
        break;

      case 'email.bounced':
        await handleEmailBounced(data, builderId);
        break;

      case 'email.complained':
        await handleEmailComplained(data, builderId);
        break;

      default:
        console.log(`ℹ️ Unhandled Resend event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling Resend event ${body.type}:`, error);
  }
}

/**
 * Handle email sent
 */
async function handleEmailSent(data: any, builderId: string) {
  console.log(`📧 Email sent: ${data.email_id} to ${data.to?.[0] || data.email}`);
  
  // TODO: Update email status in database
  // This will be triggered through automation rules
}

/**
 * Handle email delivered
 */
async function handleEmailDelivered(data: any, builderId: string) {
  console.log(`✅ Email delivered: ${data.email_id}`);
  
  // TODO: Update email delivery status
  // This will be triggered through automation rules
}

/**
 * Handle email opened
 */
async function handleEmailOpened(data: any, builderId: string) {
  console.log(`👀 Email opened: ${data.email_id}`);
  
  // TODO: Track email engagement in lead behavior
  // This will be triggered through automation rules
}

/**
 * Handle email clicked
 */
async function handleEmailClicked(data: any, builderId: string) {
  console.log(`🖱️ Email clicked: ${data.email_id} - Link: ${data.link}`);
  
  // TODO: Track link clicks in lead behavior
  // This will be triggered through automation rules
}

/**
 * Handle email bounced
 */
async function handleEmailBounced(data: any, builderId: string) {
  console.log(`❌ Email bounced: ${data.email_id} - Reason: ${data.bounce_type || 'unknown'}`);
  
  // TODO: Mark email as invalid in lead record
  // This will be triggered through automation rules
}

/**
 * Handle email complained (spam complaint)
 */
async function handleEmailComplained(data: any, builderId: string) {
  console.log(`⚠️ Spam complaint: ${data.email_id}`);
  
  // TODO: Unsubscribe lead from email campaigns
  // This will be triggered through automation rules
}

/**
 * GET endpoint for webhook verification (Resend may require this)
 */
export async function GET(request: NextRequest) {
  try {
    // Return webhook endpoint status
    return NextResponse.json({
      status: 'Webhook endpoint active',
      provider: 'resend',
      timestamp: new Date().toISOString(),
      methods: ['GET', 'POST'],
      note: 'Resend webhooks use Svix format with timestamp + payload signature verification',
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
