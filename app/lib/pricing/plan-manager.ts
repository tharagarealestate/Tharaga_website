import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

export class PlanManager {
  /**
   * Upgrade to higher plan
   */
  async upgradePlan(
    builderId: string,
    newPlanId: string,
    reason: string = 'User upgrade'
  ): Promise<{
    success: boolean;
    message: string;
    proratedAmount?: number;
  }> {
    try {
      // Get current subscription
      const { data: currentSub } = await supabase
        .from('builder_subscriptions')
        .select('*, plan:property_plans(*)')
        .eq('builder_id', builderId)
        .eq('status', 'active')
        .single();

      if (!currentSub) {
        return { success: false, message: 'No active subscription found' };
      }

      // Get new plan
      const { data: newPlan } = await supabase
        .from('property_plans')
        .select('*')
        .eq('id', newPlanId)
        .single();

      if (!newPlan) {
        return { success: false, message: 'New plan not found' };
      }

      // Validate upgrade (new plan should have higher property limit)
      const currentPlan = currentSub.plan as any;
      if (newPlan.min_properties <= currentPlan.min_properties) {
        return { success: false, message: 'This is not an upgrade' };
      }

      // Calculate proration
      const now = new Date();
      const periodEnd = new Date(currentSub.current_period_end);
      const daysRemaining = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const oldPrice = currentSub.billing_cycle === 'monthly' 
        ? currentPlan.monthly_price 
        : currentPlan.yearly_price;
      
      const newPrice = currentSub.billing_cycle === 'monthly'
        ? newPlan.monthly_price
        : newPlan.yearly_price;

      const dailyOldPrice = oldPrice / (currentSub.billing_cycle === 'monthly' ? 30 : 365);
      const dailyNewPrice = newPrice / (currentSub.billing_cycle === 'monthly' ? 30 : 365);

      const proratedCredit = Math.round(dailyOldPrice * daysRemaining);
      const proratedCharge = Math.round(dailyNewPrice * daysRemaining);
      const amountDue = proratedCharge - proratedCredit;

      // Update subscription in database
      const { error: updateError } = await supabase
        .from('builder_subscriptions')
        .update({
          plan_id: newPlanId,
          properties_limit: newPlan.max_properties,
          current_price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('builder_id', builderId);

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      // Log plan change
      await supabase.from('plan_change_history').insert({
        builder_id: builderId,
        from_plan_id: currentSub.plan_id,
        to_plan_id: newPlanId,
        change_type: 'upgrade',
        change_reason: reason,
        triggered_by: 'user',
        old_price: oldPrice,
        new_price: newPrice,
        price_difference: newPrice - oldPrice,
        prorated_amount: amountDue
      });

      // Send email notification
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', builderId)
          .single();

        if (profile?.email) {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: profile.email,
              subject: `Plan Upgraded: Welcome to ${newPlan.plan_name}!`,
              template: 'plan-upgrade',
              data: {
                fromPlan: currentPlan.plan_name,
                toPlan: newPlan.plan_name,
                priceDifference: newPrice - oldPrice
              }
            })
          });
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the upgrade if email fails
      }

      return {
        success: true,
        message: `Successfully upgraded to ${newPlan.plan_name}`,
        proratedAmount: amountDue
      };

    } catch (error: any) {
      console.error('Upgrade error:', error);
      return {
        success: false,
        message: error.message || 'Upgrade failed'
      };
    }
  }

  /**
   * Downgrade to lower plan
   */
  async downgradePlan(
    builderId: string,
    newPlanId: string,
    reason: string = 'User downgrade'
  ): Promise<{
    success: boolean;
    message: string;
    effectiveDate?: string;
  }> {
    try {
      // Get current subscription
      const { data: currentSub } = await supabase
        .from('builder_subscriptions')
        .select('*, plan:property_plans(*)')
        .eq('builder_id', builderId)
        .eq('status', 'active')
        .single();

      if (!currentSub) {
        return { success: false, message: 'No active subscription found' };
      }

      // Get new plan
      const { data: newPlan } = await supabase
        .from('property_plans')
        .select('*')
        .eq('id', newPlanId)
        .single();

      if (!newPlan) {
        return { success: false, message: 'New plan not found' };
      }

      // Validate downgrade
      const currentPlan = currentSub.plan as any;
      if (newPlan.min_properties >= currentPlan.min_properties) {
        return { success: false, message: 'This is not a downgrade' };
      }

      // Check if current property count fits in new plan
      const { count: activeCount } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('builder_id', builderId)
        .or('status.is.null,status.neq.sold');

      if (newPlan.max_properties && activeCount! > newPlan.max_properties) {
        return {
          success: false,
          message: `You have ${activeCount} active properties. ${newPlan.plan_name} allows only ${newPlan.max_properties}. Please delete some properties first.`
        };
      }

      // Schedule downgrade at period end (no immediate downgrade)
      const periodEnd = new Date(currentSub.current_period_end);

      await supabase
        .from('builder_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('builder_id', builderId);

      // Store pending downgrade info
      await supabase.from('plan_change_history').insert({
        builder_id: builderId,
        from_plan_id: currentSub.plan_id,
        to_plan_id: newPlanId,
        change_type: 'downgrade',
        change_reason: reason,
        triggered_by: 'user',
        old_price: currentSub.current_price,
        new_price: currentSub.billing_cycle === 'monthly' 
          ? newPlan.monthly_price 
          : newPlan.yearly_price,
        effective_date: periodEnd.toISOString()
      });

      // Send email notification
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', builderId)
          .single();

        if (profile?.email) {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: profile.email,
              subject: `Plan Downgrade Scheduled: ${newPlan.plan_name}`,
              template: 'plan-downgrade',
              data: {
                fromPlan: currentPlan.plan_name,
                toPlan: newPlan.plan_name,
                effectiveDate: periodEnd.toISOString()
              }
            })
          });
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the downgrade if email fails
      }

      return {
        success: true,
        message: `Downgrade scheduled for ${periodEnd.toLocaleDateString()}. Your current plan will remain active until then.`,
        effectiveDate: periodEnd.toISOString()
      };

    } catch (error: any) {
      console.error('Downgrade error:', error);
      return {
        success: false,
        message: error.message || 'Downgrade failed'
      };
    }
  }

  /**
   * Cancel downgrade (keep current plan)
   */
  async cancelDowngrade(builderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await supabase
        .from('builder_subscriptions')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('builder_id', builderId);

      return {
        success: true,
        message: 'Downgrade cancelled. Your current plan will continue.'
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to cancel downgrade'
      };
    }
  }
}

