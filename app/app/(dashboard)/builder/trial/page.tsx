"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabase } from '@/lib/supabase'
import { LeadCard } from '@/app/(dashboard)/builder/leads/_components/LeadCard'
import { CheckCircle2, Lock, Sparkles, X } from 'lucide-react'

type ChecklistItem = { id: string; builder_id: string; label: string; completed: boolean }
type PropertyItem = { id: string; title: string; city?: string | null; locality?: string | null; priceINR?: number | null; image?: string | null }
type LeadItem = { id: string; created_at: string; name: string; email: string; phone: string; status: string; score: number; source: string; budget?: number | null; property: { title?: string; location?: string } }

const MAX_TRIAL_LEADS = 10
const MAX_TRIAL_PROPERTIES = 3
const DEMO_BUILDER_ID = 'demo-builder'

export default function BuilderTrialPage() {
  const supabase = useMemo(() => getSupabase(), [])

  // Trial meta
  const [daysLeft, setDaysLeft] = useState<number>(14)
  const [leads, setLeads] = useState<LeadItem[] | null>(null)
  const [properties, setProperties] = useState<PropertyItem[] | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(null)
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // UI state
  const [featurePreview, setFeaturePreview] = useState<null | { title: string; img: string; desc: string }>(null)
  const [showMidTrialOffer, setShowMidTrialOffer] = useState(false)
  const [showExpiryBanner, setShowExpiryBanner] = useState(false)
  const confettiFiredRef = useRef(false)

  // Compute trial start and days left
  useEffect(() => {
    try {
      const key = 'trial_start'
      let startISO = typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null
      if (!startISO) {
        const now = new Date()
        startISO = now.toISOString()
        if (typeof window !== 'undefined') window.sessionStorage.setItem(key, startISO)
      }
      const start = new Date(startISO!)
      const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
      const diffMs = end.getTime() - Date.now()
      const d = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
      setDaysLeft(d)
      setShowExpiryBanner(d <= 3)
    } catch {}
  }, [])

  // Load initial data (leads, properties, checklist)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Leads
        const lr = await fetch(`/api/builder/leads?dateRange=90days`).then(r => r.json()).catch(() => ({ items: [] }))
        if (!cancelled) setLeads((lr.items || []).slice(0, MAX_TRIAL_LEADS))
      } catch { if (!cancelled) setLeads([]) }
      try {
        // Properties
        const pr = await fetch(`/api/builder/properties`).then(r => r.json()).catch(() => ({ items: [] }))
        if (!cancelled) setProperties(pr.items || [])
      } catch { if (!cancelled) setProperties([]) }
      try {
        // Checklist (trial_checklist)
        setLoadingChecklist(true)
        const { data, error } = await supabase
          .from('trial_checklist')
          .select('id,builder_id,label,completed')
          .eq('builder_id', DEMO_BUILDER_ID)
          .order('id', { ascending: true })
        if (error) throw error
        if (!cancelled) setChecklist(data || [])
      } catch {
        if (!cancelled) setChecklist([
          { id: '1', builder_id: DEMO_BUILDER_ID, label: 'Complete profile', completed: false },
          { id: '2', builder_id: DEMO_BUILDER_ID, label: 'Add company logo', completed: false },
          { id: '3', builder_id: DEMO_BUILDER_ID, label: 'List first property', completed: false },
          { id: '4', builder_id: DEMO_BUILDER_ID, label: 'Set lead preferences', completed: false },
          { id: '5', builder_id: DEMO_BUILDER_ID, label: 'Configure notifications', completed: false },
        ])
      } finally {
        if (!cancelled) setLoadingChecklist(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  // Trigger upgrade modal after 5th lead (once)
  useEffect(() => {
    const count = leads?.length || 0
    if (count >= 5) {
      const k = 'trial_offer_after_5_leads'
      const seen = typeof window !== 'undefined' ? window.localStorage.getItem(k) : null
      if (!seen) {
        setShowMidTrialOffer(true)
        window.localStorage.setItem(k, '1')
        // Track
        trackPrompt('after_5_leads')
      }
    }
  }, [leads])

  // Track expiry-window banner
  useEffect(() => {
    if (showExpiryBanner) trackPrompt(daysLeft === 0 ? 'expiry_day' : 'before_expiry_3days')
  }, [showExpiryBanner, daysLeft])

  const leadsUsed = Math.min(leads?.length || 0, MAX_TRIAL_LEADS)
  const leadsProgressPct = Math.round((leadsUsed / MAX_TRIAL_LEADS) * 100)

  const handleToggleChecklist = useCallback(async (item: ChecklistItem) => {
    try {
      const nextVal = !item.completed
      setChecklist((prev) => (prev || []).map(i => i.id === item.id ? { ...i, completed: nextVal } : i))
      const { error } = await supabase
        .from('trial_checklist')
        .update({ completed: nextVal })
        .eq('id', item.id)
      if (error) throw error

      // Confetti on full completion
      const allDone = (checklist || []).every(c => c.id === item.id ? nextVal : c.completed)
      if (allDone && !confettiFiredRef.current) {
        confettiFiredRef.current = true
        try {
          const { default: confetti } = await import('canvas-confetti')
          confetti({ spread: 70, origin: { y: 0.6 }, particleCount: 120 })
        } catch {}
      }
    } catch {
      // revert on error
      setChecklist((prev) => (prev || []).map(i => i.id === item.id ? { ...i, completed: item.completed } : i))
    }
  }, [supabase, checklist])

  const handleScheduleVisit = useCallback(async () => {
    setToast('Site visit scheduled!')
    setTimeout(() => setToast(null), 2500)
    trackPrompt('after_site_visit')
  }, [])

  async function trackPrompt(type: 'after_5_leads' | 'after_3_properties' | 'after_site_visit' | 'before_expiry_3days' | 'expiry_day') {
    try {
      await supabase.from('upgrade_prompts').insert({ builder_id: DEMO_BUILDER_ID, prompt_type: type, shown_at: new Date().toISOString() })
    } catch {}
  }

  // PROPERTY add disabled after limit
  const canAddProperty = (properties?.length || 0) < MAX_TRIAL_PROPERTIES

  return (
    <main className="min-h-screen bg-canvas text-fg">
      {/* TOP BANNER (sticky) */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="container mx-auto flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="text-sm font-medium text-gray-800">{leadsUsed} of {MAX_TRIAL_LEADS} leads used</div>
          <div className="relative h-2 w-48 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-2 bg-gold-500"
              initial={{ width: 0 }}
              animate={{ width: `${leadsProgressPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-700">{daysLeft} days left</span>
            <Link href="/app/saas/pricing" className="btn-gold whitespace-nowrap">Upgrade for Unlimited Leads</Link>
          </div>
        </div>
        {showExpiryBanner && (
          <div className="border-t border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            {daysLeft === 0 ? 'Your trial ends today. Unlock unlimited leads.' : 'Your trial expires soon. Save 50% if you upgrade now.'}
          </div>
        )}
      </div>

      {/* BODY GRID */}
      <section className="container mx-auto grid grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        {/* LEFT: QUICK START CHECKLIST */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Quick Start</h2>
              <Sparkles className="h-5 w-5 text-gold-500" />
            </div>
            <div className="space-y-3">
              {(checklist || []).map((item) => (
                <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleChecklist(item)}
                    className="mt-1"
                    aria-label={item.label}
                    disabled={loadingChecklist}
                  />
                  <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.label}</span>
                </label>
              ))}
              {(!checklist || checklist.length === 0) && (
                <div className="text-sm text-gray-500">No checklist items yet.</div>
              )}
            </div>
            {(checklist || []).every(i => i.completed) && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> All steps complete!
              </div>
            )}
          </div>
        </div>

        {/* CENTER: LEAD PREVIEW and PROPERTY LISTING */}
        <div className="lg:col-span-6 space-y-6">
          {/* LEAD PREVIEW */}
          <div className="glass-card rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Lead Preview</h2>
                <p className="text-xs text-gray-600">Showing up to {MAX_TRIAL_LEADS} leads with quick actions</p>
              </div>
              <Link href="/builder/leads" className="text-sm font-semibold text-primary-700 hover:underline">See all</Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(leads || []).slice(0, MAX_TRIAL_LEADS).map((lead) => (
                <div key={lead.id} className="relative">
                  <LeadCard lead={lead as any} />
                  {/* LOCKED advanced features overlay */}
                  <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-700">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Advanced insights locked — Upgrade to access</span>
                    </div>
                  </div>
                </div>
              ))}
              {(leads || []).length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">No leads yet. As buyers inquire, they will appear here.</div>
              )}
            </div>
            <div className="mt-4 text-xs text-gray-500">Tip: Click Schedule on a lead to simulate a site visit.</div>
            <div className="mt-3">
              <button onClick={handleScheduleVisit} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Simulate Site Visit Scheduled</button>
            </div>
          </div>

          {/* PROPERTY LISTING */}
          <div className="glass-card rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your Properties ({Math.min(properties?.length || 0, MAX_TRIAL_PROPERTIES)} of {MAX_TRIAL_PROPERTIES} max)</h2>
                <p className="text-xs text-gray-600">List up to {MAX_TRIAL_PROPERTIES} properties in trial</p>
              </div>
              <Link
                href="/builders/add-property"
                className={`btn-primary ${!canAddProperty ? 'pointer-events-none opacity-50' : ''}`}
                aria-disabled={!canAddProperty}
                onClick={() => { if (!canAddProperty) { setToast('Upgrade for unlimited properties'); } else { if (properties && properties.length + 1 >= 3) trackPrompt('after_3_properties') } }}
              >
                Add Property
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(properties || []).slice(0, MAX_TRIAL_PROPERTIES).map((p) => (
                <div key={p.id} className="flex gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {p.image ? (
                      <Image src={p.image} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">{p.title}</div>
                    <div className="truncate text-xs text-gray-600">{[p.locality, p.city].filter(Boolean).join(', ')}</div>
                  </div>
                </div>
              ))}
              {(properties || []).length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">No properties listed yet.</div>
              )}
            </div>
            {!canAddProperty && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Upgrade for unlimited</div>
            )}
          </div>
        </div>

        {/* RIGHT: FEATURE TEASERS */}
        <div className="lg:col-span-3 space-y-4">
          {[
            { title: 'Advanced Lead Scoring', img: '/images/feature-scoring.png', desc: 'AI-powered intent scoring and signals.' },
            { title: 'Revenue Forecasting', img: '/images/feature-forecast.png', desc: 'Predict bookings and revenue.' },
            { title: 'Automated Follow-ups', img: '/images/feature-followups.png', desc: 'Smart sequences and reminders.' },
            { title: 'Team Collaboration', img: '/images/feature-collab.png', desc: 'Assign, comment, and track actions.' },
          ].map((f) => (
            <div key={f.title} className="group glass-card cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-md" onClick={() => setFeaturePreview(f)}>
              <div className="mb-2 h-28 w-full overflow-hidden rounded-lg bg-gray-100">
                {/* Placeholder image box; actual images can be added to public/images */}
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Screenshot</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{f.title}</div>
                  <div className="text-xs text-gray-600">{f.desc}</div>
                </div>
                <button className="btn-gold px-2 py-1 text-xs">Upgrade to Unlock</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MID-TRIAL OFFER MODAL */}
      <AnimatePresence>
        {showMidTrialOffer && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Limited Time: 50% OFF</h3>
                  <p className="text-sm text-gray-600">Upgrade now and keep momentum with unlimited leads.</p>
                </div>
                <button onClick={() => setShowMidTrialOffer(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close modal"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-5 flex gap-2">
                <Link href="/app/saas/pricing" className="btn-gold flex-1">Claim 50% OFF</Link>
                <button className="btn-primary flex-1" onClick={() => setShowMidTrialOffer(false)}>Maybe later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEATURE PREVIEW MODAL */}
      <AnimatePresence>
        {!!featurePreview && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4" initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-bold text-gray-900">{featurePreview.title}</div>
                <button onClick={() => setFeaturePreview(null)} aria-label="Close preview" className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="relative h-72 w-full overflow-hidden rounded-lg bg-gray-100">
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">Large screenshot preview</div>
              </div>
              <div className="mt-3 text-sm text-gray-700">{featurePreview.desc}</div>
              <div className="mt-4 flex justify-end">
                <Link href="/app/saas/pricing" className="btn-gold">Upgrade to Unlock</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXPIRY DAY TAKEOVER */}
      <AnimatePresence>
        {daysLeft === 0 && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-2xl font-black text-gray-900">Trial Ended</h3>
              <p className="mt-2 text-sm text-gray-700">Your 14-day trial has ended. Upgrade to continue receiving leads and unlock all features.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/app/saas/pricing" className="btn-gold">See Pricing</Link>
                <Link href="/app/saas/pricing" className="btn-primary">Upgrade Now</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div className="fixed bottom-4 right-4 z-50 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-emerald-800 shadow" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

