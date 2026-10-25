import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

export class SubscriptionManager {
  /**
   * Start 14-day free trial
   * No credit card required!
   */
  async startFreeTrial(builderId: string, builderEmail: string): Promise<{
    success: boolean;
    subscriptionId?: string;
    trialEndsAt?: string;
    message: string;
  }> {
    try {
      // Check if already has subscription
      const { data: existing } = await getSupabaseAdmin()
        .from('builder_subscriptions')
        .select('id, status')
        .eq('builder_id', builderId)
        .single();

      if (existing && existing.status !== 'cancelled') {
        return {
          success: false,
          message: 'Subscription already exists'
        };
      }

      // Start trial using database function
      const { data: subscriptionId, error } = await getSupabaseAdmin()
        .rpc('start_trial', { p_builder_id: builderId });

      if (error) throw error;

      // Get subscription details
      const { data: subscription } = await getSupabaseAdmin()
        .from('builder_subscriptions')
        .select('trial_ends_at')
        .eq('id', subscriptionId)
        .single();

      // Send welcome email (async, don't wait)
      this.sendTrialWelcomeEmail(builderEmail, subscription?.trial_ends_at).catch(console.error);

      return {
        success: true,
        subscriptionId: subscriptionId,
        trialEndsAt: subscription?.trial_ends_at,
        message: 'Trial started successfully! You have 14 days of free access.'
      };

    } catch (error: any) {
      console.error('Start trial error:', error);
      return {
        success: false,
        message: error.message || 'Failed to start trial'
      };
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(
    builderId: string,
    billingCycle: 'monthly' | 'yearly',
    paymentMethodId?: string
  ): Promise<{
    success: boolean;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    message: string;
  }> {
    try {
      if (!razorpay) {
        return {
          success: false,
          message: 'Razorpay not configured'
        };
      }

      // Get current subscription
      const { data: currentSub } = await getSupabaseAdmin()
        .from('builder_subscriptions')
        .select('*, builder:profiles(*)')
        .eq('builder_id', builderId)
        .in('status', ['trial', 'active'])
        .single();

      if (!currentSub) {
        return {
          success: false,
          message: 'No active trial found'
        };
      }

      // Get plan details
      const { data: plan } = await getSupabaseAdmin()
        .from('tharaga_plan')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!plan) {
        return {
          success: false,
          message: 'Plan not found'
        };
      }

      const price = billingCycle === 'monthly' 
        ? plan.monthly_price 
        : plan.yearly_price;

      // Create or get Razorpay customer
      let customerId = currentSub.razorpay_customer_id;
      
      if (!customerId) {
        const customer = await razorpay.customers.create({
          name: (currentSub.builder as any)?.full_name || (currentSub.builder as any)?.name || 'Builder',
          email: (currentSub.builder as any)?.email || '',
          contact: (currentSub.builder as any)?.phone || '',
          notes: {
            builder_id: builderId
          }
        });
        customerId = customer.id;
      }

      // Create Razorpay plan if doesn't exist
      const razorpayPlanId = await this.getOrCreateRazorpayPlan(
        billingCycle,
        price
      );

      // Create Razorpay subscription
      const razorpaySub = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_id: customerId,
        total_count: billingCycle === 'monthly' ? 12 : 1,
        quantity: 1,
        customer_notify: 1,
        notes: {
          builder_id: builderId,
          plan_slug: 'tharaga-pro',
          billing_cycle: billingCycle
        }
      });

      // Convert trial to paid in database
      const { error } = await getSupabaseAdmin().rpc('convert_trial_to_paid', {
        p_builder_id: builderId,
        p_billing_cycle: billingCycle,
        p_razorpay_subscription_id: razorpaySub.id
      });

      if (error) throw error;

      // Update Razorpay customer ID if new
      if (!currentSub.razorpay_customer_id) {
        await getSupabaseAdmin()
          .from('builder_subscriptions')
          .update({ razorpay_customer_id: customerId })
          .eq('builder_id', builderId);
      }

      // Send confirmation email (async)
      this.sendSubscriptionConfirmationEmail(
        (currentSub.builder as any)?.email || '',
        billingCycle,
        price
      ).catch(console.error);

      return {
        success: true,
        razorpaySubscriptionId: razorpaySub.id,
        razorpayOrderId: razorpaySub.id, // Razorpay subscription ID can be used
        message: 'Trial converted successfully! Your subscription is now active.'
      };

    } catch (error: any) {
      console.error('Convert trial error:', error);
      return {
        success: false,
        message: error.message || 'Failed to convert trial'
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    builderId: string,
    reason: string,
    immediate: boolean = false
  ): Promise<{
    success: boolean;
    message: string;
    effectiveDate?: string;
  }> {
    try {
      const { data: subscription } = await getSupabaseAdmin()
        .from('builder_subscriptions')
        .select('*')
        .eq('builder_id', builderId)
        .in('status', ['active', 'trial'])
        .single();

      if (!subscription) {
        return {
          success: false,
          message: 'No active subscription found'
        };
      }

      if (immediate) {
        // Cancel immediately
        if (subscription.razorpay_subscription_id && razorpay) {
          try {
            await razorpay.subscriptions.cancel(
              subscription.razorpay_subscription_id,
              { cancel_at_cycle_end: false }
            );
          } catch (error) {
            console.error('Razorpay cancel error:', error);
            // Continue with database update
          }
        }

        await getSupabaseAdmin()
          .from('builder_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason
          })
          .eq('builder_id', builderId);

        // Log event
        await getSupabaseAdmin().from('subscription_events').insert({
          builder_id: builderId,
          subscription_id: subscription.id,
          event_type: 'subscription_cancelled',
          triggered_by: 'user',
          event_data: { reason, immediate: true }
        });

        return {
          success: true,
          message: 'Subscription cancelled immediately',
          effectiveDate: new Date().toISOString()
        };

      } else {
        // Cancel at period end
        await getSupabaseAdmin()
          .from('builder_subscriptions')
          .update({
            cancel_at_period_end: true,
            cancellation_reason: reason
          })
          .eq('builder_id', builderId);

        // Cancel Razorpay subscription at period end
        if (subscription.razorpay_subscription_id && razorpay) {
          try {
            await razorpay.subscriptions.cancel(
              subscription.razorpay_subscription_id,
              { cancel_at_cycle_end: true }
            );
          } catch (error) {
            console.error('Razorpay cancel error:', error);
          }
        }

        return {
          success: true,
          message: `Subscription will cancel on ${new Date(subscription.current_period_end || new Date()).toLocaleDateString()}`,
          effectiveDate: subscription.current_period_end
        };
      }

    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(builderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await getSupabaseAdmin()
        .from('builder_subscriptions')
        .update({
          cancel_at_period_end: false,
          cancellation_reason: null
        })
        .eq('builder_id', builderId);

      // Log event
      const { data: sub } = await getSupabaseAdmin()
        .from('builder_subscriptions')
        .select('id')
        .eq('builder_id', builderId)
        .single();

      if (sub) {
        await getSupabaseAdmin().from('subscription_events').insert({
          builder_id: builderId,
          subscription_id: sub.id,
          event_type: 'subscription_resumed',
          triggered_by: 'user'
        });
      }

      return {
        success: true,
        message: 'Subscription reactivated successfully'
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reactivate subscription'
      };
    }
  }

  /**
   * Change billing cycle (monthly ↔ yearly)
   */
  async changeBillingCycle(
    builderId: string,
    newCycle: 'monthly' | 'yearly'
  ): Promise<{
    success: boolean;
    message: string;
    priceDifference?: number;
  }> {
    try {
      if (!razorpay) {
        return {
          success: false,
          message: 'Razorpay not configured'
        };
      }

      const { data: currentSub } = await getSupabaseAdmin()
        .from('builder_subscriptions')
        .select('*')
        .eq('builder_id', builderId)
        .eq('status', 'active')
        .single();

      if (!currentSub) {
        return {
          success: false,
          message: 'No active subscription found'
        };
      }

      if (currentSub.billing_cycle === newCycle) {
        return {
          success: false,
          message: `Already on ${newCycle} billing`
        };
      }

      // Get new price
      const { data: plan } = await getSupabaseAdmin()
        .from('tharaga_plan')
        .select('monthly_price, yearly_price')
        .eq('is_active', true)
        .single();

      if (!plan) {
        return {
          success: false,
          message: 'Plan not found'
        };
      }

      const newPrice = newCycle === 'monthly' 
        ? plan.monthly_price 
        : plan.yearly_price;

      const priceDiff = newPrice - currentSub.current_price;

      // Cancel current Razorpay subscription
      if (currentSub.razorpay_subscription_id) {
        try {
          await razorpay.subscriptions.cancel(
            currentSub.razorpay_subscription_id,
            { cancel_at_cycle_end: true }
          );
        } catch (error) {
          console.error('Razorpay cancel error:', error);
        }
      }

      // Create new Razorpay subscription
      const razorpayPlanId = await this.getOrCreateRazorpayPlan(
        newCycle,
        newPrice
      );

      const periodEnd = new Date(currentSub.current_period_end || new Date());
      const newRazorpaySub = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_id: currentSub.razorpay_customer_id,
        total_count: newCycle === 'monthly' ? 12 : 1,
        quantity: 1,
        start_at: Math.floor(periodEnd.getTime() / 1000)
      });

      // Update database
      await getSupabaseAdmin()
        .from('builder_subscriptions')
        .update({
          billing_cycle: newCycle,
          current_price: newPrice,
          razorpay_subscription_id: newRazorpaySub.id
        })
        .eq('builder_id', builderId);

      // Log event
      await getSupabaseAdmin().from('subscription_events').insert({
        builder_id: builderId,
        subscription_id: currentSub.id,
        event_type: 'billing_cycle_changed',
        triggered_by: 'user',
        event_data: {
          old_cycle: currentSub.billing_cycle,
          new_cycle: newCycle,
          old_price: currentSub.current_price,
          new_price: newPrice
        }
      });

      return {
        success: true,
        message: `Billing cycle changed to ${newCycle}. Change takes effect on ${periodEnd.toLocaleDateString()}`,
        priceDifference: priceDiff
      };

    } catch (error: any) {
      console.error('Change billing cycle error:', error);
      return {
        success: false,
        message: error.message || 'Failed to change billing cycle'
      };
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(builderId: string): Promise<{
    hasSubscription: boolean;
    status?: string;
    isTrial?: boolean;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
    billingCycle?: string;
    price?: number;
    cancelAtPeriodEnd?: boolean;
  }> {
    const { data: subscription } = await getSupabaseAdmin()
      .from('builder_subscriptions')
      .select('*')
      .eq('builder_id', builderId)
      .single();

    if (!subscription) {
      return { hasSubscription: false };
    }

    return {
      hasSubscription: true,
      status: subscription.status,
      isTrial: subscription.is_trial,
      trialEndsAt: subscription.trial_ends_at,
      currentPeriodEnd: subscription.current_period_end,
      billingCycle: subscription.billing_cycle,
      price: subscription.current_price,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };
  }

  /**
   * Helper: Get or create Razorpay plan
   */
  private async getOrCreateRazorpayPlan(
    interval: 'monthly' | 'yearly',
    priceInPaise: number
  ): Promise<string> {
    if (!razorpay) {
      throw new Error('Razorpay not configured');
    }

    const period = interval === 'monthly' ? 'monthly' : 'yearly';
    
    try {
      // Try to find existing plan
      const plans = await razorpay.plans.all({ count: 100 });
      const existingPlan = plans.items.find(
        (p: any) => 
          p.item.name === `Tharaga Pro - ${interval}` &&
          p.item.amount === priceInPaise &&
          p.period === period
      );

      if (existingPlan) {
        return existingPlan.id;
      }

      // Create new plan
      const plan = await razorpay.plans.create({
        period,
        interval: 1,
        item: {
          name: `Tharaga Pro - ${interval}`,
          amount: priceInPaise,
          currency: 'INR',
          description: 'Unlimited properties, AI leads, full automation'
        },
        notes: {
          plan_type: 'tharaga-pro',
          billing_cycle: interval
        }
      });

      return plan.id;

    } catch (error) {
      console.error('Razorpay plan creation error:', error);
      throw error;
    }
  }

  /**
   * Helper: Send trial welcome email
   */
  private async sendTrialWelcomeEmail(
    email: string,
    trialEndsAt: string | null | undefined
  ): Promise<void> {
    // TODO: Implement email sending using your email service
    // Use Resend/SendGrid/etc
    console.log(`Welcome email sent to ${email}, trial ends: ${trialEndsAt}`);
  }

  /**
   * Helper: Send subscription confirmation email
   */
  private async sendSubscriptionConfirmationEmail(
    email: string,
    billingCycle: string,
    price: number
  ): Promise<void> {
    // TODO: Implement email sending
    console.log(`Confirmation email sent to ${email}, ${billingCycle} at ₹${price/100}`);
  }
}




