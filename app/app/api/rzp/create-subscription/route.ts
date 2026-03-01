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
    const { plan = 'starter', annual = false, email, phone, customer = {}, notes = {} } = body;

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    // Get plan IDs from environment - New pricing structure (Starter, Professional, Enterprise)
    const plan_starter_monthly = process.env.RZP_PLAN_STARTER_MONTHLY;
    const plan_starter_annual = process.env.RZP_PLAN_STARTER_ANNUAL;
    const plan_professional_monthly = process.env.RZP_PLAN_PROFESSIONAL_MONTHLY;
    const plan_professional_annual = process.env.RZP_PLAN_PROFESSIONAL_ANNUAL;
    const plan_enterprise_monthly = process.env.RZP_PLAN_ENTERPRISE_MONTHLY;
    const plan_enterprise_annual = process.env.RZP_PLAN_ENTERPRISE_ANNUAL;

    // Validate at least monthly plans are configured
    if (!plan_starter_monthly || !plan_professional_monthly || !plan_enterprise_monthly) {
      return NextResponse.json(
        { error: 'Razorpay plan IDs not configured. Please set RZP_PLAN_STARTER_MONTHLY, RZP_PLAN_PROFESSIONAL_MONTHLY, and RZP_PLAN_ENTERPRISE_MONTHLY' },
        { status: 500 }
      );
    }

    // Determine plan ID based on tier and billing cycle
    const plan_id = (() => {
      if (plan === 'starter') {
        return annual ? (plan_starter_annual || plan_starter_monthly) : plan_starter_monthly;
      }
      if (plan === 'professional' || plan === 'pro') {
        return annual ? (plan_professional_annual || plan_professional_monthly) : plan_professional_monthly;
      }
      if (plan === 'enterprise') {
        return annual ? (plan_enterprise_annual || plan_enterprise_monthly) : plan_enterprise_monthly;
      }
      // Fallback to professional if plan not recognized
      console.warn(`Unknown plan "${plan}", defaulting to professional`);
      return annual ? (plan_professional_annual || plan_professional_monthly) : plan_professional_monthly;
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












