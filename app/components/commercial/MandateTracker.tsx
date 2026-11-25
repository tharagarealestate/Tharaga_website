'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Image as ImageIcon, MapPin, Plus, RefreshCw } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

type Stage = { key: string; label: string; state: 'done' | 'current' | 'next'; at?: string | null }
type Listing = {
  id: string
  reference: string
  title: string
  category: string
  location: string
  extent?: string | null
  media_count: number
  status: string
  status_note?: string | null
  created_at: string
  stages: Stage[]
}

const EASE = [0.22, 1, 0.36, 1] as const
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export function MandateTracker({ user, onOpenIntake }: { user: any; onOpenIntake: () => void }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token
      if (!token) throw new Error('Please sign in again to see your listings.')
      const res = await fetch('/api/listings', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Could not load your listings.')
      setListings(j.listings || [])
      setActive(0)
    } catch (e: any) {
      setError(e?.message || 'Could not load your listings.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
    const on = () => load()
    window.addEventListener('tharaga:listing-created', on)
    return () => window.removeEventListener('tharaga:listing-created', on)
  }, [load])

  const l = listings[active]

  return (
    <div className="border border-[#D6CAB5] bg-[#FBF8F2]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4DACA] px-5 py-5 sm:px-8">
        <div>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94643A]">Your listings</p>
          <p className="mt-1 font-display text-[1.35rem] tracking-[0.02em] text-[#15213A]">
            {loading ? 'Loading…' : listings.length ? `${listings.length} propert${listings.length > 1 ? 'ies' : 'y'} with the desk` : 'Nothing listed yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} aria-label="Refresh" className="flex h-11 w-11 items-center justify-center border border-[#D6CAB5] text-[#4A5163] hover:border-[#15213A] hover:text-[#15213A]">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onOpenIntake} className="inline-flex h-11 items-center gap-2 bg-[#15213A] px-5 font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#F7F3EC] hover:bg-[#0E1729]">
            <Plus className="h-4 w-4" /> List a property
          </button>
        </div>
      </div>

      {error && <p className="px-5 py-6 font-sans text-[14px] text-[#A3412B] sm:px-8">{error}</p>}

      {!loading && !error && listings.length === 0 && (
        <div className="px-5 py-12 text-center sm:px-8">
          <p className="mx-auto max-w-md font-sans text-[15px] leading-relaxed text-[#4A5163]">
            When you list a property, you can follow each step here — desk review, title check, buyer matching and site visits.
          </p>
        </div>
      )}

      {listings.length > 0 && l && (
        <div className="grid lg:grid-cols-[minmax(0,300px)_1fr]">
          <ul className="flex gap-2 overflow-x-auto border-b border-[#E4DACA] p-3 lg:block lg:space-y-1 lg:overflow-visible lg:border-b-0 lg:border-r">
            {listings.map((x, i) => (
              <li key={x.id} className="shrink-0">
                <button
                  onClick={() => setActive(i)}
                  className={`w-[240px] px-4 py-3 text-left transition-colors lg:w-full ${i === active ? 'bg-[#15213A] text-[#F7F3EC]' : 'hover:bg-[#EFE8DC]'}`}
                >
                  <span className={`block font-sans text-[11px] font-semibold tracking-[0.14em] ${i === active ? 'text-[#E6C9A0]' : 'text-[#94643A]'}`}>{x.reference}</span>
                  <span className={`mt-1 block truncate font-sans text-[14px] font-semibold ${i === active ? 'text-[#F7F3EC]' : 'text-[#15213A]'}`}>{x.title}</span>
                  <span className={`mt-0.5 block truncate font-sans text-[12.5px] ${i === active ? 'text-white/70' : 'text-[#5F6575]'}`}>{fmtDate(x.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>

          <AnimatePresence mode="wait">
            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="p-5 sm:p-8">
              <h4 className="font-display text-[1.5rem] leading-tight tracking-[0.02em] text-[#15213A]">{l.title}</h4>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-sans text-[13.5px] text-[#4A5163]">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#94643A]" />{l.location}</span>
                {l.extent && <span>{l.extent}</span>}
                <span className="inline-flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5 text-[#94643A]" />{l.media_count} file{l.media_count === 1 ? '' : 's'}</span>
              </div>

              <ol className="relative mt-8">
                {l.stages.map((s, i) => (
                  <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < l.stages.length - 1 && (
                      <span aria-hidden className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-px ${s.state === 'done' ? 'bg-[#B0834A]' : 'bg-[#E4DACA]'}`} />
                    )}
                    <span
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-sans text-[11px] font-semibold ${
                        s.state === 'done' ? 'border-[#B0834A] bg-[#B0834A] text-white' : s.state === 'current' ? 'border-[#15213A] bg-[#15213A] text-[#E6C9A0]' : 'border-[#D6CAB5] bg-white text-[#8A8F9C]'
                      }`}
                    >
                      {s.state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                      {s.state === 'current' && <span className="absolute inset-0 animate-ping rounded-full bg-[#15213A]/25" />}
                    </span>
                    <div className="pt-0.5">
                      <p className={`font-sans text-[14.5px] font-semibold ${s.state === 'next' ? 'text-[#8A8F9C]' : 'text-[#15213A]'}`}>{s.label}</p>
                      {s.at && <p className="font-sans text-[12.5px] text-[#5F6575]">{fmtDate(s.at)}</p>}
                      {s.state === 'current' && l.status_note && <p className="mt-1 max-w-lg font-sans text-[13.5px] leading-relaxed text-[#4A5163]">{l.status_note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
