'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Check, Sparkles, Zap, ArrowRight, Shield, Award, Building2,
  TrendingUp, Users, MessageSquare, Brain, BarChart3, Star,
  CheckCircle2, Timer, Infinity,
} from 'lucide-react'

// ── Neural Background ─────────────────────────────────────────────────────────
function NeuralBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px]"
        style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.06) 0%,transparent 65%)' }}
      />
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'rgba(251,191,36,0.05)', top: '8%', left: '1%', animation: 'tool-orb-1 22s ease-in-out infinite' }}
      />
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'rgba(16,185,129,0.04)', bottom: '15%', right: '3%', animation: 'tool-orb-2 30s ease-in-out infinite' }}
      />
    </div>
  )
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const calc = useCallback(() => {
    const diff = targetDate.getTime() - Date.now()
    if (diff <= 0) return { h: 0, m: 0, s: 0 }
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }, [targetDate])
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(t)
  }, [calc])
  return time
}

function CountdownBadge({ targetDate }: { targetDate: Date }) {
  const { h, m, s } = useCountdown(targetDate)
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
      <Timer className="w-3 h-3" />
      <span>Offer ends in</span>
      <span className="font-mono">
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </div>
  )
}

// ── Feature data ──────────────────────────────────────────────────────────────
const features = [
  { icon: Infinity,     label: 'Unlimited property listings'            },
  { icon: Brain,        label: 'Unlimited AI-scored leads'              },
  { icon: Users,        label: 'Unlimited team members'                 },
  { icon: BarChart3,    label: 'Full CRM & pipeline management'         },
  { icon: MessageSquare,label: 'Email + WhatsApp automation'            },
  { icon: Zap,          label: 'SMS notifications'                      },
  { icon: Building2,    label: 'Tamil + English voice search'           },
  { icon: TrendingUp,   label: 'Advanced analytics dashboard'           },
  { icon: Shield,       label: 'RERA verification automation'           },
  { icon: Building2,    label: 'Bank loan integration'                  },
  { icon: Star,         label: 'Virtual property tours'                 },
  { icon: BarChart3,    label: '4-property comparison tool'             },
  { icon: Check,        label: 'Priority support (2-hour response)'     },
  { icon: MessageSquare,label: 'WhatsApp support channel'               },
  { icon: Check,        label: 'Phone support (callback)'               },
  { icon: Users,        label: 'Dedicated account manager'              },
  { icon: Zap,          label: 'API access + webhooks'                  },
  { icon: Award,        label: 'White-label branding'                   },
  { icon: Globe2,       label: 'Custom domain'                          },
  { icon: Building2,    label: 'Multi-location management'              },
  { icon: Check,        label: 'Bulk property import/export'            },
  { icon: Star,         label: 'Featured listings (unlimited)'          },
  { icon: Check,        label: 'Custom integrations'                    },
  { icon: Shield,       label: '99.9% uptime SLA'                       },
  { icon: Check,        label: 'Free onboarding & training'             },
  { icon: Check,        label: 'Free migration assistance'              },
  { icon: BarChart3,    label: 'Monthly business reviews'               },
  { icon: Sparkles,     label: 'Early access to new features'           },
]

