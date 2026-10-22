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
      <div className="rounded-3xl bg-white border border-[#E8E2D6] p-8 sm:p-14 text-center relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] flex items-center justify-center mx-auto text-[#9E7B4F]">
            <Lock className="w-5 h-5" />
          </div>

          <div>
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#9E7B4F] font-semibold block mb-1">
              Private Client Access
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1816] tracking-tight">
              Track Your Property Status
            </h3>
            <p className="text-[#5A564F] text-xs sm:text-sm leading-relaxed mt-2 font-light">
              Signed in with Google? Access the live review stage, title due diligence audit, and buyer matching for your submitted properties in real time.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal()}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all shadow-md"
            >
              Sign In with Google
            </button>
            <button
              onClick={onOpenIntake}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#E8E2D6] text-[#1A1816] font-sans text-xs font-semibold transition-colors"
            >
              List Commercial Property
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Signed in state
  return (
    <div className="rounded-3xl bg-white border border-[#E8E2D6] overflow-hidden shadow-xl text-[#1A1816]">
      {/* Header bar */}
      <div className="px-6 sm:px-10 py-6 border-b border-[#E8E2D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans tracking-[0.18em] uppercase text-[#9E7B4F] font-semibold">
              Principal Profile
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1816]">
            Property Status & Review Hub
          </h3>
          <p className="text-xs text-[#5A564F] font-light">
            Logged in as {user.email}. Live verification milestones and buyer syndication.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchUserMandates}
            disabled={loading}
            className="p-2.5 rounded-full bg-white border border-[#E8E2D6] hover:bg-[#F4F0E8] text-[#5A564F] transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenIntake}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] text-xs font-sans font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A059]" /> List Another Property
          </button>
        </div>
      </div>

      {/* Content Area */}
      {mandates.length === 0 ? (
        <div className="p-10 sm:p-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E8E2D6] flex items-center justify-center mx-auto text-[#8E887E]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-serif font-bold text-[#1A1816]">No Properties Uploaded Yet</h4>
            <p className="text-xs text-[#5A564F] max-w-md mx-auto mt-1 leading-relaxed">
              When you list a commercial land parcel, solar site, or quarry, its technical audit and buyer matching progress will display here.
            </p>
          </div>
          <button
            onClick={onOpenIntake}
            className="mt-2 px-6 py-3 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] text-xs font-sans uppercase tracking-wider font-semibold shadow-md"
          >
            List Your First Property
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Property List */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold block mb-2">
              Your Listed Properties ({mandates.length})
            </span>
            {mandates.map(m => {
              const active = selectedMandate?.id === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMandate(m)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    active
                      ? 'border-[#1A1816] bg-[#F7F4EE] shadow-sm'
                      : 'border-[#E8E2D6] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-wider text-[#9E7B4F] font-semibold block">
                        {m.category}
                      </span>
                      <h4 className="text-sm font-serif font-bold text-[#1A1816] mt-0.5 leading-snug">
                        {m.title}
                      </h4>
                      <p className="text-xs text-[#5A564F] flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-[#9E7B4F]" /> {m.corridor || m.district} · {m.extent_acres} Acres
                      </p>
                    </div>

                    <span className="text-[10px] font-sans px-2.5 py-1 rounded-full bg-[#1A1816] text-[#FAF8F5] shrink-0 font-medium">
                      In Review
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Selected Mandate Live Progress Stage */}
          {selectedMandate && (
            <div className="lg:col-span-7 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E2D6]">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-wider text-[#9E7B4F] font-bold block">
                    Live Status
                  </span>
                  <h4 className="text-lg font-serif font-bold text-[#1A1816]">
                    {selectedMandate.tracking_stage_title || 'Technical Due Diligence & Review'}
                  </h4>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#8E887E] uppercase block">Asking Outlay</span>
                  <span className="text-base font-bold text-[#1A1816]">{selectedMandate.price_display}</span>
                </div>
              </div>

              {/* Progress Milestones Strip */}
              <div className="space-y-4">
                <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold block">
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
                      className={`p-3.5 rounded-xl border flex items-start gap-3.5 ${
                        st.active
                          ? 'bg-white border-[#C5A059] shadow-sm'
                          : st.done
                          ? 'bg-white border-[#E8E2D6]'
                          : 'bg-[#FAF8F5] border-[#E8E2D6]/60 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          st.active
                            ? 'bg-[#1A1816] text-[#FAF8F5]'
                            : st.done
                            ? 'bg-[#9E7B4F] text-white'
                            : 'bg-[#E8E2D6] text-[#8E887E]'
                        }`}
                      >
                        {st.done && !st.active ? '✓' : st.step}
                      </div>

                      <div>
                        <h5 className="text-xs font-serif font-bold text-[#1A1816]">{st.title}</h5>
                        <p className="text-[11px] text-[#5A564F] mt-0.5 leading-relaxed">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Desk Inquiry for this property */}
              <div className="pt-4 border-t border-[#E8E2D6] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-[#5A564F]">
                  Questions about your listing status?
                </span>

                <a
                  href={`https://wa.me/918870980839?text=${encodeURIComponent(`Hello Tharaga Real Estate, I am inquiring about the status of my listed property: ${selectedMandate.title} (ID: ${selectedMandate.id}).`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] text-xs font-sans font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
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