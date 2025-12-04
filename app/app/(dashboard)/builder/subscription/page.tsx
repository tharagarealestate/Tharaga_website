'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
  Crown,
  ArrowRight,
  CreditCard,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { cn } from '@/lib/utils';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  features: Array<{ name: string; included: boolean; limit?: number }>;
  maxProperties?: number | null;
  maxLeadsPerMonth?: number | null;
  maxTeamMembers?: number | null;
  aiFeaturesEnabled: boolean;
  analyticsEnabled: boolean;
  isPopular: boolean;
}

interface Subscription {
  id: string;
  builderId: string;
  planId: string | null;
  plan: SubscriptionPlan | null;
  status: string;
  billingCycle: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEndAt?: string;
  cancelAtPeriodEnd: boolean;
  propertiesUsed: number;
  leadsUsedThisMonth: number;
}

interface UsageLimits {
  canAddProperty: boolean;
  canReceiveLead: boolean;
  propertiesUsed: number;
  propertiesLimit: number | null;
  leadsUsed: number;
  leadsLimit: number | null;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, subRes, limitsRes] = await Promise.all([
        fetch('/api/revenue/plans'),
        fetch('/api/revenue/subscription'),
        fetch('/api/revenue/usage-limits'),
      ]);

      const plansData = await plansRes.json();
      const subData = await subRes.json();
      const limitsData = await limitsRes.json();

      setPlans(plansData.plans || []);
      setSubscription(subData.subscription || null);
      setUsageLimits(limitsData || null);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    const rupees = price / 100;
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)}L`;
    }
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  const handleSubscribe = async (planSlug: string) => {
    try {
      const response = await fetch('/api/revenue/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (data.razorpaySubscriptionId) {
        // Redirect to Razorpay payment page
        window.location.href = data.shortUrl;
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="animate-spin h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Subscription & Billing</h1>
          <p className="text-lg text-white/70">
            Choose the perfect plan for your business needs
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && subscription.plan && (
          <GlassCard variant="light" className="mb-12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Current Plan: {subscription.plan.name}
                </h2>
                <p className="text-white/70">
                  {subscription.status === 'active' ? (
                    <>
                      Active • Renews on{' '}
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </>
                  ) : (
                    `Status: ${subscription.status}`
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#D4AF37]">
                  {billingCycle === 'yearly' && subscription.plan.priceYearly
                    ? formatPrice(subscription.plan.priceYearly)
                    : formatPrice(subscription.plan.priceMonthly)}
                  <span className="text-lg text-white/70">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            {usageLimits && (
              <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div>
                  <p className="text-sm text-white/60 mb-1">Properties</p>
                  <p className="text-xl font-semibold text-white">
                    {usageLimits.propertiesUsed} /{' '}
                    {usageLimits.propertiesLimit === null ? '∞' : usageLimits.propertiesLimit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-1">Leads This Month</p>
                  <p className="text-xl font-semibold text-white">
                    {usageLimits.leadsUsed} /{' '}
                    {usageLimits.leadsLimit === null ? '∞' : usageLimits.leadsLimit}
                  </p>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Billing Cycle Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-medium transition-colors',
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-br from-[#D4AF37] to-[#0F52BA] text-white'
                  : 'text-white/70 hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-medium transition-colors',
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-br from-[#D4AF37] to-[#0F52BA] text-white'
                  : 'text-white/70 hover:text-white'
              )}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => {
            const price =
              billingCycle === 'yearly' && plan.priceYearly
                ? plan.priceYearly
                : plan.priceMonthly;
            const isCurrentPlan = subscription?.plan?.slug === plan.slug;
            const isPopular = plan.isPopular;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-[#D4AF37] to-[#0F52BA] text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <GlassCard
                  variant={isPopular ? 'gold' : 'light'}
                  className={cn(
                    'h-full p-6',
                    isPopular && 'ring-2 ring-[#D4AF37]'
                  )}
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-white/70 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-[#D4AF37]">
                        {formatPrice(price)}
                      </span>
                      <span className="text-white/70">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={cn(
                            'text-sm',
                            feature.included ? 'text-white' : 'text-white/50'
                          )}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <PremiumButton variant="outline" className="w-full" disabled>
                      Current Plan
                    </PremiumButton>
                  ) : (
                    <PremiumButton
                      variant={isPopular ? 'primary' : 'secondary'}
                      className="w-full"
                      onClick={() => handleSubscribe(plan.slug)}
                    >
                      {subscription ? 'Upgrade Plan' : 'Get Started'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </PremiumButton>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <GlassCard variant="light" className="mt-12 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">All Plans Include</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureItem icon={<Shield />} title="RERA Verified" />
            <FeatureItem icon={<Zap />} title="Real-time Updates" />
            <FeatureItem icon={<Users />} title="Team Collaboration" />
            <FeatureItem icon={<BarChart3 />} title="Analytics Dashboard" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#0F52BA] flex items-center justify-center text-white">
        {icon}
      </div>
      <span className="text-white font-medium">{title}</span>
    </div>
  );
}





