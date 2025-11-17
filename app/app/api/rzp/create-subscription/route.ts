// =============================================
// RAZORPAY SUBSCRIPTION CREATION
// Creates Razorpay subscription with builder_id in notes
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }
  return razorpayInstance;
}

export const runtime = 'nodejs';

/**
 * Create Razorpay subscription
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a builder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'builder') {
      return NextResponse.json(
        { error: 'Only builders can create subscriptions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { plan = 'growth', annual = false, email, phone, customer = {}, notes = {} } = body;

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    // Get plan IDs from environment
    const plan_growth_monthly = process.env.RZP_PLAN_GROWTH;
    const plan_scale_monthly = process.env.RZP_PLAN_SCALE;
    const plan_growth_annual = process.env.RZP_PLAN_GROWTH_ANNUAL;
    const plan_scale_annual = process.env.RZP_PLAN_SCALE_ANNUAL;

    if (!plan_growth_monthly || !plan_scale_monthly) {
      return NextResponse.json(
        { error: 'Razorpay plan IDs not configured' },
        { status: 500 }
      );
    }

    // Determine plan ID
    const plan_id = (() => {
      if (plan === 'scale') {
        return annual ? (plan_scale_annual || plan_scale_monthly) : plan_scale_monthly;
      }
      return annual ? (plan_growth_annual || plan_growth_monthly) : plan_growth_monthly;
    })();

    // Create or get customer
    let customer_id = customer.id || null;
    if (!customer_id) {
      const cust = await getRazorpayClient().customers.create({
        name: customer.name || user.user_metadata?.name || '',
        email: email || user.email || customer.email || '',
        contact: phone || user.user_metadata?.phone || customer.contact || '',
        notes: {
          ...notes,
          builder_id: user.id, // Store builder_id in customer notes too
        },
      });
      customer_id = cust.id;
    }

    // Create subscription with builder_id in notes
    const subscription = await getRazorpayClient().subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: annual ? 12 : 1, // For monthly plans, total_count=1 (auto-renew); for annual, set appropriate count
      customer_id,
      notes: {
        ...notes,
        builder_id: user.id, // ✅ CRITICAL: Store builder_id for webhook extraction
        user_id: user.id,
        email: email || user.email,
        plan,
        annual: String(annual),
        source: notes.source || 'pricing_page',
      },
    });

    // Store subscription in database
    try {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + (annual ? 12 : 1));

      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          razorpay_subscription_id: subscription.id,
          razorpay_customer_id: customer_id,
          status: subscription.status === 'created' ? 'active' : subscription.status,
          billing_cycle: annual ? 'yearly' : 'monthly',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          metadata: {
            plan,
            annual,
            razorpay_plan_id: plan_id,
            ...notes,
          },
        }, {
          onConflict: 'razorpay_subscription_id',
        });
    } catch (dbError) {
      console.error('Error storing subscription in database:', dbError);
      // Continue even if DB update fails - subscription is created in Razorpay
    }

    return NextResponse.json({
      id: subscription.id,
      short_url: subscription.short_url,
      status: subscription.status,
      customer_id,
    });

  } catch (error: any) {
    console.error('❌ Razorpay subscription creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}










