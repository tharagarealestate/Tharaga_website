import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

let _supabase: ReturnType<typeof createClient> | null = null;
function supabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case 'subscription.charged':
        await handlePaymentSuccess(event.payload.payment.entity);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const builderId = subscription.notes?.builder_id;
  if (!builderId) {
    console.error('No builder_id in subscription notes');
    return;
  }

  await supabase()
    .from('builder_subscriptions')
    .update({ status: 'active' })
    .eq('razorpay_subscription_id', subscription.id);

  const { data: sub } = await supabase()
    .from('builder_subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (sub) {
    await supabase().from('subscription_events').insert({
      builder_id: builderId,
      subscription_id: sub.id,
      event_type: 'subscription_activated',
      triggered_by: 'webhook',
      event_data: subscription
    });
  }
}

async function handlePaymentSuccess(payment: any) {
  const builderId = payment.notes?.builder_id;
  if (!builderId) return;
  
  // Get subscription ID
  const { data: subscription } = await supabase()
    .from('builder_subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', payment.subscription_id)
    .single();

  await supabase().from('payment_history').insert({
    builder_id: builderId,
    subscription_id: subscription?.id,
    razorpay_payment_id: payment.id,
    razorpay_order_id: payment.order_id,
    amount: payment.amount,
    status: 'captured',
    payment_method: payment.method,
    razorpay_response: payment,
    paid_at: new Date(payment.created_at * 1000).toISOString()
  });
  
  // Update subscription period
  if (subscription) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Assuming monthly, adjust if needed

    await supabase
      .from('builder_subscriptions')
      .update({
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString()
      })
      .eq('id', subscription.id);
  }
  
  // Log event
  if (subscription) {
    await supabase().from('subscription_events').insert({
      builder_id: builderId,
      subscription_id: subscription.id,
      event_type: 'payment_succeeded',
      triggered_by: 'webhook',
      event_data: payment
    });
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  await supabase()
    .from('builder_subscriptions')
      .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
      })
      .eq('razorpay_subscription_id', subscription.id);

  const { data: sub } = await supabase()
    .from('builder_subscriptions')
    .select('id, builder_id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (sub) {
    await supabase().from('subscription_events').insert({
      builder_id: sub.builder_id,
      subscription_id: sub.id,
      event_type: 'subscription_cancelled',
      triggered_by: 'webhook',
      event_data: subscription
    });
  }
}

async function handleSubscriptionPaused(subscription: any) {
  await supabase()
    .from('builder_subscriptions')
    .update({ status: 'paused' })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionResumed(subscription: any) {
  await supabase()
    .from('builder_subscriptions')
    .update({ status: 'active' })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handlePaymentFailed(payment: any) {
  const builderId = payment.notes?.builder_id;
  if (!builderId) return;
  
  // Get subscription
  const { data: subscription } = await supabase()
    .from('builder_subscriptions')
    .select('id')
    .eq('razorpay_customer_id', payment.customer_id)
    .single();

  if (subscription) {
    await supabase
      .from('builder_subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subscription.id);
  }

  await supabase().from('payment_history').insert({
    builder_id: builderId,
    subscription_id: subscription?.id,
    razorpay_payment_id: payment.id,
    amount: payment.amount,
    status: 'failed',
    razorpay_response: payment
  });

  // Log event
  if (subscription) {
    await supabase().from('subscription_events').insert({
      builder_id: builderId,
      subscription_id: subscription.id,
      event_type: 'payment_failed',
      triggered_by: 'webhook',
      event_data: payment
    });
  }
}
