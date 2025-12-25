'use client';

import { useEffect, useState } from 'react';
import { QuotaUsageWidget } from '@/components/pricing/QuotaUsageWidget';
import { PlanSelector } from '@/components/pricing/PlanSelector';
import { UsageAnalytics } from '@/components/pricing/UsageAnalytics';
import { UpgradePrompt } from '@/components/pricing/UpgradePrompt';
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper';

interface Subscription {
  id: string;
  plan_id: string;
  plan: {
    id: string;
    plan_name: string;
  };
  status: string;
  billing_cycle: string;
  current_period_end: string;
  properties_used: number;
  properties_limit: number | null;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
    checkUpgradeSuggestion();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/pricing/subscription');
      const data = await response.json();
      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUpgradeSuggestion = async () => {
    try {
      const response = await fetch('/api/pricing/check-quota');
      const data = await response.json();
      if (data.success && data.quota) {
        // Check if we should show upgrade prompt
        const { currentCount, limit } = data.quota;
        if (limit && currentCount >= limit * 0.8) {
          // Get upgrade suggestion
          const suggestResponse = await fetch('/api/pricing/suggest-upgrade');
          const suggestData = await suggestResponse.json();
          if (suggestData.shouldUpgrade) {
            setUpgradePrompt(suggestData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check upgrade suggestion:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!upgradePrompt?.suggestedPlan) return;
    
    try {
      // Find the plan ID for the suggested plan
      const plansResponse = await fetch('/api/pricing/plans');
      const plansData = await plansResponse.json();
      const suggestedPlan = plansData.plans?.find(
        (p: any) => p.name === upgradePrompt.suggestedPlan
      );

      if (suggestedPlan) {
        const upgradeResponse = await fetch('/api/pricing/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: suggestedPlan.id })
        });

        const upgradeData = await upgradeResponse.json();
        if (upgradeData.success) {
          alert(upgradeData.message);
          window.location.reload();
        } else {
          alert(upgradeData.error || 'Failed to upgrade');
        }
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert('Failed to upgrade plan. Please try again.');
    }
  };

  if (loading) {
    return (
      <BuilderPageWrapper
        title="Billing & Usage"
        description="Manage your subscription and view usage analytics"
      >
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
        </div>
      </BuilderPageWrapper>
    );
  }

  return (
    <BuilderPageWrapper
      title="Billing & Usage"
      description="Manage your subscription and view usage analytics"
      noContainer
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quota Widget */}
        <div className="mb-8">
          <QuotaUsageWidget />
        </div>

        {/* Usage Analytics */}
        <div className="mb-8">
          <UsageAnalytics />
        </div>

        {/* Plan Selector */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Available Plans
          </h2>
          <PlanSelector currentPlanId={subscription?.plan_id} />
        </div>

        {/* Current Subscription Info */}
        {subscription && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Current Subscription
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Plan</p>
                <p className="text-lg font-semibold text-slate-900">
                  {subscription.plan?.plan_name || 'No Plan'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Billing Cycle</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">
                  {subscription.billing_cycle || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Renews On</p>
                <p className="text-lg font-semibold text-slate-900">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Prompt */}
        {upgradePrompt && upgradePrompt.shouldUpgrade && (
          <UpgradePrompt
            currentPlan={upgradePrompt.currentPlan}
            suggestedPlan={upgradePrompt.suggestedPlan}
            reason={upgradePrompt.message}
            priceDifference={upgradePrompt.price_difference || 0}
            onUpgrade={handleUpgrade}
            onDismiss={() => setUpgradePrompt(null)}
          />
        )}
      </div>
    </BuilderPageWrapper>
  );
}

