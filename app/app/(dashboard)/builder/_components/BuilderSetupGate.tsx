'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface BuilderSetupGateProps {
  userId: string
  userEmail: string
  onSuccess: () => void
}

export function BuilderSetupGate({ userId, userEmail, onSuccess }: BuilderSetupGateProps) {
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabase()
      const { error: insertError } = await supabase
        .from('builder_profiles')
        .insert({ user_id: userId, company_name: companyName.trim() })

      if (insertError) throw insertError

      setDone(true)
      // Small delay so user sees success, then re-check auth
      setTimeout(() => onSuccess(), 900)
    } catch (err: any) {
      setError(err.message || 'Failed to create profile. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Amber orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-600/8 blur-[140px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(251,191,36,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Amber glow border */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/30 via-amber-400/10 to-transparent" />

        <div className="relative rounded-2xl bg-zinc-900/80 backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
          {/* Top accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          <div className="px-8 pt-8 pb-8">
            {/* Icon */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">Tharaga</p>
                <h1 className="text-lg font-bold text-zinc-100 leading-tight">Builder Registration</h1>
              </div>
            </div>

            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-zinc-200 font-semibold">Profile created!</p>
                <p className="text-zinc-500 text-sm text-center">Loading your dashboard…</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                    You're signed in as <span className="text-zinc-200">{userEmail}</span>. Complete your builder profile to access the dashboard.
                  </p>

                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Prestige Constructions"
                    autoFocus
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                  {error && (
                    <p className="text-red-400 text-xs mt-2">{error}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.015 }}
                  whileTap={{ scale: loading ? 1 : 0.985 }}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Create Builder Profile
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => (window.location.href = '/')}
                  className="w-full py-2.5 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Back to Homepage
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
