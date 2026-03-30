'use client';

import { useEffect, useState } from 'react';
import { Clock, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TrialData {
  daysRemaining: number;
  totalDays: number;
  trialEndsAt: string;
  healthScore: number;
  propertiesAdded: number;
  leadsReceived: number;
}

export function TrialProgressWidget() {
  const router = useRouter();
  const [trial, setTrial] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrialData();
  }, []);

  const loadTrialData = async () => {
    try {
      const response = await fetch('/api/subscription/trial-status');
      const data = await response.json();
      
      if (data.success && data.trial) {
        const endsAt = new Date(data.trial.trialEndsAt);
        const now = new Date();
        const daysRemaining = Math.ceil(
          (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        setTrial({
          daysRemaining,
          totalDays: 14,
          trialEndsAt: data.trial.trialEndsAt,
          healthScore: data.trial.healthScore || 0,
          propertiesAdded: data.trial.propertiesAdded || 0,
          leadsReceived: data.trial.leadsReceived || 0
        });
      }
    } catch (error) {
      console.error('Failed to load trial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-40 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (!trial) return null;

  const progressPercentage = ((14 - trial.daysRemaining) / 14) * 100;
  const isUrgent = trial.daysRemaining <= 3;

  return (
    <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#1e40af]/10 rounded-2xl shadow-sm border-2 border-[#D4AF37] p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-slate-900">Free Trial Active</h3>
          </div>
          <p className="text-sm text-slate-600">
            {trial.daysRemaining} {trial.daysRemaining === 1 ? 'day' : 'days'} remaining
          </p>
        </div>

        <div className={`px-4 py-2 rounded-xl font-bold ${
          isUrgent 
            ? 'bg-red-100 text-red-700' 
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {trial.daysRemaining} Days Left
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Trial Progress</span>
          <span className="text-sm font-bold text-[#1e40af]">
            {Math.round(progressPercentage)}%
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#1e40af] rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="text-xs text-slate-500 mt-2">
          Trial ends on {new Date(trial.trialEndsAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4">
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {trial.propertiesAdded}
          </div>
          <div className="text-sm text-slate-600">Properties Added</div>
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-600 mb-1">
            {trial.leadsReceived}
          </div>
          <div className="text-sm text-slate-600">Leads Received</div>
        </div>
      </div>

      {/* Health Score */}
      <div className="mb-6 p-4 bg-white rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Engagement Score</span>
          <span className={`text-lg font-bold ${
            trial.healthScore >= 80 ? 'text-emerald-600' :
            trial.healthScore >= 60 ? 'text-amber-600' :
            'text-slate-600'
          }`}>
            {trial.healthScore}/100
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              trial.healthScore >= 80 ? 'bg-emerald-500' :
              trial.healthScore >= 60 ? 'bg-amber-500' :
              'bg-slate-400'
            }`}
            style={{ width: `${trial.healthScore}%` }}
          />
        </div>

        {trial.healthScore < 40 && (
          <p className="text-xs text-slate-500 mt-2">
            💡 Add more properties and explore features to get the most from your trial!
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push('/builder/upgrade')}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
          isUrgent
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg animate-pulse'
            : 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white hover:shadow-lg'
        }`}
      >
        {isUrgent ? 'Convert Now - Trial Ending Soon!' : 'Upgrade to Tharaga Pro'}
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Features List */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="text-sm font-semibold text-slate-900 mb-3">
          What you get with Tharaga Pro:
        </div>
        <div className="space-y-2">
          {[
            'Unlimited property listings',
            'Unlimited AI-scored leads',
            'Full automation (Email + WhatsApp)',
            'Advanced analytics dashboard',
            'Priority support (2-hour response)'
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




