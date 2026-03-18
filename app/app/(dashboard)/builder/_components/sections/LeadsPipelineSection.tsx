'use client'

/**
 * Leads & Pipeline — Core daily workflow
 * Real Supabase data via useDashboardData hook.
 * Views: List + Kanban. Tiers: HOT/WARM/COOL. Tharaga AI stages.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, LayoutGrid, List, X, Phone, MessageSquare,
  Calendar, ChevronRight, ArrowUpDown, Plus,
} from 'lucide-react'
import {
  SmartScoreRing, TierBadge, SlaTimer, TharagaAIStagePill, SourcePill,
  GlassCard, DashboardSkeleton, EmptyState, ErrorDisplay,
  AI_STAGES, AI_STAGE_LABELS, useDashboardData,
  type Tier,
} from './AgenticShared'
import type { DashboardLead } from './AgenticShared'
import { useBuilderAuth } from '../BuilderAuthProvider'

// ─── Pipeline stage map ───────────────────────────────────────────────────────

const KANBAN_STAGES: { key: string; label: string }[] = [
  { key: 'new',       label: 'New Lead'    },
  { key: 'contacted', label: 'Contacted'   },
  { key: 'qualified', label: 'Qualified'   },
  { key: 'converted', label: 'Converted'   },
  { key: 'lost',      label: 'Closed Lost' },
]

// ─── Score breakdown bar ──────────────────────────────────────────────────────

function ScoreBreakdown({ breakdown }: { breakdown: NonNullable<DashboardLead['score_breakdown']> }) {
  const bars = [
    { label: 'Budget',     val: breakdown.budget    ?? 0, max: 30, color: 'bg-amber-500'   },
    { label: 'Timeline',   val: breakdown.timeline  ?? 0, max: 30, color: 'bg-yellow-500'  },
    { label: 'Behavioral', val: breakdown.behavioral ?? 0, max: 25, color: 'bg-blue-500'    },
    { label: 'Intent',     val: breakdown.intent    ?? 0, max: 15, color: 'bg-emerald-500' },
  ]
  return (
    <div className="space-y-2">
      {bars.map(b => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 w-20 flex-shrink-0">{b.label}</span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(b.val / b.max) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${b.color}`}
            />
          </div>
          <span className="text-[11px] font-semibold text-zinc-300 w-12 text-right">{b.val}/{b.max}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function LeadDetailPanel({ lead, onClose }: { lead: DashboardLead; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'score' | 'info' | 'actions'>('score')
  const stageIdx = lead.ai_stage ? AI_STAGES.indexOf(lead.ai_stage) : -1

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-900/95 backdrop-blur-2xl border-l border-white/[0.08] z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <SmartScoreRing score={lead.smartscore} size={44} />
          <div>
            <h3 className="font-bold text-zinc-100 text-sm">{lead.name}</h3>
            <p className="text-xs text-zinc-500">{lead.phone}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
        <TierBadge tier={lead.tier} />
        <SourcePill source={lead.source} />
        <span className="ml-auto text-[11px] text-zinc-500 capitalize">{lead.pipeline_status}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(['score', 'info', 'actions'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${activeTab === t ? 'text-amber-400 border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'score' && (
          <div className="space-y-5">
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <SmartScoreRing score={lead.smartscore} size={80} />
                <p className="text-xs text-zinc-500 mt-2">SmartScore™</p>
              </div>
            </div>
            {lead.score_breakdown && <ScoreBreakdown breakdown={lead.score_breakdown} />}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase mb-3">Tharaga AI Progress</h4>
              <div className="space-y-2">
                {AI_STAGES.map((stage, i) => {
                  const done    = i <= stageIdx
                  const current = i === stageIdx
                  return (
                    <div key={stage} className={`flex items-center gap-2.5 ${done ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${current ? 'bg-amber-500/20 border-amber-500/40' : done ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                        <span className="text-[9px]">{done && !current ? '✓' : String(i + 1)}</span>
                      </div>
                      <span className={`text-[11px] ${current ? 'text-amber-400 font-semibold' : done ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {AI_STAGE_LABELS[stage]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase mb-2">Lead Info</p>
            {[
              { label: 'Budget',    value: lead.budget    ? `₹${(lead.budget / 100000).toFixed(1)}L` : '—' },
              { label: 'Purpose',   value: lead.purpose   ?? '—' },
              { label: 'Source',    value: lead.source    ?? '—' },
              { label: 'Assigned',  value: lead.assigned_to ?? 'Unassigned' },
              { label: 'Location',  value: lead.preferred_location ?? '—' },
              { label: 'Property',  value: lead.property_type_interest ?? '—' },
              { label: 'Campaign',  value: lead.utm_campaign ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-zinc-500">{row.label}</span>
                <span className="text-zinc-200 font-medium truncate max-w-[150px]">{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Call Now',      icon: <Phone className="w-3.5 h-3.5" />,       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15' },
                { label: 'WhatsApp',      icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/15' },
                { label: 'Schedule Visit',icon: <Calendar className="w-3.5 h-3.5" />,     color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15' },
                { label: 'Mark Booked',   icon: <ChevronRight className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15' },
              ].map(btn => (
                <button key={btn.label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-semibold ${btn.color} transition-all duration-200`}>
                  {btn.icon}{btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

function KanbanCard({ lead, onClick }: { lead: DashboardLead; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-amber-500/20 hover:bg-white/[0.06] cursor-pointer transition-all duration-200 space-y-2"
    >
      <div className="flex items-center gap-2">
        <SmartScoreRing score={lead.smartscore} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-zinc-200 truncate">{lead.name}</p>
          <p className="text-[10px] text-zinc-500">{lead.budget ? `₹${(lead.budget / 100000).toFixed(0)}L` : lead.source ?? '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <TierBadge tier={lead.tier} showEmoji={false} />
        <SourcePill source={lead.source} />
      </div>
      <div className="flex items-center justify-between">
        <TharagaAIStagePill stage={lead.ai_stage} />
        <SlaTimer deadline={lead.sla_deadline} tier={lead.tier} />
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeadsPipelineSection() {
  const { builderId, builderProfile } = useBuilderAuth()
  const isAdmin = builderProfile?.email === 'tharagarealestate@gmail.com'
  const { leads, stats, loading, error, refetch } = useDashboardData(builderId, isAdmin)

  const [view,         setView]         = useState<'list' | 'kanban'>('list')
  const [filter,       setFilter]       = useState<Tier | 'ALL'>('ALL')
  const [search,       setSearch]       = useState('')
  const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null)
  const [sortBy,       setSortBy]       = useState<'score' | 'sla' | 'name'>('score')

  const filtered = useMemo(() => {
    let arr = [...leads]
    if (filter !== 'ALL') arr = arr.filter(l => l.tier === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q))
    }
    if (sortBy === 'score') arr.sort((a, b) => b.smartscore - a.smartscore)
    if (sortBy === 'sla')   arr.sort((a, b) => {
      const ta = a.sla_deadline ? new Date(a.sla_deadline).getTime() : Infinity
      const tb = b.sla_deadline ? new Date(b.sla_deadline).getTime() : Infinity
      return ta - tb
    })
    if (sortBy === 'name')  arr.sort((a, b) => a.name.localeCompare(b.name))
    return arr
  }, [leads, filter, search, sortBy])

  if (loading) return <DashboardSkeleton rows={6} />
  if (error)   return <ErrorDisplay message={error} onRetry={refetch} />

  if (leads.length === 0) return (
    <EmptyState
      title="No leads yet"
      description="Your leads will appear here once buyers start enquiring via your properties or Meta Ads."
      primaryAction={{ label: 'Connect Meta Ads', onClick: () => {} }}
    />
  )

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Users className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Leads &amp; Pipeline</h1>
          <p className="text-xs text-zinc-500">{leads.length} total · SmartScore ranked</p>
        </div>
        <button className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Lead
        </button>
      </div>

      {/* ── Filter + search bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tier tabs */}
        <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.07] p-1 gap-1">
          {(['ALL', 'HOT', 'WARM', 'COOL'] as const).map(t => {
            const emoji  = { ALL: '📋', HOT: '🔥', WARM: '⚡', COOL: '🧊' }[t]
            const count  = t === 'ALL' ? leads.length : leads.filter(l => l.tier === t).length
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${filter === t ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {emoji} {t} {t !== 'ALL' && <span className="opacity-60">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/40"
          >
            <option value="score">By Score</option>
            <option value="sla">By SLA</option>
            <option value="name">By Name</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.07] p-1 gap-1">
          <button onClick={() => setView('list')}   className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${view === 'list'   ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}><List className="w-3.5 h-3.5" /></button>
          <button onClick={() => setView('kanban')} className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${view === 'kanban' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* ── Stats summary ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Showing',     value: String(filtered.length),                                                     color: 'text-zinc-100' },
          { label: 'HOT 🔥',      value: String(filtered.filter(l => l.tier === 'HOT').length),                       color: 'text-red-400'  },
          { label: 'SLA Breached',value: String(filtered.filter(l => l.sla_deadline && new Date(l.sla_deadline).getTime() < Date.now()).length), color: 'text-red-400' },
          { label: 'In Booking',  value: String(filtered.filter(l => l.ai_stage === 'BOOKING').length),               color: 'text-emerald-400' },
        ].map(s => (
          <GlassCard key={s.label} className="px-4 py-3 flex items-center gap-3">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-zinc-500">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── List View ───────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <GlassCard className="overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_100px_80px_110px_100px] gap-4 px-5 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            <span>Score</span>
            <span>Lead</span>
            <span>Tier</span>
            <span>Status</span>
            <span className="hidden sm:block">AI Stage</span>
            <span>SLA</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map(lead => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedLead(lead)}
                className="grid grid-cols-[48px_1fr_100px_80px_110px_100px] gap-4 px-5 py-3.5 hover:bg-white/[0.03] cursor-pointer transition-colors items-center"
              >
                <SmartScoreRing score={lead.smartscore} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 truncate">{lead.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{lead.phone}</span>
                    <SourcePill source={lead.source} />
                  </div>
                </div>
                <TierBadge tier={lead.tier} />
                <span className="text-[11px] text-zinc-400 capitalize truncate">{lead.pipeline_status}</span>
                <div className="hidden sm:block"><TharagaAIStagePill stage={lead.ai_stage} /></div>
                <SlaTimer deadline={lead.sla_deadline} tier={lead.tier} />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── Kanban View ─────────────────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {KANBAN_STAGES.map(({ key, label }) => {
              const stageLeads = filtered.filter(l => l.pipeline_status === key)
              return (
                <div key={key} className="w-56 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-semibold text-zinc-400">{label}</span>
                    <span className="text-[11px] font-bold text-zinc-300 bg-white/[0.06] px-1.5 py-0.5 rounded-full">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {stageLeads.map(lead => (
                      <KanbanCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="h-20 rounded-xl border border-dashed border-white/[0.08] flex items-center justify-center">
                        <span className="text-[11px] text-zinc-700">Empty</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-40"
            />
            <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
