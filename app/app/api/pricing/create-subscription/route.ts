import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';
import { secureApiRoute } from '@/lib/security/api-security';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';
import { z } from 'zod';

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

const createSubscriptionSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  billingCycle: z.enum(['monthly', 'yearly'])
});

export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    // User is already authenticated via secureApiRoute
    const body = await request.json();
    const { planId, billingCycle } = createSubscriptionSchema.parse(body);

    if (!razorpay) {
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from('property_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get or create Razorpay customer
    let customerId = null;
    try {
      const existingCustomers = await razorpay.customers.all({
        count: 100
      });
      
      const existingCustomer = existingCustomers.items.find(
        (c: any) => c.email === user.email
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const customer = await razorpay.customers.create({
          name: profile?.full_name || profile?.name || user.email?.split('@')[0] || 'Builder',
          email: user.email || '',
          contact: profile?.phone || '',
          notes: {
            user_id: user.id,
            builder_id: user.id
          }
        });
        customerId = customer.id;
      }
    } catch (error: any) {
      console.error('Customer creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create customer: ' + error.message },
        { status: 500 }
      );
    }

    // Create Razorpay plan if it doesn't exist
    const planSlug = plan.plan_slug;
    const priceInPaise = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
    const period = billingCycle === 'monthly' ? 'monthly' : 'yearly';
    const interval = billingCycle === 'monthly' ? 1 : 1;

    let razorpayPlanId: string;
    
    try {
      // Try to find existing plan
      const plans = await razorpay.plans.all({ count: 100 });
      const existingPlan = plans.items.find(
        (p: any) => 
          p.item.name === `Tharaga ${planSlug} - ${billingCycle}` &&
          p.item.amount === priceInPaise &&
          p.period === period
      );

      if (existingPlan) {
        razorpayPlanId = existingPlan.id;
      } else {
        // Create new plan
        const newPlan = await razorpay.plans.create({
          period,
          interval,
          item: {
            name: `Tharaga ${planSlug} - ${billingCycle}`,
            amount: priceInPaise,
            currency: 'INR'
          }
        });
        razorpayPlanId = newPlan.id;
      }
    } catch (error: any) {
      console.error('Plan creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create plan: ' + error.message },
        { status: 500 }
      );
    }

    // Create subscription
    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_notify: 1,
        total_count: billingCycle === 'yearly' ? 1 : 12, // For yearly, 1 payment; for monthly, 12 payments
        customer_id: customerId,
        notes: {
          builder_id: user.id,
          plan_slug: planSlug,
          plan_id: planId,
          billing_cycle: billingCycle
        }
      });

      // Create subscription record in database
      const periodStart = new Date();
      const periodEnd = new Date();
      if (billingCycle === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const { error: subError } = await supabase
        .from('builder_subscriptions')
        .upsert({
          builder_id: user.id,
          plan_id: planId,
          billing_cycle: billingCycle,
          properties_limit: plan.max_properties,
          current_price: priceInPaise,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          razorpay_subscription_id: subscription.id,
          razorpay_customer_id: customerId,
          properties_used: 0
        }, {
          onConflict: 'builder_id'
        });

      if (subError) {
        console.error('Subscription creation error:', subError);
        // Continue anyway, subscription is created in Razorpay
      }

      // Send welcome email
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email || '',
            subject: `Welcome to Tharaga ${plan.plan_name}!`,
            template: 'subscription-created',
            data: {
              planName: plan.plan_name,
              billingCycle: billingCycle,
              amount: priceInPaise
            }
          })
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail subscription creation if email fails
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        customerId
      });

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription: ' + error.message },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    rateLimit: 'strict',
    validateSchema: createSubscriptionSchema,
    auditAction: AuditActions.CREATE_PAYMENT,
    auditResourceType: AuditResourceTypes.PAYMENT
  }
)

