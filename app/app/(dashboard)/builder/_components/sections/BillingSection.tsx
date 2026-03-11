"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Check, Zap, Shield, Clock,
  Loader2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink,
  Calendar, TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrialStatus } from '../TrialStatusManager'

// ─── Types ───────────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'yearly'
type CheckoutState = 'idle' | 'loading' | 'open' | 'verifying' | 'success' | 'error'

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void
      on(event: string, handler: (response: unknown) => void): void
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface BillingSectionProps {
  onNavigate?: (section: string) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BillingSection({ onNavigate }: BillingSectionProps) {
  const trialStatus = useTrialStatus()

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isSubscribed = !trialStatus.isTrial && !trialStatus.isExpired

  const proFeatures = [
    'Unlimited property listings',
    'Unlimited AI-scored leads',
    'Unlimited team members',
    'Full CRM & pipeline management',
    'Email + WhatsApp automation',
    'Advanced analytics dashboard',
    'RERA verification automation',
    'Bank loan integration',
    'Virtual property tours',
    'Priority support (2-hour response)',
    'API access + webhooks',
    'Dedicated account manager',
  ]

  // ─── Checkout Handler ───────────────────────────────────────────────────────

  const handleUpgrade = useCallback(async () => {
    if (checkoutState !== 'idle') return
    setCheckoutState('loading')
    setErrorMsg(null)

    try {
      // 1. Load Razorpay checkout.js
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Payment gateway failed to load. Please try again.')

      // 2. Create subscription on backend
      const res = await fetch('/api/rzp/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_cycle: billingCycle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not initiate payment')

      // 3. Open Razorpay checkout modal
      setCheckoutState('open')

      const rzp = new window.Razorpay({
        key: data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscription_id,
        name: 'Tharaga',
        description: billingCycle === 'yearly'
          ? 'Tharaga Pro — ₹4,166/mo billed yearly'
          : 'Tharaga Pro — ₹4,999/month',
        image: 'https://tharaga.co.in/logo.svg',
        prefill: data.prefill || {},
        theme: { color: '#f59e0b' },
        modal: {
          backdropclose: false,
          ondismiss: () => {
            setCheckoutState('idle')
          },
        },
        handler: async (response: RazorpayResponse) => {
          // 4. Verify payment signature on backend
          setCheckoutState('verifying')
          try {
            const verify = await fetch('/api/rzp/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            })
            const vData = await verify.json()
            if (!verify.ok) throw new Error(vData.error || 'Payment verification failed')

            setCheckoutState('success')

            // Reload after 2.5s to refresh subscription status throughout the app
            setTimeout(() => {
              window.location.reload()
            }, 2500)
          } catch (verifyErr: unknown) {
            setCheckoutState('error')
            setErrorMsg(
              verifyErr instanceof Error
                ? verifyErr.message
                : 'Payment received but verification failed. Please contact support.'
            )
          }
        },
      })

      rzp.on('payment.failed', (response: unknown) => {
        const r = response as { error?: { description?: string } }
        setCheckoutState('error')
        setErrorMsg(r?.error?.description || 'Payment failed. Please try again.')
      })

      rzp.open()
    } catch (err: unknown) {
      setCheckoutState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }, [billingCycle, checkoutState])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Billing</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your subscription and payments</p>
      </div>

      {/* Current Plan Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {isSubscribed
                  ? 'Tharaga Pro — Active'
                  : trialStatus.isExpired
                    ? 'Trial Expired'
                    : '14-Day Free Trial'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isSubscribed
                  ? 'Subscription active'
                  : trialStatus.isExpired
                    ? 'Upgrade to continue using Tharaga'
                    : trialStatus.formattedDaysLeft}
              </p>
            </div>
          </div>
          {trialStatus.isTrial && !trialStatus.isExpired && (
            <div className={cn(
              'flex items-center gap-1.5',
              trialStatus.isUrgent ? 'text-red-400' : 'text-amber-400'
            )}>
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{trialStatus.formattedDaysLeft}</span>
            </div>
          )}
          {isSubscribed && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Pro</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Billing Cycle Toggle — only shown when not yet subscribed */}
      {!isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-center"
        >
          <div className="flex items-center gap-1 p-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                billingCycle === 'monthly'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                billingCycle === 'yearly'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Yearly
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md leading-none flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" />
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Tharaga Pro Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-zinc-900/60 border border-amber-500/40 ring-1 ring-amber-500/20 rounded-xl p-6 relative"
      >
        {/* Plan badge */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded-full whitespace-nowrap">
          The Only Plan You Need
        </div>

        {/* Plan header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Tharaga Pro</h3>
              <p className="text-xs text-zinc-500">Everything unlimited. No hidden limits.</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={billingCycle}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-100">
                    {billingCycle === 'yearly' ? '₹4,166' : '₹4,999'}
                  </span>
                  <span className="text-sm text-zinc-500">/month</span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    ₹49,992 billed yearly
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 mt-0.5">Billed monthly</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {proFeatures.map(feature => (
            <div key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {/* CTA / State area */}
        {isSubscribed ? (
          <div className="flex items-center gap-2 py-2.5 px-4 bg-zinc-800/60 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-zinc-300 font-medium">You're on Tharaga Pro</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Success state */}
            <AnimatePresence mode="wait">
              {checkoutState === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 py-3 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Welcome to Tharaga Pro!</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Reloading your dashboard…</p>
                  </div>
                </motion.div>
              )}

              {/* Error state */}
              {checkoutState === 'error' && errorMsg && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-red-400">{errorMsg}</p>
                    <button
                      onClick={() => { setCheckoutState('idle'); setErrorMsg(null) }}
                      className="mt-1.5 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Try again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main CTA */}
            {checkoutState !== 'success' && (
              <button
                onClick={handleUpgrade}
                disabled={checkoutState !== 'idle'}
                className={cn(
                  'w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  checkoutState === 'idle'
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'bg-amber-500/50 text-zinc-950/70 cursor-not-allowed'
                )}
              >
                {checkoutState === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {checkoutState === 'verifying' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {checkoutState === 'open' && (
                  <ExternalLink className="w-4 h-4" />
                )}
                {checkoutState === 'idle' && (
                  <Zap className="w-4 h-4" />
                )}

                {checkoutState === 'idle' && (
                  billingCycle === 'yearly'
                    ? 'Upgrade to Pro — ₹49,992/year'
                    : 'Upgrade to Pro — ₹4,999/month'
                )}
                {checkoutState === 'loading' && 'Opening payment gateway…'}
                {checkoutState === 'open' && 'Complete payment in popup…'}
                {checkoutState === 'verifying' && 'Verifying payment…'}
                {checkoutState === 'error' && (
                  billingCycle === 'yearly'
                    ? 'Retry — ₹49,992/year'
                    : 'Retry — ₹4,999/month'
                )}
              </button>
            )}

            {/* Savings note */}
            {billingCycle === 'monthly' && checkoutState === 'idle' && (
              <p className="text-center text-xs text-zinc-500">
                Switch to yearly and save <span className="text-emerald-400 font-medium">₹9,996/year</span>
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Security & trust strip */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-xs text-zinc-500">
          Payments processed securely by{' '}
          <span className="text-zinc-300 font-medium">Razorpay</span> (PCI DSS Level 1).
          Cancel anytime — no questions asked.
        </p>
      </div>
    </div>
  )
}
