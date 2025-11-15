// =============================================
// RAZORPAY WEBHOOK ENDPOINT
// Handles all Razorpay webhook events
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { WebhookTriggerListener } from '@/lib/automation/triggers/webhookTriggers';
import { eventListener } from '@/lib/automation/triggers/eventListener';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

/**
 * Handle Razorpay webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const bodyText = await req.text();
    const headersList = headers();
    const signature = headersList.get('x-razorpay-signature');

    if (!signature) {
      console.error('❌ Missing Razorpay signature');
      return NextResponse.json(
        { error: 'Missing signature' },
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

    // Verify webhook signature (using raw body text)
    const isValid = verifyRazorpaySignature(bodyText, signature);
    if (!isValid) {
      console.error('❌ Razorpay signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`✅ Razorpay webhook verified: ${body.event}`);

    // Extract builder ID from payload (using our improved extraction)
    const builderId = await extractBuilderId(body);

    if (!builderId) {
      console.warn('⚠️ No builder ID found in Razorpay event');
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
      source: 'razorpay',
      event_type: body.event,
      event_id: body.payload?.payment?.entity?.id || body.payload?.order?.entity?.id || body.payload?.subscription?.entity?.id,
      headers: headersObj,
      body,
      signature,
      builder_id: builderId || undefined,
      metadata: {
        account_id: body.account_id,
        created_at: body.created_at,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Handle specific Razorpay events
    if (builderId) {
      await handleRazorpayEvent(body, builderId);
    }

    return NextResponse.json({
      received: true,
      event_type: body.event,
      log_id: result.log_id,
    });

  } catch (error: any) {
    console.error('❌ Razorpay webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Verify Razorpay webhook signature
 */
