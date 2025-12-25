'use client';

import { useEffect, useState } from 'react';
import { Home, TrendingUp, AlertTriangle, ArrowUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuotaData {
  currentUsage: number;
  limit: number | null;
  percentage: number;
  planName: string;
  isOverQuota: boolean;
}

export function QuotaUsageWidget() {
  const router = useRouter();
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuota();
  }, []);

  const loadQuota = async () => {
    try {
      const response = await fetch('/api/pricing/check-quota');
      const data = await response.json();
      
      if (data.success) {
        const { currentCount, limit, planName } = data.quota;
        const percentage = limit ? (currentCount / limit) * 100 : 0;
        
        setQuota({
          currentUsage: currentCount,
          limit,
          percentage,
          planName: planName || 'Starter',
          isOverQuota: limit ? currentCount >= limit : false
        });
      }
    } catch (error) {
      console.error('Failed to load quota:', error);
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

  if (!quota) return null;

  const isNearLimit = quota.limit && quota.percentage >= 80;
  const isAtLimit = quota.limit && quota.percentage >= 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isAtLimit ? 'bg-red-100' :
            isNearLimit ? 'bg-amber-100' :
            'bg-emerald-100'
          }`}>
            <Home className={`w-6 h-6 ${
              isAtLimit ? 'text-red-600' :
              isNearLimit ? 'text-amber-600' :
              'text-emerald-600'
            }`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Property Quota</h3>
            <p className="text-sm text-slate-600">{quota.planName} Plan</p>
          </div>
        </div>

        {isNearLimit && (
          <button
            onClick={() => router.push('/builder/billing')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <ArrowUp className="w-4 h-4" />
            Upgrade
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {quota.currentUsage} of {quota.limit || '∞'} properties used
          </span>
          {quota.limit && (
            <span className={`text-sm font-bold ${
              isAtLimit ? 'text-red-600' :
              isNearLimit ? 'text-amber-600' :
              'text-emerald-600'
            }`}>
              {Math.round(quota.percentage)}%
            </span>
          )}
        </div>

        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-gradient-to-r from-red-500 to-red-600' :
              isNearLimit ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
              'bg-gradient-to-r from-emerald-500 to-emerald-600'
            }`}
            style={{ width: `${Math.min(quota.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Alert Messages */}
      {isAtLimit && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-900 mb-1">
              Property Limit Reached
            </div>
            <p className="text-sm text-red-700">
              You've reached your property limit. Upgrade your plan to add more properties.
            </p>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900 mb-1">
              Approaching Property Limit
            </div>
            <p className="text-sm text-amber-700">
              You're using {Math.round(quota.percentage)}% of your quota. Consider upgrading soon.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-2xl font-bold text-slate-900">{quota.currentUsage}</div>
          <div className="text-xs text-slate-600 mt-1">Active</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-2xl font-bold text-slate-900">
            {quota.limit ? quota.limit - quota.currentUsage : '∞'}
          </div>
          <div className="text-xs text-slate-600 mt-1">Remaining</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-2xl font-bold text-emerald-600">
            {quota.limit || '∞'}
          </div>
          <div className="text-xs text-slate-600 mt-1">Limit</div>
        </div>
      </div>
    </div>
  );
}

