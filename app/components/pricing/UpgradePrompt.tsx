'use client';

import { X, ArrowUp, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface UpgradePromptProps {
  currentPlan: string;
  suggestedPlan: string;
  reason: string;
  priceDifference: number;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function UpgradePrompt({
  currentPlan,
  suggestedPlan,
  reason,
  priceDifference,
  onUpgrade,
  onDismiss
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <div className="fixed bottom-8 right-8 max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 animate-slide-up">
      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-slate-400" />
      </button>

      {/* Icon */}
      <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#1e40af] rounded-xl flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        Time to Upgrade?
      </h3>
      
      <p className="text-slate-600 mb-4">
        {reason}
      </p>

      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Current Plan</span>
          <span className="font-semibold text-slate-900">{currentPlan}</span>
        </div>
        <div className="flex items-center justify-center my-2">
          <ArrowUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Suggested Plan</span>
          <span className="font-bold text-emerald-600">{suggestedPlan}</span>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-sm text-slate-600 mb-1">Additional cost</div>
        <div className="text-2xl font-bold text-slate-900">
          +₹{(priceDifference / 100).toLocaleString('en-IN')}/month
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDismiss}
          className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
        >
          Maybe Later
        </button>
        <button
          onClick={onUpgrade}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}

