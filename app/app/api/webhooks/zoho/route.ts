// =============================================
// ZOHO CRM WEBHOOK ENDPOINT
// Handles all Zoho CRM webhook events
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { WebhookTriggerListener } from '@/lib/automation/triggers/webhookTriggers';
import { eventListener } from '@/lib/automation/triggers/eventListener';

const webhookToken = process.env.ZOHO_WEBHOOK_TOKEN;
const webhookSecret = process.env.ZOHO_WEBHOOK_SECRET;

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

/**
 * Handle Zoho CRM webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const bodyText = await req.text();
    const headersList = headers();
    const token = headersList.get('x-zoho-webhook-token') || headersList.get('X-Zoho-Webhook-Token');
    const signature = headersList.get('x-zoho-signature') || headersList.get('X-Zoho-Signature');

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

    // Verify webhook token (primary method)
    if (token && webhookToken) {
      if (token !== webhookToken) {
        console.error('❌ Invalid Zoho webhook token');
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    } else if (signature && webhookSecret) {
      // Fallback to signature verification if token not provided
      const isValid = verifyZohoSignature(bodyText, signature);
      if (!isValid) {
        console.error('❌ Zoho webhook signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('⚠️ No Zoho webhook token or secret configured');
      // In production, you might want to require verification
    }

    console.log(`✅ Zoho webhook verified: ${body.module} - ${body.operation}`);

    // Find builder by Zoho account ID
    const builderId = await findBuilderByZohoAccount(body.account_id || body.accountId);

    if (!builderId) {
      console.warn('⚠️ No builder found for Zoho account:', body.account_id || body.accountId);
      return NextResponse.json(
        { error: 'Builder not found' },
        { status: 404 }
      );
    }

    // Determine event type
    const eventType = `${body.module?.toLowerCase() || 'unknown'}.${body.operation?.toLowerCase() || 'unknown'}`;

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
      source: 'zoho',
      event_type: eventType,
      event_id: body.data?.[0]?.id || body.ids?.[0],
      headers: headersObj,
      body,
      signature: signature || token || undefined,
      builder_id: builderId,
      metadata: {
        module: body.module,
        operation: body.operation,
        account_id: body.account_id || body.accountId,
        timestamp: body.timestamp || new Date().toISOString(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Handle specific Zoho events (optional business logic)
    await handleZohoEvent(body, builderId);

    return NextResponse.json({
      received: true,
      event_type: eventType,
      log_id: result.log_id,
    });

  } catch (error: any) {
    console.error('❌ Zoho webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Zoho webhook signature (HMAC SHA256)
 */
function verifyZohoSignature(body: string, signature: string): boolean {
  if (!webhookSecret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying Zoho signature:', error);
    return false;
  }
}

/**
 * Find builder by Zoho account ID
 */
async function findBuilderByZohoAccount(accountId: string): Promise<string | null> {
  if (!accountId) {
    return null;
  }

  try {
    const adminClient = getAdminClient();
    
    const { data, error } = await adminClient
      .from('integrations')
      .select('builder_id')
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .eq('crm_account_id', accountId)
      .eq('is_connected', true)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn('No active Zoho integration found for account:', accountId);
      return null;
    }

    return data.builder_id;
  } catch (error) {
    console.error('Error finding builder by Zoho account:', error);
    return null;
  }
}

/**
 * Handle specific Zoho events (optional business logic)
 */
async function handleZohoEvent(body: any, builderId: string) {
  const module = body.module;
  const operation = body.operation;

  try {
    switch (`${module}.${operation}`) {
      case 'Leads.create':
        await handleLeadCreated(body.data?.[0], builderId);
        break;

      case 'Leads.update':
        await handleLeadUpdated(body.data?.[0], builderId);
        break;

      case 'Leads.delete':
        await handleLeadDeleted(body.data?.[0], builderId);
        break;

      case 'Contacts.create':
        await handleContactCreated(body.data?.[0], builderId);
        break;

      case 'Contacts.update':
        await handleContactUpdated(body.data?.[0], builderId);
        break;

      case 'Deals.create':
        await handleDealCreated(body.data?.[0], builderId);
        break;

      case 'Deals.update':
        await handleDealUpdated(body.data?.[0], builderId);
        break;

      default:
        console.log(`ℹ️ Unhandled Zoho event: ${module}.${operation}`);
    }
  } catch (error) {
    console.error(`Error handling Zoho event ${module}.${operation}:`, error);
  }
}

/**
 * Handle Zoho lead created
 */
async function handleLeadCreated(lead: any, builderId: string) {
  console.log(`👤 Zoho lead created: ${lead.Full_Name || lead.Email} (${lead.id})`);
  
  // TODO: Sync lead to Tharaga if needed
  // This will be triggered through automation rules
}

/**
 * Handle Zoho lead updated
 */
async function handleLeadUpdated(lead: any, builderId: string) {
  console.log(`✏️ Zoho lead updated: ${lead.Full_Name || lead.Email} (${lead.id})`);
  
  // TODO: Update lead in Tharaga if needed
  // This will be triggered through automation rules
}

/**
 * Handle Zoho lead deleted
 */
async function handleLeadDeleted(lead: any, builderId: string) {
  console.log(`🗑️ Zoho lead deleted: ${lead.id}`);
  
  // TODO: Handle lead deletion in Tharaga if needed
  // This will be triggered through automation rules
}

/**
 * Handle Zoho contact created
 */
async function handleContactCreated(contact: any, builderId: string) {
  console.log(`📇 Zoho contact created: ${contact.Full_Name || contact.Email} (${contact.id})`);
  
  // TODO: Sync contact to Tharaga if needed
  // This will be triggered through automation rules
}

/**
 * Handle Zoho contact updated
 */
async function handleContactUpdated(contact: any, builderId: string) {
  console.log(`✏️ Zoho contact updated: ${contact.Full_Name || contact.Email} (${contact.id})`);
  
  // TODO: Update contact in Tharaga if needed
  // This will be triggered through automation rules
}

/**
 * Handle Zoho deal created
 */
async function handleDealCreated(deal: any, builderId: string) {
  console.log(`💼 Zoho deal created: ${deal.Deal_Name || deal.id} (${deal.id})`);
  
  // TODO: Sync deal to Tharaga if needed
  // This will be triggered through automation rules
}

/**
 * Handle Zoho deal updated
 */
async function handleDealUpdated(deal: any, builderId: string) {
  console.log(`✏️ Zoho deal updated: ${deal.Deal_Name || deal.id} (${deal.id})`);
  
  // TODO: Update deal in Tharaga if needed
  // This will be triggered through automation rules
}

/**
 * GET endpoint for webhook verification (Zoho may require this)
 */
export async function GET(request: NextRequest) {
  try {
    // Zoho webhook verification challenge
    const challenge = request.nextUrl.searchParams.get('challenge');
    
    if (challenge) {
      // Zoho sends a challenge parameter for webhook verification
      // Return it as plain text
      return new NextResponse(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Return webhook endpoint status
    return NextResponse.json({
      status: 'Webhook endpoint active',
      provider: 'zoho',
      timestamp: new Date().toISOString(),
      methods: ['GET', 'POST'],
      verification: 'Send ?challenge=<value> for verification',
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

