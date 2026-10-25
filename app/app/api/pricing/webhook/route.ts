import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const signature = request.headers.get('x-razorpay-signature');
    const body = await request.text();

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    // Handle subscription events
    if (event && event.startsWith('subscription.')) {
      const subscription = payload.payload?.subscription?.entity;
      if (!subscription) {
        return NextResponse.json({ success: true });
      }

      const subscriptionId = subscription.id;
      const status = subscription.status;
      const customerId = subscription.customer_id;

      // Update subscription status in database
      const { error: updateError } = await getSupabase()
        .from('builder_subscriptions')
        .update({
          status: status === 'active' ? 'active' : 
                  status === 'paused' ? 'paused' :
                  status === 'cancelled' ? 'cancelled' : 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Subscription update error:', updateError);
      }

      // Handle payment success
      if (event === 'subscription.charged') {
        const payment = payload.payload?.payment?.entity;
        if (payment) {
          // Log payment in payment_history table if it exists
          // You can extend this to track payments
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


