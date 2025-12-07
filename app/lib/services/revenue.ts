import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number | null;
  features: Array<{ name: string; included: boolean; limit?: number }>;
  maxProperties?: number | null;
  maxLeadsPerMonth?: number | null;
  maxTeamMembers?: number | null;
  aiFeaturesEnabled: boolean;
  analyticsEnabled: boolean;
  apiAccessEnabled: boolean;
  prioritySupport: boolean;
  isPopular: boolean;
}

interface Subscription {
  id: string;
  builderId: string;
  planId: string | null;
  plan: SubscriptionPlan | null;
  status: string;
  billingCycle: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEndAt?: string | null;
  cancelAtPeriodEnd: boolean;
  propertiesUsed: number;
  leadsUsedThisMonth: number;
}

export class RevenueService {
  private supabase: ReturnType<typeof createClient> | null = null;
  private razorpay: Razorpay | null = null;

  private getSupabase(): ReturnType<typeof createClient> {
    if (!this.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and service role key are required');
      }
      
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this.supabase;
  }

  private getRazorpay(): Razorpay {
    if (!this.razorpay) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
    }
    return this.razorpay;
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.getSupabase()
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return (data || []).map(this.mapPlan);
  }

  async getSubscription(builderId: string): Promise<Subscription | null> {
    const { data, error } = await this.getSupabase()
      .from('builder_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('builder_id', builderId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();

    if (error || !data) return null;
    return this.mapSubscription(data);
  }

  async checkUsageLimits(builderId: string): Promise<{
    canAddProperty: boolean;
    canReceiveLead: boolean;
    propertiesUsed: number;
    propertiesLimit: number | null;
    leadsUsed: number;
    leadsLimit: number | null;
  }> {
    const subscription = await this.getSubscription(builderId);

    if (!subscription || !subscription.plan) {
      return {
        canAddProperty: false,
        canReceiveLead: false,
        propertiesUsed: 0,
        propertiesLimit: 0,
        leadsUsed: 0,
        leadsLimit: 0,
      };
    }

    const plan = subscription.plan;

    return {
      canAddProperty:
        plan.maxProperties == null ||
        subscription.propertiesUsed < plan.maxProperties,
      canReceiveLead:
        plan.maxLeadsPerMonth == null ||
        subscription.leadsUsedThisMonth < plan.maxLeadsPerMonth,
      propertiesUsed: subscription.propertiesUsed,
      propertiesLimit: plan.maxProperties ?? null,
      leadsUsed: subscription.leadsUsedThisMonth,
      leadsLimit: plan.maxLeadsPerMonth ?? null,
    };
  }

  async incrementPropertyUsage(builderId: string): Promise<void> {
    const { data } = await this.getSupabase()
      .from('builder_subscriptions')
      .select('id, properties_used')
      .eq('builder_id', builderId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (data) {
      await this.getSupabase()
        .from('builder_subscriptions')
        .update({ properties_used: (data.properties_used || 0) + 1 })
        .eq('id', data.id);
    }
  }

  async incrementLeadUsage(builderId: string): Promise<void> {
    const { data } = await this.getSupabase()
      .from('builder_subscriptions')
      .select('id, leads_used_this_month')
      .eq('builder_id', builderId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (data) {
      await this.getSupabase()
        .from('builder_subscriptions')
        .update({
          leads_used_this_month: (data.leads_used_this_month || 0) + 1,
        })
        .eq('id', data.id);
    }
  }

  async createSubscription(
    builderId: string,
    planSlug: string,
    billingCycle: 'monthly' | 'yearly',
    couponCode?: string
  ): Promise<{
    subscriptionId: string;
    razorpaySubscriptionId: string;
    shortUrl: string;
  }> {
    const { data: plan, error: planError } = await this.getSupabase()
      .from('subscription_plans')
      .select('*')
      .eq('slug', planSlug)
      .single();

    if (planError || !plan) throw new Error('Plan not found');

    const { data: builder, error: builderError } = await this.getSupabase()
      .from('builder_profiles')
      .select('id, company_name')
      .eq('id', builderId)
      .single();

    if (builderError || !builder) throw new Error('Builder not found');

    // Base amount in paise
    let amount =
      billingCycle === 'yearly'
        ? plan.price_yearly || plan.price_monthly * 12
        : plan.price_monthly;

    // Apply coupon via coupons table (optional)
    if (couponCode) {
      const discount = await this.validateCoupon(
        couponCode,
        amount,
        plan.id as string
      );
      if (discount) {
        amount -= discount.discountAmount;
      }
    }

    const razorpayPlan = await this.getOrCreateRazorpayPlan(plan, billingCycle);

    const razorpaySubscription = await this.getRazorpay().subscriptions.create({
      plan_id: razorpayPlan.id,
      total_count: billingCycle === 'yearly' ? 1 : 12,
      quantity: 1,
      customer_notify: 1,
    });

    const { data: subscription, error } = await this.getSupabase()
      .from('builder_subscriptions')
      .insert({
        builder_id: builderId,
        plan_id: plan.id,
        status: 'pending',
        billing_cycle: billingCycle,
        razorpay_subscription_id: razorpaySubscription.id,
      })
      .select('id')
      .single();

    if (error || !subscription) {
      throw new Error('Failed to create subscription');
    }

    return {
      subscriptionId: subscription.id,
      razorpaySubscriptionId: razorpaySubscription.id,
      shortUrl: razorpaySubscription.short_url,
    };
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.payload;

    switch (event) {
      case 'subscription.activated':
        await this.handleSubscriptionActivated(data.subscription.entity);
        break;
      case 'subscription.charged':
        await this.handleSubscriptionCharged(
          data.subscription.entity,
          data.payment.entity
        );
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(data.subscription.entity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(data.payment.entity);
        break;
      default:
        break;
    }
  }

  private async handleSubscriptionActivated(
    razorpaySubscription: any
  ): Promise<void> {
    const { data } = await this.getSupabase()
      .from('builder_subscriptions')
      .select('id, builder_id, plan_id')
      .eq('razorpay_subscription_id', razorpaySubscription.id)
      .maybeSingle();

    if (!data) return;

    const now = new Date();
    const periodEnd = new Date(razorpaySubscription.current_end * 1000);

    await this.getSupabase()
      .from('builder_subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', data.id);
  }

  private async handleSubscriptionCharged(
    razorpaySubscription: any,
    payment: any
  ): Promise<void> {
    const { data } = await this.getSupabase()
      .from('builder_subscriptions')
      .select('id, builder_id')
      .eq('razorpay_subscription_id', razorpaySubscription.id)
      .maybeSingle();

    if (!data) return;

    await this.getSupabase().from('payment_transactions').insert({
      builder_id: data.builder_id,
      subscription_id: data.id,
      transaction_type: 'subscription',
      amount: payment.amount,
      currency: payment.currency,
      tax_amount: payment.tax || 0,
      net_amount: payment.amount,
      gateway: 'razorpay',
      gateway_payment_id: payment.id,
      gateway_subscription_id: razorpaySubscription.id,
      status: 'succeeded',
      completed_at: new Date().toISOString(),
    });
  }

  private async handleSubscriptionCancelled(
    razorpaySubscription: any
  ): Promise<void> {
    const { data } = await this.getSupabase()
      .from('builder_subscriptions')
      .select('id')
      .eq('razorpay_subscription_id', razorpaySubscription.id)
      .maybeSingle();

    if (!data) return;

    await this.getSupabase()
      .from('builder_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
  }

  private async handlePaymentFailed(payment: any): Promise<void> {
    await this.getSupabase().from('payment_transactions').insert({
      transaction_type: 'subscription',
      amount: payment.amount,
      currency: payment.currency,
      tax_amount: payment.tax || 0,
      net_amount: payment.amount,
      gateway: 'razorpay',
      gateway_payment_id: payment.id,
      status: 'failed',
      failure_reason: payment.error_description,
      failure_code: payment.error_code,
    });
  }

  private async validateCoupon(
    code: string,
    amount: number,
    planId: string
  ): Promise<{ discountAmount: number } | null> {
    const { data: coupon } = await this.getSupabase()
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!coupon) return null;

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) return null;
    if (coupon.valid_until && new Date(coupon.valid_until) < now) return null;

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) return null;

    if (coupon.min_amount && amount < coupon.min_amount) return null;

    if (
      coupon.applicable_plans &&
      Array.isArray(coupon.applicable_plans) &&
      !coupon.applicable_plans.includes(planId)
    ) {
      return null;
    }

    let discountAmount =
      coupon.discount_type === 'percentage'
        ? Math.floor(amount * (coupon.discount_value / 100))
        : coupon.discount_value;

    if (coupon.max_discount && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount;
    }

    return { discountAmount };
  }

  private async getOrCreateRazorpayPlan(
    plan: any,
    billingCycle: 'monthly' | 'yearly'
  ) {
    const planName = `${plan.slug}_${billingCycle}`;
    const amount =
      billingCycle === 'yearly'
        ? plan.price_yearly || plan.price_monthly * 12
        : plan.price_monthly;
    const period = billingCycle === 'yearly' ? 'yearly' : 'monthly';

    const plans = await this.getRazorpay().plans.all();
    const existing = plans.items.find(
      (p: any) => p.item.name === planName && p.item.amount === amount
    );

    if (existing) return existing;

    return await this.getRazorpay().plans.create({
      period,
      interval: 1,
      item: {
        name: planName,
        amount,
        currency: 'INR',
        description: plan.description,
      },
    });
  }

  private mapPlan(data: any): SubscriptionPlan {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      priceMonthly: data.price_monthly,
      priceYearly: data.price_yearly,
      features: data.features || [],
      maxProperties: data.max_properties,
      maxLeadsPerMonth: data.max_leads_per_month,
      maxTeamMembers: data.max_team_members,
      aiFeaturesEnabled: data.ai_features_enabled,
      analyticsEnabled: data.analytics_enabled,
      apiAccessEnabled: data.api_access_enabled,
      prioritySupport: data.priority_support,
      isPopular: data.is_popular,
    };
  }

  private mapSubscription(data: any): Subscription {
    return {
      id: data.id,
      builderId: data.builder_id,
      planId: data.plan_id || null,
      plan: data.plan ? this.mapPlan(data.plan) : null,
      status: data.status,
      billingCycle: data.billing_cycle,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      trialEndAt: data.trial_end_at,
      cancelAtPeriodEnd: data.cancel_at_period_end || false,
      propertiesUsed: data.properties_used || 0,
      leadsUsedThisMonth: data.leads_used_this_month || 0,
    };
  }
}

