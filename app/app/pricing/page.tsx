import { Check, Sparkles, Zap, Star } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37] rounded-full mb-6">
          <Star className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-semibold text-[#D4AF37]">
            14-Day Free Trial · No Credit Card Required
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
          Everything Unlimited.<br />One Simple Price.
        </h1>

        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Stop paying 1-2% commission (₹1-3L per property). Get unlimited properties, AI-powered leads, and full automation for just ₹4,999/month.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#1e40af] p-8 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-3xl font-bold">Tharaga Pro</h2>
            </div>
            <p className="text-lg opacity-90">The only plan you'll ever need</p>
          </div>

          {/* Pricing */}
          <div className="p-8 text-center border-b border-slate-200">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <div className="text-sm text-slate-600 mb-2">Monthly</div>
                <div className="text-4xl font-bold text-slate-900">₹4,999</div>
                <div className="text-sm text-slate-600">per month</div>
              </div>

              <div className="text-slate-400 text-2xl">or</div>

              <div className="relative">
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                  Save 17%
                </div>
                <div className="text-sm text-slate-600 mb-2">Yearly</div>
                <div className="text-4xl font-bold text-emerald-600">₹4,166</div>
                <div className="text-sm text-slate-600">per month</div>
              </div>
            </div>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              Start 14-Day Free Trial
              <Zap className="w-5 h-5" />
            </Link>

            <p className="text-sm text-slate-500 mt-4">
              No credit card required · Cancel anytime
            </p>
          </div>

          {/* Features */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Unlimited property listings',
                'Unlimited AI-scored leads',
                'Unlimited team members',
                'Full CRM & pipeline management',
                'Email + WhatsApp automation',
                'SMS notifications',
                'Tamil + English voice search',
                'Advanced analytics dashboard',
                'RERA verification automation',
                'Bank loan integration',
                'Virtual property tours',
                '4-property comparison tool',
                'Priority support (2-hour response)',
                'WhatsApp support channel',
                'Phone support (callback)',
                'Dedicated account manager',
                'API access + webhooks',
                'White-label branding',
                'Custom domain',
                'Multi-location management',
                'Bulk property import/export',
                'Featured listings (unlimited)',
                'Custom integrations',
                '99.9% uptime SLA',
                'Free onboarding & training',
                'Free migration assistance',
                'Monthly business reviews',
                'Early access to new features'
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="mt-12 bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center">
            💰 Your Savings with Tharaga
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-sm text-amber-700 mb-2">Traditional Brokers</div>
              <div className="text-3xl font-bold text-red-600">₹12-16L</div>
              <div className="text-sm text-amber-700">per year (for 10 properties)</div>
            </div>

            <div>
              <div className="text-4xl text-amber-600 mb-4">→</div>
            </div>

            <div>
              <div className="text-sm text-amber-700 mb-2">Tharaga Pro</div>
              <div className="text-3xl font-bold text-emerald-600">₹60K</div>
              <div className="text-sm text-amber-700">per year (unlimited properties)</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-amber-200 text-center">
            <div className="text-lg font-bold text-amber-900 mb-2">
              You save ₹11-15 LAKHS annually! 🎉
            </div>
            <p className="text-sm text-amber-700">
              ROI paid back with just ONE property sale
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




