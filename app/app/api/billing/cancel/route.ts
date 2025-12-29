import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    const { subscription_id, reason } = await request.json();
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Get builder profile
    const { data: builder } = await supabase
      .from('builders')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!builder) {
      return NextResponse.json(
        { error: 'Builder profile not found' },
        { status: 404 }
      );
    }
    
    // Get subscription
    const { data: subscription } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('builder_id', builder.id)
      .single();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // Cancel in Razorpay
    if (subscription.razorpay_subscription_id) {
      try {
        await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id, {
          cancel_at_cycle_end: 1 // Cancel at end of current period
        });
      } catch (error: any) {
        console.error('Razorpay cancellation error:', error);
        // Continue with database update anyway
      }
    }
    
    // Update database
    await supabase
      .from('billing_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription_id);
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}



