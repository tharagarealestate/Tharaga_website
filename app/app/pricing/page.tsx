"use client"
import { Check, Sparkles, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { PremiumButton } from '@/components/ui/premium-button';
import { GlassCard } from '@/components/ui/glass-card';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { TrustBadge } from '@/components/ui/trust-badge';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const [buttonLoading, setButtonLoading] = useState(false);
  // Set countdown to 48 hours from now
  const countdownTarget = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Hide login/signup button on pricing page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.AUTH_HIDE_HEADER = true;
      window.AUTH_NO_HEADER = true;
      
      // Also hide the auth container directly
      const authContainer = document.getElementById('site-header-auth-container');
      if (authContainer) {
        authContainer.style.display = 'none';
        authContainer.style.visibility = 'hidden';
      }
      
      const authWrap = document.querySelector('.thg-auth-wrap');
      if (authWrap) {
        (authWrap as HTMLElement).style.display = 'none';
        (authWrap as HTMLElement).style.visibility = 'hidden';
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.AUTH_HIDE_HEADER = false;
        window.AUTH_NO_HEADER = false;
      }
    };
  }, []);

  return (
    <PageWrapper>
      <main className="py-6 sm:py-8">
        {/* Header */}
        <PageHeader
          title="Everything Unlimited. One Simple Price."
          description="Stop paying 1-2% commission (₹1-3L per property). Get unlimited properties, AI-powered leads, and full automation for just ₹4,999/month."
          emoji="💰"
          actions={
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 glow-border rounded-full">
                <Star className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-amber-300">
                  14-Day Free Trial · No Credit Card Required
                </span>
              </div>
              <CountdownTimer
                targetDate={countdownTarget}
                variant="urgent"
                className="text-xs"
              />
            </div>
          }
        />

        {/* Pricing Card */}
        <div className="space-y-6">
          <GlassCard variant="dark" glow border className="overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b glow-border border-b-amber-300/25 p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <h2 className="text-3xl font-bold text-white">Tharaga Pro</h2>
              </div>
              <p className="text-lg text-slate-300">The only plan you'll ever need</p>
            </div>

            {/* Pricing */}
            <div className="p-8 text-center border-b glow-border border-b-amber-300/25">
              <div className="flex items-center justify-center gap-8 mb-6 flex-wrap">
                <div>
                  <div className="text-sm text-slate-400 mb-2">Monthly</div>
                  <div className="text-4xl font-bold text-white">₹4,999</div>
                  <div className="text-sm text-slate-400">per month</div>
                </div>

                <div className="text-slate-400 text-2xl">or</div>

                <div className="relative">
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full glow-border">
                    Save 17%
                  </div>
                  <div className="text-sm text-slate-400 mb-2">Yearly</div>
                  <div className="text-4xl font-bold text-green-300">₹4,166</div>
                  <div className="text-sm text-slate-400">per month</div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PremiumButton
                  variant="gold"
                  size="lg"
                  shimmer
                  loading={buttonLoading}
                  onClick={() => setButtonLoading(true)}
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link 
                    href="/signup" 
                    className="inline-flex items-center gap-2"
                    onClick={() => setButtonLoading(true)}
                  >
                    Start 14-Day Free Trial
                    <Zap className="w-5 h-5" />
                  </Link>
                </PremiumButton>
              </motion.div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-400">
                  No credit card required · Cancel anytime
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <TrustBadge type="verified" label="100% Secure" size="sm" />
                  <TrustBadge type="certified" label="RERA Certified" size="sm" />
                  <TrustBadge type="award" label="Trusted by 500+ Builders" size="sm" />
                </div>
              </div>
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
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-start gap-3 group"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.02 + 0.1, type: 'spring' }}
                    >
                      <Check className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    </motion.div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* ROI Calculator */}
          <GlassCard variant="dark" glow border className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              💰 Your Savings with Tharaga
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-sm text-slate-400 mb-2">Traditional Brokers</div>
                <div className="text-3xl font-bold text-red-400">₹12-16L</div>
                <div className="text-sm text-slate-400">per year (for 10 properties)</div>
              </div>

              <div>
                <div className="text-4xl text-amber-300 mb-4">→</div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-2">Tharaga Pro</div>
                <div className="text-3xl font-bold text-green-300">₹60K</div>
                <div className="text-sm text-slate-400">per year (unlimited properties)</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t glow-border border-t-amber-300/25 text-center">
              <div className="text-lg font-bold text-white mb-2">
                You save ₹11-15 LAKHS annually! 🎉
              </div>
              <p className="text-sm text-slate-300">
                ROI paid back with just ONE property sale
              </p>
            </div>
          </GlassCard>
        </div>
      </main>
    </PageWrapper>
  );
}




