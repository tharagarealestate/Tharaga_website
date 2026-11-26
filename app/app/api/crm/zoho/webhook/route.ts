// =============================================
// ZOHO CRM WEBHOOK HANDLER
// Processes real-time updates from Zoho
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.ZOHO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('ZOHO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured', success: false },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature (if Zoho provides one)
    const signature = request.headers.get('x-zoho-signature') || 
                     request.headers.get('X-Zoho-Signature');

    if (signature) {
      try {
        const expectedSignature = createHmac('sha256', webhookSecret)
          .update(body)
          .digest('hex');

        // Use timing-safe comparison if available, otherwise simple comparison
        // Note: For production, consider using crypto.timingSafeEqual
        if (signature !== expectedSignature) {
          console.error('Invalid webhook signature', {
            provided: signature.substring(0, 10) + '...',
            expected: expectedSignature.substring(0, 10) + '...',
          });
          return NextResponse.json(
            { error: 'Invalid signature', success: false },
            { status: 401 }
          );
        }
      } catch (sigError: any) {
        console.error('Error verifying signature:', sigError);
        return NextResponse.json(
          { error: 'Signature verification failed', success: false },
          { status: 401 }
        );
      }
    } else {
      // Log warning if signature is expected but not provided
      // In production, you might want to require signatures
      console.warn('Zoho webhook received without signature header');
    }

    // Parse webhook payload
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch (parseError: any) {
      console.error('Invalid JSON payload:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload', success: false },
        { status: 400 }
      );
    }

    console.log('Zoho webhook received:', {
      module: payload.module,
      operation: payload.operation,
      ids: payload.ids,
      timestamp: new Date().toISOString(),
    });

    // Handle webhook asynchronously (don't block response)
    handleWebhookAsync(payload).catch(err =>
      console.error('Webhook handling failed:', err)
    );

    // Respond immediately to Zoho
    return NextResponse.json({ 
      received: true,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error handling Zoho webhook:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process webhook',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle webhook in background
 */
async function handleWebhookAsync(payload: any): Promise<void> {
  try {
    await zohoClient.handleWebhook(payload);
  } catch (error: any) {
    console.error('Failed to process webhook:', error);
    // Log error to database for monitoring
    // You could add error logging here if needed
    throw error;
  }
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
        success: false,
      },
      { status: 500 }
    );
  }
}
