'use client';

import { useState, useEffect } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  propertyRange: {
    min: number;
    max: number | null;
  };
  pricing: {
    monthly: number;
    yearly: number;
    monthlyFormatted: string;
    yearlyFormatted: string;
  };
  features: {
    teamMembers: number | null;
    support: string;
    featuredListings: number | null;
  };
  tagline?: string;
  description?: string;
  isPopular?: boolean;
}

export function PlanSelector({ currentPlanId }: { currentPlanId?: string }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/pricing/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInPaise: number) => {
    const rupees = priceInPaise / 100;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return Math.round(yearlyPrice / 12);
  };

  const handlePlanSelect = async (planId: string) => {
    if (planId === currentPlanId) return;

    try {
      const response = await fetch('/api/pricing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.error || 'Failed to upgrade plan');
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert('Failed to upgrade plan. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            billingCycle === 'monthly'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
            billingCycle === 'yearly'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          Yearly
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
            Save 17%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.yearly;
          const displayPrice = billingCycle === 'monthly' 
            ? plan.pricing.monthlyFormatted
            : `${formatPrice(getMonthlyEquivalent(plan.pricing.yearly))}/mo`;
          
          const isCurrent = plan.id === currentPlanId;

          const features = [
            `Up to ${plan.propertyRange.max || 'unlimited'} properties`,
            `${plan.features.teamMembers || 'Unlimited'} team members`,
            `${plan.features.support} support`,
            plan.features.featuredListings ? `${plan.features.featuredListings} featured listings/month` : null,
            'All AI features included',
            'RERA verification',
            'Advanced analytics'
          ].filter(Boolean);

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 transition-all ${
                plan.isPopular
                  ? 'bg-gradient-to-br from-[#D4AF37]/10 to-[#1e40af]/10 border-2 border-[#D4AF37]'
                  : 'bg-white border border-slate-200'
              } ${
                isCurrent ? 'ring-2 ring-emerald-500' : ''
              } hover:shadow-xl`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    Current Plan
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-600">
                  {plan.propertyRange.min}-{plan.propertyRange.max || '∞'} properties
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-slate-900">
                    {displayPrice.split('/')[0]}
                  </span>
                  <span className="text-slate-600">/month</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-emerald-600 font-medium">
                    {formatPrice(plan.pricing.monthly * 12 - plan.pricing.yearly)} saved yearly
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mb-6 transition-all ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                    : plan.isPopular
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white hover:shadow-lg'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-[#D4AF37]'
                }`}
                disabled={isCurrent}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {isCurrent ? 'Current Plan' : 'Choose Plan'}
                {!isCurrent && <ArrowRight className="w-4 h-4" />}
              </button>

              {/* Features */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

