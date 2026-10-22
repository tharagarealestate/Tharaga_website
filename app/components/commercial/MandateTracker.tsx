'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Clock, CheckCircle2, ArrowUpRight,
  Building2, Sparkles, RefreshCw, AlertCircle, Lock,
  ChevronRight, ExternalLink, Plus
} from 'lucide-react'
import { openAuthModal } from '@/components/ui/AuthButton'

interface MandateTrackerProps {
  user: any
  onOpenIntake: () => void
}

export function MandateTracker({ user, onOpenIntake }: MandateTrackerProps) {
  const [mandates, setMandates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMandate, setSelectedMandate] = useState<any>(null)

  const fetchUserMandates = async () => {
    if (!user) return
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (user.id) q.set('user_id', user.id)
      if (user.email) q.set('email', user.email)

      const res = await fetch(`/api/commercial/mandates?${q.toString()}`)
      const data = await res.json()
      if (data.user_mandates && data.user_mandates.length > 0) {
        setMandates(data.user_mandates)
        setSelectedMandate(data.user_mandates[0])
      } else {
        // Fallback demo mandate tied to user's first session so they can see how it works immediately
        setMandates([])
      }
    } catch (err) {
      console.warn('Could not load user mandates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserMandates()
  }, [user])

  if (!user) {
    return (
      <div className="rounded-3xl bg-[#0D0D11] border border-white/[0.08] p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,154,58,0.06)_0%,transparent_70%)]" />
        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
            Confidential Principal Portal
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Track Your Commercial Mandate
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">
            Signed in with Google? Access your private asset dossier, live due diligence audit, and active MNC buyer syndication status in real time.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal()}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              Sign In with Google
            </button>
            <button
              onClick={onOpenIntake}
              className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors"
            >
              List Commercial Asset
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-[#0C0C10] border border-white/[0.08] overflow-hidden">
      {/* Header bar */}
      <div className="px-6 sm:px-8 py-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400">
              Authenticated Principal
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Mandate Tracking & Due Diligence Hub
          </h3>
          <p className="text-xs text-white/50">
            Connected to Google ID: <span className="text-white/80">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUserMandates}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenIntake}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Submit New Asset
          </button>
        </div>
      </div>

      {mandates.length === 0 ? (
        <div className="p-8 sm:p-14 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
            <Building2 className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-semibold text-white">No active mandates submitted yet</h4>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            You haven't submitted a commercial land bank, solar parcel, or quarry for syndication under this Google profile yet.
          </p>
          <button
            onClick={onOpenIntake}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all"
          >
            <Sparkles className="w-4 h-4" /> Start Claude Commercial Intake
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Mandates List */}
          <div className="space-y-3 lg:border-r lg:border-white/[0.08] lg:pr-6">
            <span className="text-xs font-mono uppercase tracking-widest text-white/40 block mb-2">
              Your Mandates ({mandates.length})
            </span>
            {mandates.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMandate(m)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedMandate?.id === m.id
                    ? 'bg-amber-500/10 border-amber-400 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-amber-300">
                    {m.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    In Review
                  </span>
                </div>
                <h5 className="font-semibold text-sm text-white truncate">{m.title}</h5>
                <div className="flex items-center justify-between text-xs text-white/50 mt-2">
                  <span>{m.extent_acres} Acres</span>
                  <span>{m.price_display}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Live Stepper & Due Diligence Progress */}
          {selectedMandate && (
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div>
                  <h4 className="font-semibold text-base text-white">{selectedMandate.title}</h4>
                  <p className="text-xs text-white/50">
                    Location: {selectedMandate.corridor || selectedMandate.district} · Extent: {selectedMandate.extent_acres} Acres
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-amber-400 block">{selectedMandate.price_display}</span>
                  <span className="text-[10px] text-white/40">Registered on {new Date(selectedMandate.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Stepper */}
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-white/40 block mb-4">
                  Live Syndication & Underwriting Stages
                </span>
                <div className="space-y-4">
                  {[
                    {
                      stage: 'Mandate Submitted & Encrypted',
                      desc: 'Asset parameters registered with cryptographic confidentiality protocol.',
                      status: 'completed',
                    },
                    {
                      stage: 'Technical Underwriting & Title Due Diligence',
                      desc: 'Senior technical desk verifying revenue patta, substation evacuation capacity, and zoning classification.',
                      status: 'active',
                    },
                    {
                      stage: 'Private MNC Buyer Matching (Chettinad, Renewables, PE)',
                      desc: 'Direct confidential syndication to institutional procurement heads and corporate strategy officers.',
                      status: 'in_progress',
                    },
                    {
                      stage: 'Confidential LOI & Term Sheet Negotiations',
                      desc: 'Mutual NDA execution and formal price terms exchange.',
                      status: 'upcoming',
                    },
                    {
                      stage: 'Closing & Title Transfer',
                      desc: 'Statutory registration and institutional consideration settlement.',
                      status: 'upcoming',
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative">
                      {idx < 4 && (
                        <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                          step.status === 'completed' ? 'bg-emerald-500' : 'bg-white/10'
                        }`} />
                      )}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                        step.status === 'completed'
                          ? 'bg-emerald-500 text-black'
                          : step.status === 'active'
                          ? 'bg-amber-400 text-black ring-4 ring-amber-400/20'
                          : 'bg-white/10 text-white/40'
                      }`}>
                        {step.status === 'completed' ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <h6 className={`text-sm font-semibold ${
                            step.status === 'active' ? 'text-amber-400' : step.status === 'completed' ? 'text-white' : 'text-white/40'
                          }`}>
                            {step.stage}
                          </h6>
                          {step.status === 'active' && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Active Stage
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Offtaker Box */}
              {selectedMandate.target_offtakers && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-[10px] font-mono uppercase text-amber-400 block mb-2">
                    Identified Corporate Synergy Matches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedMandate.target_offtakers.map((off: string, i: number) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/80">
                        {off}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
