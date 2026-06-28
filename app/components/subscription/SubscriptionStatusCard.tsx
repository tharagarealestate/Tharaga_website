'use client';

import { useEffect, useState } from 'react';
import { Check, Calendar, CreditCard, AlertCircle } from 'lucide-react';

interface SubscriptionStatus {
  status: string;
  isTrial: boolean;
  billingCycle: string;
  price: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionStatusCard() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      if (data.success && data.subscription.hasSubscription) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-32 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (!subscription || subscription.isTrial) return null;

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toLocaleString('en-IN')}`;
  };

  const nextBillingDate = new Date(subscription.currentPeriodEnd || new Date());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#1e40af] rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Tharaga Pro</h3>
          </div>
          <p className="text-sm text-slate-600">Active subscription</p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {formatPrice(subscription.price)}
          </div>
          <div className="text-sm text-slate-600">per {subscription.billingCycle}</div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <Calendar className="w-5 h-5 text-slate-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-700">Next billing date</div>
            <div className="text-sm text-slate-900">
              {nextBillingDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <CreditCard className="w-5 h-5 text-slate-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-700">Billing cycle</div>
            <div className="text-sm text-slate-900 capitalize">{subscription.billingCycle}</div>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-900 mb-1">
                Subscription Ending
              </div>
              <p className="text-sm text-red-700">
                Your subscription will end on {nextBillingDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
        {subscription.billingCycle === 'monthly' && (
          <button className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            Switch to Yearly (Save 17%)
          </button>
        )}

        <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all">
          Manage Subscription
        </button>
      </div>
    </div>
  );
}




