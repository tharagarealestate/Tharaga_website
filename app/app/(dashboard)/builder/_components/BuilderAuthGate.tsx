'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  Layers,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Zap,
} from 'lucide-react'
import { openAuthModal } from '@/components/auth/AuthModal'

const FEATURES = [
  { icon: Brain, label: 'AI Lead Scoring', desc: 'Instantly qualify every lead with behavioural signals' },
  { icon: Layers, label: 'Smart Pipeline', desc: '9-stage Kanban CRM with automated stage transitions' },
  { icon: BarChart3, label: 'Real-time Analytics', desc: 'Conversion funnels, heatmaps, revenue forecasting' },
  { icon: ShieldCheck, label: 'RERA Compliance', desc: 'Auto-verify Tamil Nadu project registrations' },
]

const STATS = [
  { value: '0%', label: 'Commission' },
  { value: '27+', label: 'Properties' },
  { value: 'AI', label: 'Powered' },
]

type GateVariant = 'unauthenticated' | 'no-profile'

interface BuilderAuthGateProps {
  variant?: GateVariant
}

export function BuilderAuthGate({ variant = 'unauthenticated' }: BuilderAuthGateProps) {
  const [visible, setVisible] = useState(false)

  // Slight delay so the gate fades in — feels intentional, not a flash
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="auth-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 overflow-hidden"
        >
          {/* ── Animated orbs ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: [0, 60, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.15, 0.9, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]"
            />
            <motion.div
              animate={{ x: [0, -50, 30, 0], y: [0, 40, -50, 0], scale: [1, 0.85, 1.1, 1] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
              className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-600/8 blur-[140px]"
            />
            <motion.div
              animate={{ x: [0, 30, -20, 0], y: [0, -30, 60, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
              className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-400/5 blur-[100px]"
            />
            {/* CSS grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(rgba(251,191,36,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.4) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          {/* ── Main card ── */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            {/* Amber glow border */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/30 via-amber-400/10 to-transparent" />

            <div className="relative rounded-2xl bg-zinc-900/80 backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
              {/* Top accent bar */}
              <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

              <div className="px-8 pt-8 pb-6">
                {/* Icon + badge */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">Tharaga</p>
                      <h1 className="text-lg font-bold text-zinc-100 leading-tight">Builder Dashboard</h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-3 py-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-medium text-zinc-400">AI-Powered</span>
                  </div>
                </div>

                {/* Headline */}
                <div className="mb-6">
                  {variant === 'unauthenticated' ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-zinc-500" />
                        <h2 className="text-sm font-medium text-zinc-500">Sign in to continue</h2>
                      </div>
                      <p className="text-zinc-300 text-[15px] leading-relaxed">
                        Access your AI-powered real estate command centre — manage leads, listings, and automations from one place.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="w-4 h-4 text-amber-400" />
                        <h2 className="text-sm font-medium text-amber-400">Complete your setup</h2>
                      </div>
                      <p className="text-zinc-300 text-[15px] leading-relaxed">
                        Your account is ready. Complete your builder profile to unlock the full dashboard.
                      </p>
                    </>
                  )}
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-7">
                  {FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="group rounded-xl bg-zinc-800/40 border border-zinc-700/30 p-3 hover:border-amber-500/20 hover:bg-zinc-800/70 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-zinc-200">{label}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-snug">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-7 px-1">
                  {STATS.map(({ value, label }, i) => (
                    <div key={label} className="flex items-center gap-3">
                      {i > 0 && <div className="w-px h-6 bg-zinc-700/50" />}
                      <div className="text-center">
                        <div className="text-base font-bold text-amber-400">{value}</div>
                        <div className="text-[10px] text-zinc-500">{label}</div>
                      </div>
                    </div>
                  ))}
                  <div className="ml-auto flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] text-zinc-400">RERA Verified</span>
                  </div>
                </div>

                {/* CTAs */}
                {variant === 'unauthenticated' ? (
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => openAuthModal()}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-200"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in to Builder Dashboard
                    </motion.button>
                    <button
                      onClick={() => openAuthModal()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 hover:border-zinc-600 bg-transparent hover:bg-zinc-800/40 transition-all duration-200"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Start 14-day free trial — no card required
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => (window.location.href = '/onboard')}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    Complete Builder Profile
                  </motion.button>
                )}
              </div>

              {/* Bottom note */}
              <div className="px-8 py-4 border-t border-zinc-800/60 bg-zinc-950/30">
                <p className="text-[11px] text-zinc-600 text-center">
                  By signing in you agree to our{' '}
                  <a href="/terms" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
