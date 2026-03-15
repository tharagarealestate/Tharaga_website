'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, ShieldX } from 'lucide-react'

// ─── Buyer-only gate — shown when a buyer account tries to access /builder ───

export function BuilderAuthGate({ variant = 'buyer' }: { variant?: 'buyer' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="buyer-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 overflow-hidden"
        >
          {/* Amber orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: [0, 60, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.15, 0.9, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]"
            />
            <motion.div
              animate={{ x: [0, -50, 30, 0], y: [0, 40, -50, 0], scale: [1, 0.85, 1.1, 1] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
              className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-red-600/6 blur-[140px]"
            />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(rgba(251,191,36,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.4) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative z-10 w-full max-w-sm mx-4"
          >
            {/* Red glow border for buyer */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-red-500/20 via-red-400/8 to-transparent" />

            <div className="relative rounded-2xl bg-zinc-900/80 backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
              {/* Top accent — red for buyer */}
              <div className="h-[2px] w-full bg-gradient-to-r from-red-500 via-red-400 to-red-600" />

              <div className="px-8 pt-8 pb-8">
                {/* Icon */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">Tharaga</p>
                    <h1 className="text-lg font-bold text-zinc-100 leading-tight">Builder Dashboard</h1>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-7">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldX className="w-4 h-4 text-red-400" />
                    <h2 className="text-sm font-medium text-red-400">Builders only</h2>
                  </div>
                  <p className="text-zinc-400 text-[14px] leading-relaxed">
                    This dashboard is exclusively for registered real estate builders. Your account is registered as a buyer.
                  </p>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => (window.location.href = '/property-listing')}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-200"
                  >
                    Browse Properties
                  </motion.button>
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 hover:border-zinc-600 bg-transparent hover:bg-zinc-800/40 transition-all duration-200"
                  >
                    Back to Homepage
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
