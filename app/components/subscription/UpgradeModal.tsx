'use client';

import { useState } from 'react';
import { X, Sparkles, Check, Zap } from 'lucide-react';
import Script from 'next/script';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const monthlyPrice = 499900; // ₹4,999 in paise
  const yearlyPrice = 4999200; // ₹49,992 in paise (₹4,166/mo)
  
  const price = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
  const displayPrice = billingCycle === 'monthly' 
    ? '₹4,999/month' 
    : '₹4,166/month (billed yearly)';
  
  const savings = billingCycle === 'yearly' ? '₹9,996' : null;

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      // Convert trial to paid
      const response = await fetch('/api/subscription/convert-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Conversion failed');
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.razorpaySubscriptionId,
        name: 'Tharaga',
        description: `Tharaga Pro - ${billingCycle}`,
        image: '/logo.png',
        handler: function (response: any) {
          // Payment successful
          console.log('Payment successful:', response);
          onSuccess();
          onClose();
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#D4AF37'
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded');
      }

    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(error.message || 'Failed to upgrade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#1e40af] rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Upgrade to Tharaga Pro</h2>
                <p className="text-sm text-slate-600">Everything unlimited. One simple price.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`relative px-8 py-4 rounded-xl font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                  Save 17%
                </span>
              </button>
            </div>

            {/* Price Display */}
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-slate-900 mb-2">
                {displayPrice.split('/')[0]}
                <span className="text-2xl text-slate-600">/month</span>
              </div>
              {savings && (
                <div className="text-emerald-600 font-semibold">
                  Save {savings} annually
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-lg font-bold text-slate-900">Everything Included:</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Unlimited property listings',
                  'Unlimited AI-scored leads',
                  'Full CRM & pipeline management',
                  'Email + WhatsApp automation',
                  'Tamil + English voice search',
                  'Advanced analytics dashboard',
                  'RERA verification automation',
                  'Priority support (2-hour response)',
                  'API access + webhooks',
                  'White-label branding',
                  'Custom domain',
                  'Unlimited team members',
                  'Bulk property import/export',
                  '99.9% uptime SLA',
                  'Free monthly business review',
                  'Dedicated account manager'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-900">100+ builders already using Tharaga</span>
              </div>
              <p className="text-sm text-amber-700">
                Save ₹10-15L annually vs traditional broker commissions
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Subscribe - ${displayPrice}`}
            </button>

            {/* Money-back guarantee */}
            <p className="text-center text-sm text-slate-500 mt-4">
              🔒 Secure payment via Razorpay · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </>
  );
}