// ── Globe2 placeholder (not in lucide bundle used here) ──────────────────────
function Globe2(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx={12} cy={12} r={10} /><line x1={2} y1={12} x2={22} y2={12} />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const countdownTarget = new Date(Date.now() + 48 * 60 * 60 * 1000)

  const price     = billing === 'monthly' ? 4999 : 4166
  const subLabel  = billing === 'yearly'  ? '/mo · billed ₹49,999/yr' : '/month'

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <NeuralBg />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              Tharaga Pro — Chennai&apos;s #1 Builder Platform
            </div>
            <CountdownBadge targetDate={countdownTarget} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-5"
          >
            Everything Unlimited.
            <span className="block mt-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 bg-clip-text text-transparent">
              One Simple Price.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45 }}
            className="max-w-xl mx-auto text-base text-zinc-400 leading-relaxed mb-6"
          >
            Stop paying 1–2% commission (₹1–3L per property). Get unlimited properties,
            AI-powered leads, and full automation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold"
          >
            <CheckCircle2 className="w-3 h-3" />
            14-Day Free Trial · No Credit Card Required
          </motion.div>
        </div>

        {/* ── Plan Card ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-amber-500/25 shadow-2xl shadow-amber-500/[0.08] mb-8"
        >
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.07) 0%,transparent 65%)' }}
          />

          {/* Header */}
          <div className="relative p-8 sm:p-10 border-b border-white/[0.06]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-100">Tharaga Pro</h2>
                  <p className="text-xs text-zinc-500">The only plan you&apos;ll ever need</p>
                </div>
              </div>

              {/* Billing toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-xl border border-white/[0.07]">
                {(['monthly', 'yearly'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBilling(b)}
                    className={[
                      'relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                      billing === b
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-zinc-500 hover:text-zinc-300',
                    ].join(' ')}
                  >
                    {b.charAt(0).toUpperCase() + b.slice(1)}
                    {b === 'yearly' && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                        -17%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="relative p-8 sm:p-10 border-b border-white/[0.06] text-center">
            <div className="mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={billing}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-end justify-center gap-1.5">
                    <span className="text-2xl font-bold text-zinc-400 mb-1">₹</span>
                    <span className="text-6xl font-black text-amber-400 leading-none">
                      {price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm mt-1">{subLabel}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                setLoading(true)
                window.location.href = '/builder'
              }}
              disabled={loading}
              className={[
                'inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200',
                'bg-amber-500 hover:bg-amber-400 text-black',
                'hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98]',
                loading && 'opacity-70 cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start 14-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-zinc-600 mt-3">No credit card required · Cancel anytime</p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {[
                { icon: Shield,        label: '100% Secure',               color: 'text-emerald-400' },
                { icon: CheckCircle2,  label: 'RERA Certified',            color: 'text-amber-400'   },
                { icon: Award,         label: "Chennai's #1 Platform",     color: 'text-amber-400'   },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className={`flex items-center gap-1 text-[11px] font-medium ${color}`}>
                  <Icon className="w-3 h-3" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Features grid */}
          <div className="relative p-8 sm:p-10">
            <p className="text-xs uppercase tracking-widest text-zinc-600 font-semibold mb-6">
              Everything included
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.015, duration: 0.3 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      {f.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ── ROI Calculator ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl p-8 sm:p-10 bg-white/[0.02] backdrop-blur-xl border border-white/[0.07] overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black">Your Savings with Tharaga</h3>
              <p className="text-xs text-zinc-500">ROI vs traditional broker fees</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
            {/* Traditional */}
            <div className="relative rounded-2xl p-6 bg-red-500/[0.04] border border-red-500/15">
              <div className="text-[11px] uppercase tracking-widest text-zinc-600 mb-2 font-semibold">Traditional Brokers</div>
              <div className="text-3xl font-black text-red-400">₹12–16L</div>
              <div className="text-xs text-zinc-500 mt-1">per year (10 properties)</div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-8 h-8 text-amber-400" />
                <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Switch</span>
              </div>
            </div>

            {/* Tharaga */}
            <div className="relative rounded-2xl p-6 bg-emerald-500/[0.04] border border-emerald-500/15">
              <div className="text-[11px] uppercase tracking-widest text-zinc-600 mb-2 font-semibold">Tharaga Pro</div>
              <div className="text-3xl font-black text-emerald-400">₹60K</div>
              <div className="text-xs text-zinc-500 mt-1">per year (unlimited)</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
            <div className="text-xl font-black text-zinc-100 mb-1">
              You save <span className="text-amber-400">₹11–15 LAKHS</span> annually
            </div>
            <p className="text-sm text-zinc-500">ROI paid back with just ONE property sale</p>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
