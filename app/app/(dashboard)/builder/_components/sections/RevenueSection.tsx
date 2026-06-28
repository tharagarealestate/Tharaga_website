'use client'

/**
 * Revenue — Pipeline value from real leads, deal velocity by tier.
 * No closed-deal revenue API → revenue chart uses ComingSoonEmpty.
 * Budget data from leads is used for pipeline estimation.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, IndianRupee, Clock } from 'lucide-react'
import {
  GlassCard, TierBadge, DashboardSkeleton, EmptyState, ErrorDisplay, ComingSoonEmpty,
  TIER_CONFIG, useDashboardData,
  type Tier,
} from './AgenticShared'
import { useBuilderAuth } from '../BuilderAuthProvider'

const fmt = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${(n / 1000).toFixed(0)}k`

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:       { label: 'New',        color: 'text-zinc-400    bg-zinc-700/40  border-zinc-600/30'      },
  contacted: { label: 'Contacted',  color: 'text-blue-400   bg-blue-500/10  border-blue-500/20'       },
  qualified: { label: 'Qualified',  color: 'text-amber-400  bg-amber-500/10  border-amber-500/20'     },
  converted: { label: 'Converted',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  lost:      { label: 'Lost',       color: 'text-red-400    bg-red-500/10   border-red-500/20'         },
}

const VELOCITY_CONFIG: Record<Tier, { label: string; avgDays: number; color: string; bar: string }> = {
  HOT:  { label: 'HOT — Exec Priority',  avgDays: 12, color: 'text-red-400    bg-red-500/10  border-red-500/20',    bar: 'bg-red-500'    },
  WARM: { label: 'WARM — Round Robin',   avgDays: 28, color: 'text-amber-400  bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500'  },
  COOL: { label: 'COOL — Nurture Pool',  avgDays: 65, color: 'text-zinc-400   bg-zinc-700/30  border-zinc-600/30',  bar: 'bg-zinc-500'   },
}

export function RevenueSection() {
  const { builderId, builderProfile } = useBuilderAuth()
  const isAdmin = builderProfile?.email === 'tharagarealestate@gmail.com'
  const { leads, stats, loading, error, refetch } = useDashboardData(builderId, isAdmin)

  const pipelineLeads = useMemo(() =>
    leads.filter(l => l.budget && l.budget > 0).sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0)),
    [leads]
  )

  const pipelineValue = useMemo(() =>
    pipelineLeads.reduce((s, l) => s + (l.budget ?? 0), 0),
    [pipelineLeads]
  )

  const hotPipelineValue = useMemo(() =>
    pipelineLeads.filter(l => l.tier === 'HOT').reduce((s, l) => s + (l.budget ?? 0), 0),
    [pipelineLeads]
  )

  const avgDeal = pipelineLeads.length > 0
    ? Math.round(pipelineValue / pipelineLeads.length)
    : 0

  if (loading) return <DashboardSkeleton rows={5} />
  if (error)   return <ErrorDisplay message={error} onRetry={refetch} />

  if (leads.length === 0) return (
    <EmptyState
      title="No revenue data yet"
      description="Pipeline value and deal tracking will appear here once you have leads with budget information."
      primaryAction={{ label: 'Connect Meta Ads', onClick: () => {} }}
    />
  )

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Revenue</h1>
          <p className="text-xs text-zinc-500">Pipeline value · Deal tracking · Velocity by tier</p>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pipeline Value',  value: fmt(pipelineValue),    sub: `${pipelineLeads.length} leads with budget`, color: 'text-amber-400',   icon: '🔄' },
          { label: 'HOT Pipeline',    value: fmt(hotPipelineValue), sub: `${stats.hot} HOT leads`,                    color: 'text-red-400',     icon: '🔥' },
          { label: 'Avg Budget',      value: avgDeal > 0 ? fmt(avgDeal) : '—', sub: 'Per lead with budget',           color: 'text-zinc-100',    icon: '📊' },
          { label: 'Total Leads',     value: String(stats.total),   sub: `${stats.pipelineCounts['converted'] ?? 0} converted`, color: 'text-emerald-400', icon: '👥' },
        ].map(s => (
          <GlassCard key={s.label} className="p-5">
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-zinc-500">{s.sub}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── Revenue chart + Deal velocity ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart — no historical data */}
        <div className="lg:col-span-2">
          <GlassCard className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-sm font-semibold text-zinc-300">Revenue Timeline</h3>
            </div>
            <ComingSoonEmpty
              title="Revenue tracking not connected"
              description="Monthly closed revenue chart will appear here once deals are marked as converted and revenue data is synced."
            />
          </GlassCard>
        </div>

        {/* Deal velocity by tier */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Deal Velocity</h3>
          </div>
          <p className="text-[11px] text-zinc-600 mb-4">Industry benchmarks by tier</p>
          <div className="space-y-4">
            {(['HOT', 'WARM', 'COOL'] as const).map(tier => {
              const v     = VELOCITY_CONFIG[tier]
              const count = leads.filter(l => l.tier === tier).length
              return (
                <div key={tier} className={`rounded-xl border p-4 ${v.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TIER_CONFIG[tier].emoji}</span>
                      <span className={`text-xs font-bold ${v.color.split(' ')[0]}`}>{tier}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${v.color.split(' ')[0]}`}>{v.avgDays}d</div>
                      <div className="text-[10px] text-zinc-600">avg cycle</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
                    <span>{count} leads</span>
                    <span>Industry benchmark</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - (v.avgDays / 65) * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${v.bar}`}
                    />
                  </div>
                </div>
              )
            })}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <p className="text-[11px] text-amber-400 font-semibold">🔥 HOT leads close 5x faster</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Prioritise HOT leads for maximum ROI</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Pipeline table ──────────────────────────────────────────────────── */}
      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-zinc-300">Pipeline — Leads with Budget</h3>
          <span className="text-[11px] text-zinc-500">
            {pipelineLeads.length} leads · {pipelineValue > 0 ? fmt(pipelineValue) : '—'} total
          </span>
        </div>
        {pipelineLeads.length === 0 ? (
          <div className="p-6">
            <ComingSoonEmpty
              title="No budget data yet"
              description="Leads with budget information collected via Tharaga AI will appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {pipelineLeads.slice(0, 10).map((lead, i) => {
              const st = STATUS_CONFIG[lead.pipeline_status] ?? STATUS_CONFIG['new']
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[1fr_80px_100px_90px] gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{lead.name}</p>
                    <p className="text-[11px] text-zinc-500">{lead.property_type_interest ?? lead.source ?? '—'}</p>
                  </div>
                  <TierBadge tier={lead.tier} />
                  <div className="text-right">
                    <div className="text-sm font-bold text-zinc-100">{fmt(lead.budget!)}</div>
                    <div className="text-[10px] text-zinc-600">budget</div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border text-center ${st.color}`}>
                    {st.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