function verifyRazorpaySignature(bodyText: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Extract builder ID from Razorpay event
 * Uses multiple methods for robust extraction
 */
async function extractBuilderId(body: any): Promise<string | null> {
  try {
    // Method 1: Check subscription notes (where builder_id is typically stored)
    const subscription = body.payload?.subscription?.entity;
    if (subscription?.notes) {
      const notes = subscription.notes;
      if (typeof notes === 'object') {
        const builderId = notes.builder_id || notes.builderId || notes.user_id || notes.userId;
        if (builderId) return builderId;
      }
    }

    // Method 2: Check payment/order entity notes
    const payment = body.payload?.payment?.entity || body.payload?.order?.entity;
    if (payment?.notes) {
      const notes = payment.notes;
      if (typeof notes === 'object') {
        const builderId = notes.builder_id || notes.builderId || notes.user_id || notes.userId;
        if (builderId) return builderId;
      }
    }

    // Method 3: Look up by subscription_id in database (using admin client)
    const subscriptionId = subscription?.id || payment?.subscription_id;
    if (subscriptionId) {
      const adminClient = getAdminClient();
      const { data: subscriptionRecord } = await adminClient
        .from('user_subscriptions')
        .select('user_id')
        .eq('razorpay_subscription_id', subscriptionId)
        .single();

      if (subscriptionRecord?.user_id) {
        return subscriptionRecord.user_id;
      }
    }

    // Method 4: Look up by customer email (using admin client)
    const customer = body.payload?.customer?.entity || payment?.customer_id;
    if (customer?.email || (typeof customer === 'string' && customer)) {
      const adminClient = getAdminClient();
      // Use auth admin API to find user by email
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (!error && users) {
        const email = typeof customer === 'string' ? customer : customer.email;
        const user = users.find(u => 
          u.email === email && 
          u.user_metadata?.user_type === 'builder'
        );
        if (user?.id) {
          return user.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting builder ID:', error);
    return null;
  }
}

/**
 * Handle specific Razorpay events
 */
async function handleRazorpayEvent(body: any, builderId: string) {
  const eventType = body.event;
  
  try {
    switch (eventType) {
      case 'payment.authorized':
        await handlePaymentAuthorized(body.payload.payment.entity, builderId);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(body.payload.payment.entity, builderId);
        break;

      case 'payment.failed':
        await handlePaymentFailed(body.payload.payment.entity, builderId);
        break;

      case 'order.paid':
        await handleOrderPaid(body.payload.order.entity, builderId);
        break;

      case 'subscription.activated':
      case 'subscription.charged':
        await handleSubscriptionCharged(body.payload.subscription.entity, builderId);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCanceled(body.payload.subscription.entity, builderId);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(body.payload.subscription.entity, builderId);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(body.payload.subscription.entity, builderId);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(body.payload.invoice?.entity, builderId);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(body.payload.invoice?.entity, builderId);
        break;

      case 'refund.created':
        await handleRefundCreated(body.payload.refund.entity, builderId);
        break;

      default:
        console.log(`ℹ️ Unhandled Razorpay event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling Razorpay event ${eventType}:`, error);
  }
}

/**
 * Handle payment authorized
 */
async function handlePaymentAuthorized(payment: any, builderId: string) {
  console.log(`🔐 Payment authorized: ${payment.id} - ₹${payment.amount / 100}`);
  
  // TODO: Update payment status, send confirmation, etc.
  // This will be triggered through automation rules
}

/**
 * Handle payment captured
 */
async function handlePaymentCaptured(payment: any, builderId: string) {
  console.log(`💰 Payment captured: ${payment.id} - ₹${payment.amount / 100}`);
  
  // TODO: Update payment records, send receipt, etc.
  // This will be triggered through automation rules
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(payment: any, builderId: string) {
  console.log(`❌ Payment failed: ${payment.id}`);
  
  // Update subscription status if it's a subscription payment
  if (payment.subscription_id) {
    const adminClient = getAdminClient();
    await adminClient
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', payment.subscription_id);
  }
  
  // TODO: Notify team, retry payment, etc.
  // This will be triggered through automation rules
}

/**
 * Handle order paid
 */
async function handleOrderPaid(order: any, builderId: string) {
  console.log(`✅ Order paid: ${order.id} - ₹${order.amount / 100}`);
  
  // TODO: Fulfill order, send confirmation, etc.
  // This will be triggered through automation rules
}

/**
 * Handle subscription charged/activated
 */
async function handleSubscriptionCharged(subscription: any, builderId: string) {
  console.log(`📋 Subscription charged: ${subscription.id}`);
  
  // Update subscription status in database
  if (subscription?.id) {
    const adminClient = getAdminClient();
    await adminClient
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
        current_period_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : undefined,
        current_period_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : undefined,
      })
      .eq('razorpay_subscription_id', subscription.id);
  }
  
  // TODO: Send activation email, update user permissions, etc.
  // This will be triggered through automation rules
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCanceled(subscription: any, builderId: string) {
  console.log(`🚫 Subscription canceled: ${subscription.id}`);
  
  // Update subscription status in database
  if (subscription?.id) {
    const adminClient = getAdminClient();
    await adminClient
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  }
  
  // TODO: Downgrade plan, send cancellation email, etc.
  // This will be triggered through automation rules
}

/**
 * Handle subscription paused
 */
async function handleSubscriptionPaused(subscription: any, builderId: string) {
  console.log(`⏸️ Subscription paused: ${subscription.id}`);
  
  // Update subscription status in database
  if (subscription?.id) {
    const adminClient = getAdminClient();
    await adminClient
      .from('user_subscriptions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  }
}

/**
 * Handle subscription resumed
 */
async function handleSubscriptionResumed(subscription: any, builderId: string) {
  console.log(`▶️ Subscription resumed: ${subscription.id}`);
  
  // Update subscription status in database
  if (subscription?.id) {
    const adminClient = getAdminClient();
    await adminClient
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  }
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: any, builderId: string) {
  console.log(`✅ Invoice paid: ${invoice?.id}`);
  
  // TODO: Send receipt, update billing records, etc.
  // This will be triggered through automation rules
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: any, builderId: string) {
  console.log(`❌ Invoice payment failed: ${invoice?.id}`);
  
  // Update subscription status to past_due
  if (invoice?.subscription_id) {
    const adminClient = getAdminClient();
    await adminClient
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', invoice.subscription_id);
  }
  
  // TODO: Send payment failure notification
  // This will be triggered through automation rules
}

/**
 * Handle refund created
 */
async function handleRefundCreated(refund: any, builderId: string) {
  console.log(`💸 Refund created: ${refund.id} - ₹${refund.amount / 100}`);
  
  // TODO: Update payment records, notify customer, etc.
  // This will be triggered through automation rules
}

