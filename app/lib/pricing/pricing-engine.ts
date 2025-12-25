import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Plan {
  id: string;
  plan_name: string;
  plan_slug: string;
  min_properties: number;
  max_properties: number | null;
  monthly_price: number;
  yearly_price: number;
  team_members_limit: number | null;
  support_level: string;
  featured_listings_per_month: number | null;
  tagline?: string;
  description?: string;
  is_popular?: boolean;
}

export class PricingEngine {
  /**
   * Get recommended plan based on property count
   */
  async getRecommendedPlan(propertyCount: number): Promise<Plan | null> {
    const { data: plans } = await supabase
      .from('property_plans')
      .select('*')
      .eq('is_active', true)
      .order('min_properties', { ascending: true });

    if (!plans || plans.length === 0) return null;

    // Find the plan that fits the property count
    for (const plan of plans) {
      if (propertyCount >= plan.min_properties) {
        if (plan.max_properties === null || propertyCount <= plan.max_properties) {
          return plan as Plan;
        }
      }
    }

    // If no plan fits, return highest plan (Enterprise)
    return plans[plans.length - 1] as Plan;
  }

  /**
   * Calculate price for custom property count (Enterprise)
   */
  calculateCustomPrice(propertyCount: number): {
    basePrice: number;
    perPropertyPrice: number;
    totalMonthly: number;
    totalYearly: number;
  } {
    // Enterprise pricing logic
    const basePrice = 1500000; // ₹15,000 base in paise
    const perPropertyPrice = 20000; // ₹200 per property after 50

    const extraProperties = Math.max(0, propertyCount - 50);
    const totalMonthly = basePrice + (extraProperties * perPropertyPrice);
    const totalYearly = totalMonthly * 10; // 2 months free

    return {
      basePrice,
      perPropertyPrice,
      totalMonthly,
      totalYearly
    };
  }

  /**
   * Get all available plans
   */
  async getAllPlans(): Promise<Plan[]> {
    const { data: plans } = await supabase
      .from('property_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return (plans || []) as Plan[];
  }

  /**
   * Check if builder can add more properties
   */
  async canAddProperty(builderId: string): Promise<{
    allowed: boolean;
    currentCount: number;
    limit: number | null;
    message: string;
    planName?: string;
  }> {
    // Get subscription
    const { data: subscription } = await supabase
      .from('builder_subscriptions')
      .select('*, plan:property_plans(*)')
      .eq('builder_id', builderId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return {
        allowed: false,
        currentCount: 0,
        limit: null,
        message: 'No active subscription found. Please subscribe to a plan first.'
      };
    }

    // Count active properties
    const { count: activeCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('builder_id', builderId)
      .or('status.is.null,status.neq.sold');

    const currentCount = activeCount || 0;
    const limit = subscription.properties_limit;
    const planName = (subscription.plan as any)?.plan_name || 'Unknown';

    // Check if unlimited
    if (limit === null) {
      return {
        allowed: true,
        currentCount,
        limit: null,
        message: 'Unlimited properties',
        planName
      };
    }

    // Check if under limit
    if (currentCount < limit) {
      return {
        allowed: true,
        currentCount,
        limit,
        message: `${currentCount} of ${limit} properties used`,
        planName
      };
    }

    // Over limit
    return {
      allowed: false,
      currentCount,
      limit,
      message: `Property limit reached. Upgrade to add more properties.`,
      planName
    };
  }

  /**
   * Suggest plan upgrade
   */
  async suggestUpgrade(builderId: string): Promise<{
    shouldUpgrade: boolean;
    currentPlan?: string;
    suggestedPlan?: string;
    reason?: string;
    priceDifference?: number;
    currentUsage?: number;
    currentLimit?: number;
    newLimit?: number | null;
  }> {
    const { data, error } = await supabase
      .rpc('suggest_plan_upgrade', { p_builder_id: builderId });

    if (error || !data) {
      return { shouldUpgrade: false };
    }

    return data;
  }

  /**
   * Calculate proration for plan change
   */
  calculateProration(
    oldPrice: number,
    newPrice: number,
    daysRemaining: number,
    billingCycle: 'monthly' | 'yearly'
  ): {
    proratedCredit: number;
    proratedCharge: number;
    amountDue: number;
  } {
    const daysInCycle = billingCycle === 'monthly' ? 30 : 365;
    const dailyOldPrice = oldPrice / daysInCycle;
    const dailyNewPrice = newPrice / daysInCycle;

    const proratedCredit = Math.round(dailyOldPrice * daysRemaining);
    const proratedCharge = Math.round(dailyNewPrice * daysRemaining);
    const amountDue = proratedCharge - proratedCredit;

    return {
      proratedCredit,
      proratedCharge,
      amountDue
    };
  }

  /**
   * Format price for display
   */
  formatPrice(priceInPaise: number): string {
    const rupees = priceInPaise / 100;
    
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)}L`;
    }
    if (rupees >= 1000) {
      return `₹${(rupees / 1000).toFixed(1)}K`;
    }
    return `₹${rupees.toLocaleString('en-IN')}`;
  }

  /**
   * Get pricing comparison
   */
  async getPricingComparison(currentPlanId: string, targetPlanId: string) {
    const { data: plans } = await supabase
      .from('property_plans')
      .select('*')
      .in('id', [currentPlanId, targetPlanId]);

    if (!plans || plans.length !== 2) return null;

    const current = plans.find(p => p.id === currentPlanId);
    const target = plans.find(p => p.id === targetPlanId);

    if (!current || !target) return null;

    const monthlyDiff = target.monthly_price - current.monthly_price;
    const yearlyDiff = target.yearly_price - current.yearly_price;

    return {
      current: {
        name: current.plan_name,
        monthlyPrice: current.monthly_price,
        yearlyPrice: current.yearly_price,
        maxProperties: current.max_properties
      },
      target: {
        name: target.plan_name,
        monthlyPrice: target.monthly_price,
        yearlyPrice: target.yearly_price,
        maxProperties: target.max_properties
      },
      difference: {
        monthly: monthlyDiff,
        yearly: yearlyDiff,
        monthlyFormatted: this.formatPrice(Math.abs(monthlyDiff)),
        yearlyFormatted: this.formatPrice(Math.abs(yearlyDiff)),
        isUpgrade: monthlyDiff > 0,
        propertyIncrease: (target.max_properties || Infinity) - (current.max_properties || 0)
      }
    };
  }
}

