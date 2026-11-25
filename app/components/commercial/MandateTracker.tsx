'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Clock, CheckCircle2, ArrowUpRight,
  Building2, RefreshCw, AlertCircle, Lock,
  ChevronRight, ExternalLink, Plus, MapPin, Phone
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
        setMandates([])
        setSelectedMandate(null)
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

  // Not signed in state
  if (!user) {
    return (
      <div className="rounded-none bg-[#FBF8F2] border border-[#D6CAB5] p-8 sm:p-14 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#F4EFE6] border border-[#D6CAB5] flex items-center justify-center mx-auto text-[#94643A]">
            <Lock className="w-5 h-5" />
          </div>

          <div>
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#94643A] font-semibold block mb-1">
              Private Client Access
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-normal tracking-[0.03em] text-[#15213A]">
              Track Your Property Status
            </h3>
            <p className="text-[#4A5163] text-xs sm:text-sm leading-relaxed mt-2 font-light">
              Signed in with Google? Access the live review stage, title due diligence audit, and buyer matching for your submitted properties in real time.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal()}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#15213A] hover:bg-[#22314F] text-[#F7F3EC] font-sans text-[11.5px] uppercase tracking-[0.16em] font-semibold transition-all"
            >
              Sign in
            </button>
            <button
              onClick={onOpenIntake}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#F7F3EC] hover:bg-[#EFE8DC] border border-[#D6CAB5] text-[#15213A] font-sans text-xs font-semibold transition-colors"
            >
              List a property
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Signed in state
  return (
    <div className="rounded-none bg-[#FBF8F2] border border-[#D6CAB5] overflow-hidden text-[#15213A]">
      {/* Header bar */}
      <div className="px-6 sm:px-10 py-6 border-b border-[#D6CAB5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F7F3EC]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans tracking-[0.18em] uppercase text-[#94643A] font-semibold">
              Your account
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-normal tracking-[0.03em] text-[#15213A]">
            Your listings
          </h3>
          <p className="text-xs text-[#4A5163] font-light">
            Signed in as {user.email}. Follow review, verification and buyer interest for every property you list.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchUserMandates}
            disabled={loading}
            className="p-2.5 bg-[#FBF8F2] border border-[#D6CAB5] hover:bg-[#EFE8DC] text-[#4A5163] transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenIntake}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#15213A] hover:bg-[#22314F] text-[#F7F3EC] text-xs font-sans font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#B0834A]" /> List a property
          </button>
        </div>
      </div>

      {/* Content Area */}
      {mandates.length === 0 ? (
        <div className="p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F7F3EC] border border-[#D6CAB5] flex items-center justify-center mx-auto text-[#5F6575]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-display font-normal tracking-[0.03em] text-[#15213A]">No listings yet</h4>
            <p className="text-xs text-[#4A5163] max-w-md mx-auto mt-1 leading-relaxed">
              List a property and its review, verification and buyer interest will show here, step by step.
            </p>
          </div>
          <button
            onClick={onOpenIntake}
            className="mt-2 px-6 py-3 bg-[#15213A] hover:bg-[#22314F] text-[#F7F3EC] text-xs font-sans uppercase tracking-wider font-semibold"
          >
            List your first property
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Property List */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-[#5F6575] font-semibold block mb-2">
              Your Listed Properties ({mandates.length})
            </span>
            {mandates.map(m => {
              const active = selectedMandate?.id === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMandate(m)}
                  className={`p-4 rounded-none border transition-all cursor-pointer ${
                    active
                      ? 'border-[#15213A] bg-[#F7F4EE] shadow-sm'
                      : 'border-[#D6CAB5] bg-[#FBF8F2] hover:bg-[#F7F3EC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-wider text-[#94643A] font-semibold block">
                        {m.category}
                      </span>
                      <h4 className="text-sm font-display font-normal tracking-[0.03em] text-[#15213A] mt-0.5 leading-snug">
                        {m.title}
                      </h4>
                      <p className="text-xs text-[#4A5163] flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-[#94643A]" /> {m.corridor || m.district} {m.extent_acres ? `· ${String(m.extent_acres).toLowerCase().includes('acre') || String(m.extent_acres).toLowerCase().includes('sq') ? m.extent_acres : `${m.extent_acres} Acres`}` : ''}
                      </p>
                      {m.rental_yield_display && (
                        <p className="text-[11px] text-[#7C5230] font-medium mt-0.5">
                          {m.rental_yield_display}
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] font-sans px-2.5 py-1 rounded-full bg-[#15213A] text-[#F7F3EC] shrink-0 font-medium">
                      In Review
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Selected Mandate Live Progress Stage */}
          {selectedMandate && (
            <div className="lg:col-span-7 rounded-none bg-[#F7F3EC] border border-[#D6CAB5] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#D6CAB5]">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-wider text-[#94643A] font-bold block">
                    Live Status
                  </span>
                  <h4 className="text-lg font-display font-normal tracking-[0.03em] text-[#15213A]">
                    {selectedMandate.tracking_stage_title || 'Technical Due Diligence & Review'}
                  </h4>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#5F6575] uppercase block">Asking Outlay</span>
                  <span className="text-base font-bold text-[#15213A]">{selectedMandate.price_display}</span>
                </div>
              </div>

              {/* Progress Milestones Strip */}
              <div className="space-y-4">
                <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-[#5F6575] font-semibold block">
                  Advisory Milestones
                </span>

                <div className="space-y-3">
                  {[
                    {
                      step: '01',
                      title: 'Property Submitted & Details Recorded',
                      desc: 'Asset parameters recorded under verified Google identity.',
                      done: true,
                    },
                    {
                      step: '02',
                      title: 'Technical Underwriting & Title Audit',
                      desc: 'Verification of revenue patta, FMB boundary sketches, and substation proximity.',
                      done: true,
                      active: true,
                    },
                    {
                      step: '03',
                      title: 'Direct Enterprise Buyer Syndication',
                      desc: 'Confidential bilateral outreach to registered industrial and corporate buyers.',
                      done: false,
                    },
                  ].map((st, idx) => (
                    <div
                      key={st.step}
                      className={`p-3.5 rounded-none border flex items-start gap-3.5 ${
                        st.active
                          ? 'bg-[#FBF8F2] border-[#B0834A] shadow-sm'
                          : st.done
                          ? 'bg-[#FBF8F2] border-[#D6CAB5]'
                          : 'bg-[#F7F3EC] border-[#D6CAB5]/60 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          st.active
                            ? 'bg-[#15213A] text-[#F7F3EC]'
                            : st.done
                            ? 'bg-[#94643A] text-white'
                            : 'bg-[#E4DACA] text-[#5F6575]'
                        }`}
                      >
                        {st.done && !st.active ? '✓' : st.step}
                      </div>

                      <div>
                        <h5 className="text-xs font-display font-normal tracking-[0.03em] text-[#15213A]">{st.title}</h5>
                        <p className="text-[11px] text-[#4A5163] mt-0.5 leading-relaxed">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Desk Inquiry for this property */}
              <div className="pt-4 border-t border-[#D6CAB5] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-[#4A5163]">
                  Questions about your listing status?
                </span>

                <a
                  href={`https://wa.me/918870980839?text=${encodeURIComponent(`Hello Tharaga Estates, I am inquiring about the status of my listed property: ${selectedMandate.title} (ID: ${selectedMandate.id}).`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#15213A] hover:bg-[#22314F] text-[#F7F3EC] text-xs font-sans font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B0834A]" />
                  <span>Contact Managing Desk</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}