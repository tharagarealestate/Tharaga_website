'use client'

/**
 * Analytics — SmartScore distribution, conversion funnel, source quality.
 * All data derived from real leads via useDashboardData.
 * Historical trend not available — shows ComingSoonEmpty.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Target, Users, ArrowUpRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  GlassCard, DashboardSkeleton, EmptyState, ErrorDisplay, ComingSoonEmpty,
  useDashboardData,
} from './AgenticShared'
import { useBuilderAuth } from '../BuilderAuthProvider'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900/95 border border-white/[0.08] rounded-xl px-3 py-2 text-[11px]">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || p.stroke }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export function AnalyticsSection() {
  const { builderId, builderProfile } = useBuilderAuth()
  const isAdmin = builderProfile?.email === 'tharagarealestate@gmail.com'
  const { leads, stats, loading, error, refetch } = useDashboardData(builderId, isAdmin)

  // ── Derived analytics ─────────────────────────────────────────────────────

  const scoreDist = useMemo(() => {
    const buckets = [
      { range: '0–10',   min: 0,  max: 10  },
      { range: '10–20',  min: 10, max: 20  },
      { range: '20–30',  min: 20, max: 30  },
      { range: '30–40',  min: 30, max: 40  },
      { range: '40–50',  min: 40, max: 50  },
      { range: '50–60',  min: 50, max: 60  },
      { range: '60–70',  min: 60, max: 70  },
      { range: '70–80',  min: 70, max: 80  },
      { range: '80–90',  min: 80, max: 90  },
      { range: '90–100', min: 90, max: 101 },
    ]
    return buckets.map(b => ({
      range: b.range,
      count: leads.filter(l => l.smartscore >= b.min && l.smartscore < b.max).length,
      fill:  b.min >= 70 ? '#F59E0B' : b.min >= 40 ? '#EAB308' : '#71717A',
    }))
  }, [leads])

  const funnelStages = useMemo(() => {
    const total = leads.length
    if (!total) return []
    const stages = [
      { stage: 'Captured',   count: total },
      { stage: 'Contacted',  count: (stats.pipelineCounts['contacted'] ?? 0) + (stats.pipelineCounts['qualified'] ?? 0) + (stats.pipelineCounts['converted'] ?? 0) },
      { stage: 'Qualified',  count: (stats.pipelineCounts['qualified'] ?? 0) + (stats.pipelineCounts['converted'] ?? 0) },
      { stage: 'Converted',  count: stats.pipelineCounts['converted'] ?? 0 },
    ]
    return stages.map((s, i) => ({
      ...s,
      pct:  Math.round((s.count / total) * 100),
      drop: i === 0 ? 0 : Math.max(0, Math.round((1 - s.count / stages[i - 1].count) * 100)),
    }))
  }, [leads, stats])

  const sourceQuality = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number; hot: number }> = {}
    leads.forEach(l => {
      const src = l.source ?? 'Unknown'
      if (!map[src]) map[src] = { count: 0, totalScore: 0, hot: 0 }
      map[src].count++
      map[src].totalScore += l.smartscore
      if (l.tier === 'HOT') map[src].hot++
    })
    const SOURCE_COLORS: Record<string, string> = {
      'Meta Ads': '#3B82F6', 'Google': '#10B981', 'WhatsApp': '#22C55E',
      'Organic':  '#8B5CF6', 'Referral': '#F59E0B',
    }
    return Object.entries(map)
      .map(([source, d]) => ({
        source,
        volume:   d.count,
        avgScore: Math.round(d.totalScore / d.count),
        hotPct:   Math.round((d.hot / d.count) * 100),
        color:    SOURCE_COLORS[source] ?? '#71717A',
      }))
      .sort((a, b) => b.hotPct - a.hotPct)
  }, [leads])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton rows={5} />
  if (error)   return <ErrorDisplay message={error} onRetry={refetch} />

  if (leads.length === 0) return (
    <EmptyState
      title="No analytics data yet"
      description="Charts and conversion funnels will appear here once you have leads."
      primaryAction={{ label: 'Connect Meta Ads', onClick: () => {} }}
    />
  )

  const convRate = stats.total > 0
    ? Math.round(((stats.pipelineCounts['converted'] ?? 0) / stats.total) * 100)
    : 0
  const hotPct = stats.total > 0 ? Math.round((stats.hot / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Analytics</h1>
          <p className="text-xs text-zinc-500">SmartScore distribution · Funnel · Source quality</p>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',    value: String(stats.total), icon: <Users className="w-4 h-4" />,      color: 'text-zinc-100'    },
          { label: 'Avg SmartScore', value: String(stats.avgScore), icon: <Target className="w-4 h-4" />, color: 'text-amber-400'   },
          { label: 'Conversion Rate',value: `${convRate}%`,       icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400' },
          { label: 'HOT Leads',      value: `${hotPct}%`,          icon: <ArrowUpRight className="w-4 h-4" />, color: 'text-red-400'  },
        ].map(s => (
          <GlassCard key={s.label} className="p-5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 flex items-center justify-center mb-3">{s.icon}</div>
            <div className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── SmartScore histogram ────────────────────────────────────────────── */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-300">SmartScore™ Distribution</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />COOL &lt;40</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />WARM 40–70</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />HOT 70+</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={scoreDist} barCategoryGap="20%">
            <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Leads">
              {scoreDist.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* ── Funnel + Historical Trend ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Conversion Funnel</h3>
          {funnelStages.length > 0 ? (
            <div className="space-y-2">
              {funnelStages.map((stage, i) => (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-200">{stage.count}</span>
                      {stage.drop > 0 && <span className="text-red-400 text-[10px]">-{stage.drop}%</span>}
                    </div>
                  </div>
                  <div className="h-6 rounded-lg bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.pct}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-lg bg-amber-500/40"
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex justify-between text-xs">
                <div><div className="font-bold text-zinc-100">{convRate}%</div><div className="text-zinc-600">Overall conversion</div></div>
                <div><div className="font-bold text-amber-400">{stats.hot}</div><div className="text-zinc-600">HOT leads</div></div>
                <div><div className="font-bold text-emerald-400">{stats.inBooking}</div><div className="text-zinc-600">In booking</div></div>
              </div>
            </div>
          ) : (
            <ComingSoonEmpty title="No pipeline data" description="Funnel will populate as leads move through your pipeline." />
          )}
        </GlassCard>

        {/* Historical trend — no time-series data available */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">7-Day Lead Trend</h3>
          <ComingSoonEmpty
            title="Historical trend unavailable"
            description="Time-series lead trend will be available once we track daily counts. Check back soon."
          />
        </GlassCard>
      </div>

      {/* ── Source Quality Matrix ────────────────────────────────────────────── */}
      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-zinc-300">Source Quality Matrix</h3>
          <span className="text-[11px] text-zinc-500">Ranked by HOT % 🔥</span>
        </div>
        {sourceQuality.length === 0 ? (
          <div className="p-6">
            <ComingSoonEmpty title="No source data" description="Lead sources will appear here once UTM data is captured." />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            <div className="grid grid-cols-[1fr_60px_60px_60px_50px] gap-4 px-5 py-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              <span>Source</span>
              <span className="text-center">Leads</span>
              <span className="text-center">Avg Score</span>
              <span className="text-center">HOT %</span>
              <span className="text-right">UTM</span>
            </div>
            {sourceQuality.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_60px_60px_50px] gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors text-xs items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                  <span className="text-zinc-300 font-medium">{row.source}</span>
                </div>
                <div className="text-center font-bold text-zinc-200">{row.volume}</div>
                <div className="text-center font-bold text-zinc-200">{row.avgScore}</div>
                <div className={`text-center font-bold ${row.hotPct >= 30 ? 'text-red-400' : 'text-zinc-400'}`}>{row.hotPct}%</div>
                <div className="text-right text-zinc-600 text-[10px]">
                  {leads.find(l => l.source === row.source)?.utm_source ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