let revenueServiceInstance: RevenueService | null = null;

export const revenueService = {
  getInstance(): RevenueService {
    if (!revenueServiceInstance) {
      revenueServiceInstance = new RevenueService();
    }
    return revenueServiceInstance;
  },
  getPlans: (...args: Parameters<RevenueService['getPlans']>) =>
    revenueService.getInstance().getPlans(...args),
  getSubscription: (...args: Parameters<RevenueService['getSubscription']>) =>
    revenueService.getInstance().getSubscription(...args),
  checkUsageLimits: (...args: Parameters<RevenueService['checkUsageLimits']>) =>
    revenueService.getInstance().checkUsageLimits(...args),
  incrementPropertyUsage: (...args: Parameters<RevenueService['incrementPropertyUsage']>) =>
    revenueService.getInstance().incrementPropertyUsage(...args),
  incrementLeadUsage: (...args: Parameters<RevenueService['incrementLeadUsage']>) =>
    revenueService.getInstance().incrementLeadUsage(...args),
  createSubscription: (...args: Parameters<RevenueService['createSubscription']>) =>
    revenueService.getInstance().createSubscription(...args),
  handleWebhook: (...args: Parameters<RevenueService['handleWebhook']>) =>
    revenueService.getInstance().handleWebhook(...args),
};




