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

    const { plan_type, billing_cycle } = await request.json();
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Get builder profile
    const { data: builder, error: builderError } = await supabase
      .from('builders')
      .select('id, name, email, phone, company_name, gstin')
      .eq('user_id', user.id)
      .single();
    
    if (builderError || !builder) {
      return NextResponse.json(
        { error: 'Builder profile not found' },
        { status: 404 }
      );
    }
    
    // Get plan details
    const plansResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/plans`);
    const plansData = await plansResponse.json();
    const plan = plansData.plans?.find((p: any) => p.id === plan_type);
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    const planDetails = plan.pricing[billingCycle];
    const amount = planDetails.amount; // in paise
    
    // Create or get Razorpay customer
    let customerId = null;
    try {
      // Check if customer exists
      const { data: existingSub } = await supabase
        .from('billing_subscriptions')
        .select('razorpay_customer_id')
        .eq('builder_id', builder.id)
        .single();
      
      if (existingSub?.razorpay_customer_id) {
        customerId = existingSub.razorpay_customer_id;
      } else {
        // Create new customer
        const customer = await razorpay.customers.create({
          name: builder.company_name || builder.name,
          email: builder.email,
          contact: builder.phone || '',
          notes: {
            builder_id: builder.id
          }
        });
        customerId = customer.id;
      }
    } catch (error: any) {
      console.error('Customer creation error:', error);
      // Continue without customer ID for now
    }
    
    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planDetails.razorpay_plan_id || `plan_${plan_type}_${billingCycle}`, // You'll need to create these in Razorpay
      customer_id: customerId,
      total_count: billing_cycle === 'yearly' ? 1 : billing_cycle === 'quarterly' ? 1 : 1,
      quantity: 1,
      start_at: Math.floor(Date.now() / 1000) + 86400, // Start tomorrow
      customer_notify: 1,
      notes: {
        builder_id: builder.id,
        plan_type: plan_type,
        billing_cycle: billing_cycle
      }
    });
    
    // Store subscription in database
    const { data: dbSubscription, error: dbError } = await supabase
      .from('billing_subscriptions')
      .upsert({
        builder_id: builder.id,
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: planDetails.razorpay_plan_id || `plan_${plan_type}_${billingCycle}`,
        razorpay_customer_id: customerId,
        plan_type: plan_type,
        billing_cycle: billing_cycle,
        amount: amount,
        currency: 'INR',
        tax_percentage: 18.00,
        status: 'created',
        properties_limit: plan.features.properties_limit,
        leads_limit: plan.features.leads_limit,
        email_quota: plan.features.email_quota,
        storage_gb: plan.features.storage_gb,
        team_members_limit: plan.features.team_members_limit,
        next_billing_at: new Date(subscription.start_at * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'builder_id'
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway, subscription is created in Razorpay
    }
    
    return NextResponse.json({
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      status: subscription.status
    });
    
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}



