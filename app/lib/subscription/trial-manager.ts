import { createClient } from '@supabase/supabase-js';

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

export class TrialManager {
  /**
   * Track trial engagement
   */
  async trackTrialActivity(
    builderId: string,
    activityType: 'property_added' | 'lead_received' | 'login' | 'feature_used',
    metadata?: any
  ): Promise<void> {
    try {
      const { data: analytics } = await getSupabaseAdmin()
        .from('trial_analytics')
        .select('*')
        .eq('builder_id', builderId)
        .single();

      if (!analytics) return;

      const updates: any = { updated_at: new Date().toISOString() };

      switch (activityType) {
        case 'property_added':
          updates.properties_added_during_trial = (analytics.properties_added_during_trial || 0) + 1;
          break;
        case 'lead_received':
          updates.leads_received_during_trial = (analytics.leads_received_during_trial || 0) + 1;
          break;
        case 'login':
          updates.login_count_during_trial = (analytics.login_count_during_trial || 0) + 1;
          break;
        case 'feature_used':
          const features = analytics.features_used || [];
          if (metadata?.feature && !features.includes(metadata.feature)) {
            updates.features_used = [...features, metadata.feature];
          }
          break;
      }

      await getSupabaseAdmin()
        .from('trial_analytics')
        .update(updates)
        .eq('builder_id', builderId);

    } catch (error) {
      console.error('Track trial activity error:', error);
    }
  }

  /**
   * Get trial health score (0-100)
   */
  async getTrialHealthScore(builderId: string): Promise<{
    score: number;
    signals: {
      propertiesAdded: number;
      leadsReceived: number;
      loginCount: number;
      featuresUsed: number;
    };
    recommendation: string;
  }> {
    const { data: analytics } = await getSupabaseAdmin()
      .from('trial_analytics')
      .select('*')
      .eq('builder_id', builderId)
      .single();

    if (!analytics) {
      return {
        score: 0,
        signals: { propertiesAdded: 0, leadsReceived: 0, loginCount: 0, featuresUsed: 0 },
        recommendation: 'No trial data found'
      };
    }

    // Calculate health score
    let score = 0;

    // Properties added (40 points max)
    const propertiesScore = Math.min((analytics.properties_added_during_trial || 0) * 10, 40);
    score += propertiesScore;

    // Leads received (30 points max)
    const leadsScore = Math.min((analytics.leads_received_during_trial || 0) * 5, 30);
    score += leadsScore;

    // Login count (15 points max)
    const loginScore = Math.min((analytics.login_count_during_trial || 0) * 3, 15);
    score += loginScore;

    // Features used (15 points max)
    const featuresScore = Math.min((analytics.features_used?.length || 0) * 3, 15);
    score += featuresScore;

    // Generate recommendation
    let recommendation = '';
    if (score >= 80) {
      recommendation = 'Excellent engagement! Very likely to convert.';
    } else if (score >= 60) {
      recommendation = 'Good engagement. Follow up with conversion offer.';
    } else if (score >= 40) {
      recommendation = 'Moderate engagement. Encourage more feature usage.';
    } else if (score >= 20) {
      recommendation = 'Low engagement. Send re-engagement email with tips.';
    } else {
      recommendation = 'Very low engagement. Consider outreach to understand barriers.';
    }

    return {
      score,
      signals: {
        propertiesAdded: analytics.properties_added_during_trial || 0,
        leadsReceived: analytics.leads_received_during_trial || 0,
        loginCount: analytics.login_count_during_trial || 0,
        featuresUsed: analytics.features_used?.length || 0
      },
      recommendation
    };
  }

  /**
   * Get trial status for a builder
   */
  async getTrialStatus(builderId: string): Promise<{
    isTrial: boolean;
    daysRemaining: number;
    trialEndsAt: string | null;
    healthScore: number;
    propertiesAdded: number;
    leadsReceived: number;
  } | null> {
    const { data: subscription } = await getSupabaseAdmin()
      .from('builder_subscriptions')
      .select('is_trial, trial_ends_at')
      .eq('builder_id', builderId)
      .single();

    if (!subscription || !subscription.is_trial) {
      return null;
    }

    const healthScore = await this.getTrialHealthScore(builderId);
    const trialEndsAt = subscription.trial_ends_at;
    const now = new Date();
    const endsAt = trialEndsAt ? new Date(trialEndsAt) : now;
    const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isTrial: true,
      daysRemaining: Math.max(0, daysRemaining),
      trialEndsAt: trialEndsAt,
      healthScore: healthScore.score,
      propertiesAdded: healthScore.signals.propertiesAdded,
      leadsReceived: healthScore.signals.leadsReceived
    };
  }

  /**
   * Send trial reminder emails
   */
  async sendTrialReminders(): Promise<void> {
    // Get trials ending in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: trialEnding } = await getSupabaseAdmin()
      .from('builder_subscriptions')
      .select('*, builder:profiles(*)')
      .eq('status', 'trial')
      .lte('trial_ends_at', threeDaysFromNow.toISOString())
      .gte('trial_ends_at', new Date().toISOString());

    if (!trialEnding || trialEnding.length === 0) return;

    for (const subscription of trialEnding) {
      const healthScore = await this.getTrialHealthScore(subscription.builder_id);
      
      // Send personalized reminder based on health score
      if (healthScore.score >= 60) {
        // Send conversion offer
        await this.sendConversionOffer(
          (subscription.builder as any)?.email || '',
          subscription.trial_ends_at
        );
      } else {
        // Send tips to get more value
        await this.sendTrialTips(
          (subscription.builder as any)?.email || '',
          healthScore.recommendation
        );
      }
    }
  }

  /**
   * Helper: Send conversion offer
   */
  private async sendConversionOffer(email: string, trialEndsAt: string | null): Promise<void> {
    // TODO: Implement email
    console.log(`Conversion offer sent to ${email}, expires: ${trialEndsAt}`);
  }

  /**
   * Helper: Send trial tips
   */
  private async sendTrialTips(email: string, tips: string): Promise<void> {
    // TODO: Implement email
    console.log(`Trial tips sent to ${email}: ${tips}`);
  }
}




