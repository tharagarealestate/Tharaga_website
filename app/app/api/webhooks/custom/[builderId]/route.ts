// =============================================
// CUSTOM WEBHOOK ENDPOINT (PER BUILDER)
// Handles custom webhook events for specific builders
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
 * Handle custom webhook events
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { builderId: string; slug?: string } }
) {
  try {
    const builderId = params.builderId;
    const slug = params.slug;
    
    // Get raw body for signature verification
    const bodyText = await req.text();
    const headersList = headers();
    
    // Construct URL - support both with and without slug
    const url = slug 
      ? `/api/webhooks/custom/${builderId}/${slug}`
      : `/api/webhooks/custom/${builderId}`;

    console.log(`📥 Custom webhook received for builder: ${builderId}${slug ? ` (slug: ${slug})` : ''}`);

    // Look up webhook endpoint configuration
    const adminClient = getAdminClient();
    const { data: endpoint, error } = await adminClient
      .from('webhook_endpoints')
      .select('*')
      .eq('builder_id', builderId)
      .eq('url', url)
      .eq('is_active', true)
      .eq('is_paused', false)
      .single();

    if (error || !endpoint) {
      console.error('❌ Custom webhook endpoint not found or inactive');
      return NextResponse.json(
        { error: 'Webhook endpoint not found or inactive' },
        { status: 404 }
      );
    }

    // Check IP whitelist if configured
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     headersList.get('x-real-ip') || 
                     req.ip ||
                     'unknown';

    if (endpoint.allowed_ips && Array.isArray(endpoint.allowed_ips) && endpoint.allowed_ips.length > 0) {
      if (!endpoint.allowed_ips.includes(clientIp)) {
        console.error(`❌ IP ${clientIp} not whitelisted`);
        return NextResponse.json(
          { error: 'IP not whitelisted' },
          { status: 403 }
        );
      }
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

    // Verify signature if required
    const signatureHeader = endpoint.signature_header || 'x-webhook-signature';
    const signature = headersList.get(signatureHeader) || 
                      headersList.get(signatureHeader.toLowerCase()) ||
                      headersList.get(signatureHeader.toUpperCase());

    if (endpoint.require_signature) {
      if (!signature) {
        console.error('❌ Missing webhook signature');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 400 }
        );
      }

      const isValid = verifyCustomSignature(
        bodyText,
        signature,
        endpoint.webhook_secret,
        endpoint.signature_algorithm || 'sha256'
      );

      if (!isValid) {
        console.error('❌ Custom webhook signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    console.log(`✅ Custom webhook verified: ${endpoint.name}`);

    // Determine event type from body or use default
    const eventType = body.event_type || body.event || body.type || 'custom.event';

    // Check if event is allowed
    if (endpoint.allowed_events && Array.isArray(endpoint.allowed_events) && endpoint.allowed_events.length > 0) {
      if (!endpoint.allowed_events.includes(eventType)) {
        console.warn(`⚠️ Event type ${eventType} not allowed for this endpoint`);
        return NextResponse.json(
          { error: 'Event type not allowed' },
          { status: 400 }
        );
      }
    }

    // Map event type if configured
    const eventMapping = endpoint.event_mapping as Record<string, string> | null;
    const mappedEventType = eventMapping?.[eventType] || eventType;

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
      source: 'custom',
      event_type: mappedEventType,
      event_id: body.id || body.event_id || body.email_id,
      headers: headersObj,
      body,
      signature: signature || undefined,
      builder_id: builderId,
      metadata: {
        endpoint_name: endpoint.name,
        endpoint_id: endpoint.id,
        original_event_type: eventType,
        mapped_event_type: mappedEventType,
        client_ip: clientIp,
        url: url,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Update endpoint statistics (async, don't wait)
    updateEndpointStats(endpoint.id, true).catch(err => {
      console.error('Error updating endpoint stats:', err);
    });

    return NextResponse.json({
      received: true,
      event_type: mappedEventType,
      log_id: result.log_id,
      endpoint: endpoint.name,
    });

  } catch (error: any) {
    console.error('❌ Custom webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook endpoint info
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { builderId: string; slug?: string } }
) {
  try {
    const builderId = params.builderId;
    const slug = params.slug;
    const url = slug 
      ? `/api/webhooks/custom/${builderId}/${slug}`
      : `/api/webhooks/custom/${builderId}`;

    const adminClient = getAdminClient();
    const { data: endpoint, error } = await adminClient
      .from('webhook_endpoints')
      .select('name, description, allowed_events, is_active, is_paused, require_signature, signature_algorithm')
      .eq('builder_id', builderId)
      .eq('url', url)
      .single();

    if (error || !endpoint) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';

    return NextResponse.json({
      name: endpoint.name,
      description: endpoint.description,
      allowed_events: endpoint.allowed_events,
      is_active: endpoint.is_active,
      is_paused: endpoint.is_paused,
      require_signature: endpoint.require_signature,
      signature_algorithm: endpoint.signature_algorithm,
      url: `${baseUrl}${url}`,
    });

  } catch (error: any) {
    console.error('Error in webhook GET handler:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify custom webhook signature
 */
function verifyCustomSignature(
  body: string,
  signature: string,
  secret: string,
  algorithm: string
): boolean {
  if (!secret) {
    console.warn('Webhook secret not configured');
    return false;
  }

  try {
    let expectedSignature: string;

    switch (algorithm) {
      case 'sha256':
        expectedSignature = crypto
          .createHash('sha256')
          .update(body + secret)
          .digest('hex');
        break;

      case 'sha512':
        expectedSignature = crypto
          .createHash('sha512')
          .update(body + secret)
          .digest('hex');
        break;

      case 'hmac-sha256':
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');
        break;

      default:
        console.warn('Unknown signature algorithm:', algorithm);
        return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying custom webhook signature:', error);
    return false;
  }
}

/**
 * Update webhook endpoint statistics
 */
async function updateEndpointStats(endpointId: string, success: boolean) {
  try {
    const adminClient = getAdminClient();
    
    // Fetch current values and increment
    const { data: current } = await adminClient
      .from('webhook_endpoints')
      .select('total_requests, successful_requests, failed_requests')
      .eq('id', endpointId)
      .single();

    if (current) {
      await adminClient
        .from('webhook_endpoints')
        .update({
          total_requests: (current.total_requests || 0) + 1,
          ...(success 
            ? { successful_requests: (current.successful_requests || 0) + 1 }
            : { failed_requests: (current.failed_requests || 0) + 1 }
          ),
          last_request_at: new Date().toISOString(),
        })
        .eq('id', endpointId);
    }
  } catch (error) {
    console.error('Error updating endpoint stats:', error);
    // Don't throw - stats update failure shouldn't break webhook processing
  }
}

