"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { getSupabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Plus, CheckCircle2, Check, X, Star, Sparkles, Clock, Crown, Shield, ChartNoAxesColumn, Users, MailCheck, Gauge } from 'lucide-react'
import clsx from 'clsx'
import { Tooltip } from '@/components/ui/Tooltip'

type ChecklistItem = { id: string; builder_id: string; title: string; completed: boolean }
type Lead = { id: string; created_at: string; name: string; email: string; phone: string; status?: string; score?: number; source?: string; property?: { title?: string; location?: string } }
type Property = { id: string; title: string; city?: string; locality?: string; created_at?: string }

export default function TrialDashboardPage() {
  const supabase = useMemo(() => getSupabase(), [])
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null)
  const [showFiftyOffModal, setShowFiftyOffModal] = useState(false)
  const [showPropertyCapBanner, setShowPropertyCapBanner] = useState(false)
  const [expiryBanner, setExpiryBanner] = useState<string | null>(null)
  const confettiLoadedRef = useRef(false)

  // Derived
  const leadsUsed = Math.min(leads.length, 10)
  const leadsLimit = 10
  const propertiesLimit = 3
  const daysLeft = useMemo(() => {
    if (!trialEndsAt) return null
    const now = new Date()
    const diff = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff < 0 ? 0 : diff
  }, [trialEndsAt])

  // Auth/builder derivation - REAL USER ONLY, NO DEMO FALLBACK
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const uid = data?.user?.id || null
        if (!mounted) return
        // Only set builderId if we have a real authenticated user
        if (uid) {
          setBuilderId(uid)
        } else {
          // No user = no data, don't use demo fallback
          setBuilderId(null)
        }
      } catch {
        if (!mounted) return
        // Error = no data, don't use demo fallback
        setBuilderId(null)
      }
    })()
    return () => { mounted = false }
  }, [supabase])

  // Load trial info, checklist, leads, properties
  useEffect(() => {
    if (!builderId) return
    let cancelled = false

    ;(async () => {
      // Trial meta: ends at date - Use builder_subscriptions table (consistent with subscription API)
      try {
        const { data } = await supabase
          .from('builder_subscriptions')
          .select('trial_expires_at')
          .eq('builder_id', builderId)
          .maybeSingle()
        if (!cancelled) setTrialEndsAt(data?.trial_expires_at ? new Date(data.trial_expires_at) : null)
      } catch {}

      // Checklist
      try {
        const { data } = await supabase
          .from('trial_checklist')
          .select('id,builder_id,title,completed')
          .eq('builder_id', builderId)
          .order('id', { ascending: true })
        if (!cancelled && Array.isArray(data)) setChecklist(data)
      } catch {}

      // Leads (max 10)
      try {
        const { data } = await supabase
          .from('leads')
          .select('id,created_at,name,email,phone,status,score,source,properties(title,location)')
          .eq('builder_id', builderId)
          .order('created_at', { ascending: false })
          .limit(10)
        const items: Lead[] = (data || []).map((r: any) => ({
          id: r.id,
          created_at: r.created_at,
          name: r.name,
          email: r.email,
          phone: r.phone,
          status: r.status,
          score: r.score,
          source: r.source,
          property: { title: r?.properties?.title, location: r?.properties?.location },
        }))
        if (!cancelled) setLeads(items)
      } catch {}

      // Properties
      try {
        const { data } = await supabase
          .from('properties')
          .select('id,title,city,locality,created_at')
          .eq('builder_id', builderId)
          .order('created_at', { ascending: false })
        if (!cancelled) setProperties(data || [])
      } catch {}
    })()

    return () => { cancelled = true }
  }, [builderId, supabase])

  // Triggers: modal/banner by usage
  useEffect(() => {
    if (!builderId) return
    // After 5th lead: show 50% off modal (once)
    if (leads.length >= 5) {
      setShowFiftyOffModal(true)
      ;(async () => {
        try {
          await supabase.from('upgrade_prompts').insert({ builder_id: builderId, prompt_type: 'after_5_leads', shown_at: new Date().toISOString() })
        } catch {}
      })()
    }
  }, [builderId, leads.length, supabase])

  useEffect(() => {
    if (!builderId) return
    // After 3rd property: banner prompt (once)
    if (properties.length >= 3) {
      setShowPropertyCapBanner(true)
      ;(async () => {
        try {
          await supabase.from('upgrade_prompts').insert({ builder_id: builderId, prompt_type: 'after_3_properties', shown_at: new Date().toISOString() })
        } catch {}
      })()
    }
  }, [builderId, properties.length, supabase])

  // Expiry banners
  useEffect(() => {
    if (daysLeft === null) return
    if (daysLeft === 0) {
      setExpiryBanner('Your trial has ended. Upgrade to continue.')
      // Track expiry day prompt
      ;(async () => {
        try {
          if (builderId) await supabase.from('upgrade_prompts').insert({ builder_id: builderId, prompt_type: 'on_expiry_day', shown_at: new Date().toISOString() })
        } catch {}
      })()
    } else if (daysLeft <= 3) {
      setExpiryBanner(`Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial. Upgrade now!`)
      // Track 3-days-before-expiry prompt
      ;(async () => {
        try {
          if (builderId) await supabase.from('upgrade_prompts').insert({ builder_id: builderId, prompt_type: 'three_days_before_expiry', shown_at: new Date().toISOString() })
        } catch {}
      })()
    } else {
      setExpiryBanner(null)
    }
  }, [builderId, daysLeft, supabase])

  // Confetti loader
  const launchConfetti = useCallback(async () => {
    try {
      if (!confettiLoadedRef.current) {
        // Dynamic import for canvas-confetti
        await import('canvas-confetti')
        confettiLoadedRef.current = true
      }
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444'],
      })
    } catch {}
  }, [])

  const toggleChecklist = useCallback(async (item: ChecklistItem) => {
    try {
      const { error } = await supabase
        .from('trial_checklist')
        .update({ completed: !item.completed })
        .eq('id', item.id)
      if (!error) {
        setChecklist(prev => prev.map(i => (i.id === item.id ? { ...i, completed: !i.completed } : i)))
        if (!item.completed) {
          const allDone = checklist.filter(c => c.id !== item.id).every(c => c.completed)
          if (allDone) launchConfetti()
        }
      }
    } catch {}
  }, [checklist, launchConfetti, supabase])

  const handleAddProperty = useCallback(async () => {
    if (!builderId) return
    if (properties.length >= propertiesLimit) return
    try {
      const title = `Property ${properties.length + 1}`
      const { data, error } = await supabase.from('properties').insert({ builder_id: builderId, title, city: '—', locality: '—' }).select('id,title,city,locality,created_at').single()
      if (!error && data) {
        setProperties(prev => [data as Property, ...prev])
        if (properties.length + 1 === 3) {
          // Track banner prompt
          try {
            await supabase.from('upgrade_prompts').insert({ builder_id: builderId, prompt_type: 'after_3_properties', shown_at: new Date().toISOString() })
          } catch {}
        }
      }
    } catch {}
  }, [builderId, properties.length, supabase])

  const handleScheduleVisit = useCallback(async () => {
    // Simulate site visit scheduled action
    try {
      // Track prompt
      if (builderId) {
        await supabase.from('upgrade_prompts').insert({ builder_id: builderId, prompt_type: 'after_site_visit_scheduled', shown_at: new Date().toISOString() })
      }
      // Toast
      try {
        const evt = new CustomEvent('toast', { detail: { title: 'Visit scheduled', description: 'Upgrade to unlock smart reminders.' } })
        window.dispatchEvent(evt)
      } catch {}
    } catch {}
  }, [builderId, supabase])

  const upgradeNow = useCallback(() => {
    try { window.location.href = '/pricing' } catch {}
  }, [])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <AnimatePresence>
        {daysLeft === 0 && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card rounded-2xl p-6 w-[94vw] max-w-lg text-center" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}>
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gold-500/15 flex items-center justify-center">
                <Crown className="w-6 h-6 text-gold-500" />
              </div>
              <div className="text-xl font-bold mb-1">Your trial has ended</div>
              <div className="text-gray-700 mb-4">Choose a plan to keep your leads flowing.</div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={upgradeNow} className="btn-gold">View Pricing</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sticky top banner - positioned below static header */}
      <div className="sticky top-[60px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/90 backdrop-blur border-b glow-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-gold-500" />
            <div className="font-semibold">{leadsUsed} of {leadsLimit} leads used</div>
            <div className="text-gray-500 text-sm">{daysLeft !== null ? `${daysLeft} days left` : '—'}</div>
          </div>
          <div className="flex-1 md:max-w-xl">
            <div className="h-2 w-full rounded-full bg-gold-500/20 overflow-hidden">
              <motion.div
                className="h-2 bg-gold-500"
                initial={false}
                animate={{ width: `${(leadsUsed / leadsLimit) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <button onClick={upgradeNow} className="btn-gold inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Upgrade for Unlimited Leads
          </button>
        </div>
        {!!expiryBanner && (
          <div className="mt-2 text-sm text-primary-900 font-medium">{expiryBanner}</div>
        )}
      </div>

      {/* Content grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Checklist */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Quick Start Checklist</h2>
            </div>
            <ul className="space-y-3">
              {checklist.map(item => (
                <li key={item.id} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleChecklist(item)}
                    aria-pressed={item.completed}
                    className={clsx('mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border', item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-gray-500')}
                  >
                    {item.completed ? <Check className="w-4 h-4" /> : <span className="block w-3 h-3" />}
                  </button>
                  <span className={clsx('text-sm', item.completed && 'line-through text-gray-500')}>{item.title}</span>
                </li>
              ))}
              {!checklist.length && (
                <li className="text-sm text-gray-500">No items yet.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Center column: Leads and Properties */}
        <div className="lg:col-span-6 space-y-6">
          {/* Lead Preview */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold">Lead Preview</h2>
              </div>
              <div className="text-sm text-gray-500">Showing up to 10</div>
            </div>
            <div className="space-y-4">
              {leads.map(lead => (
                <div key={lead.id} className="relative rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{lead.name || '—'}</div>
                      <div className="text-sm text-gray-600">{lead.email} · {lead.phone}</div>
                      <div className="text-sm text-gray-600">{lead.property?.title || '—'} {lead.property?.location ? `· ${lead.property.location}` : ''}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <button className="btn-primary px-3 py-1.5">Contact</button>
                      <button onClick={handleScheduleVisit} className="px-3 py-1.5 rounded bg-gray-900 text-white">Schedule</button>
                    </div>
                  </div>
                  {/* Locked advanced features */}
                  <div className="mt-3 relative">
                    <div className="blur-[2px] pointer-events-none select-none">
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                        <div className="p-3 rounded bg-gray-50 border">Lead Scoring Timeline</div>
                        <div className="p-3 rounded bg-gray-50 border">AI Intent Summary</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Tooltip content="Upgrade to access">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border shadow">
                          <Lock className="w-4 h-4 text-gray-700" />
                          <span className="text-sm font-medium text-gray-800">Advanced features locked</span>
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
              {!leads.length && (
                <div className="text-sm text-gray-500">No leads yet.</div>
              )}
            </div>
          </div>

          {/* Property Listing */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ChartNoAxesColumn className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold">Your Properties ({Math.min(properties.length, propertiesLimit)} of {propertiesLimit} max)</h2>
              </div>
              <button
                onClick={handleAddProperty}
                disabled={properties.length >= propertiesLimit}
                className={clsx('inline-flex items-center gap-2 px-3 py-1.5 rounded', properties.length >= propertiesLimit ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-primary-600 text-white')}
              >
                <Plus className="w-4 h-4" /> Add Property
              </button>
            </div>
            {properties.length >= propertiesLimit && (
              <div className="mb-3 text-sm text-gray-700">Reached free limit. Upgrade for unlimited.</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.slice(0, propertiesLimit).map(p => (
                <div key={p.id} className="rounded border p-3">
                  <div className="font-semibold text-gray-900 truncate">{p.title}</div>
                  <div className="text-sm text-gray-600 truncate">{[p.city, p.locality].filter(Boolean).join(', ') || '—'}</div>
                </div>
              ))}
              {!properties.length && (
                <div className="text-sm text-gray-500">No properties yet.</div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showPropertyCapBanner && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-lg glow-border bg-amber-50 text-amber-900 p-4">
                You’ve hit the free property limit. Upgrade to unlock unlimited listings.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Feature teasers */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {[
              { name: 'Advanced Lead Scoring', desc: 'Deeper AI signals and prioritization', image: '/screenshots/lead-scoring.png' },
              { name: 'Revenue Forecasting', desc: 'Predict pipeline value with confidence', image: '/screenshots/revenue-forecast.png' },
              { name: 'Automated Follow-ups', desc: 'Smart cadences across channels', image: '/screenshots/followups.png' },
              { name: 'Team Collaboration', desc: 'Assign, mention, and track', image: '/screenshots/team.png' },
            ].map((f, idx) => (
              <FeatureTeaserCard key={idx} {...f} />
            ))}
          </div>
        </div>
      </div>

      {/* 50% off modal */}
      <AnimatePresence>
        {showFiftyOffModal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card rounded-xl p-6 w-[92vw] max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-gold-500" />
                <div className="font-bold text-lg">Limited-time offer</div>
              </div>
              <div className="text-gray-700 mb-4">Get 50% off your first month when you upgrade today.</div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowFiftyOffModal(false)} className="px-3 py-1.5 rounded border">Maybe later</button>
                <button onClick={upgradeNow} className="btn-gold">Upgrade now</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FeatureTeaserCard({ name, desc, image }: { name: string; desc: string; image: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-sm text-gray-600">{desc}</div>
        </div>
        <button onClick={() => setOpen(true)} className="px-2 py-1.5 rounded bg-gray-900 text-white text-sm">Preview</button>
      </div>
      <div className="mt-3">
        <button onClick={() => setOpen(true)} className="w-full rounded border overflow-hidden">
          <Image src={image} alt={name} width={560} height={112} className="w-full h-28 object-cover" placeholder="blur" blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />
        </button>
      </div>
      <div className="mt-3">
        <button className="btn-gold w-full">Upgrade to Unlock</button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card rounded-xl p-4 w-[96vw] max-w-3xl" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{name}</div>
                <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
              <Image src={image} alt={name} width={1200} height={630} className="w-full rounded" placeholder="blur" blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
