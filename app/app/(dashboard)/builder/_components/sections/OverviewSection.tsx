'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, Zap, AlertTriangle,
  MessageSquare, Building2, Users, ArrowUpRight, RefreshCw, ChevronRight, Activity,
} from 'lucide-react'
import {
  SmartScoreRing, TierBadge, SlaTimer, GlassCard,
  DashboardSkeleton, ErrorDisplay, EmptyState,
  useDashboardData, TIER_CONFIG, AI_STAGE_LABELS,
  type DashboardLead, type Tier,
} from './AgenticShared'
import { useBuilderAuth } from '../BuilderAuthProvider'

const PIPELINE_DISPLAY = [
  'new', 'contacted', 'qualified', 'converted',
]
const PIPELINE_LABELS: Record<string, string> = {
  new: 'New Leads', contacted: 'Contacted', qualified: 'Qualified',
  converted: 'Converted', lost: 'Lost',
}

const QUICK_ACTIONS = [
  { label: 'Add Lead',       icon: Users,      color: 'text-amber-400  bg-amber-500/10  border-amber-500/20',    section: 'leads'      },
  { label: 'Add Property',   icon: Building2,  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', section: 'properties' },
  { label: 'Run Campaign',   icon: Zap,        color: 'text-blue-400   bg-blue-500/10   border-blue-500/20',      section: 'marketing'  },
  { label: 'View Analytics', icon: TrendingUp, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',   section: 'analytics'  },
]

const fade    = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

export function OverviewSection() {
  const { builderId, builderProfile } = useBuilderAuth()
  const isAdmin = builderProfile?.email === 'tharagarealestate@gmail.com'
  const { leads, stats, loading, error, refetch } = useDashboardData(builderId, isAdmin)
  const [ts, setTs] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setTs(new Date()), 60000); return () => clearInterval(t) }, [])

  const nav = (s: string) => window.dispatchEvent(new CustomEvent('builder-navigate', { detail: { section: s } }))

  if (loading) return <DashboardSkeleton />
  if (error)   return <ErrorDisplay message={error} onRetry={refetch} />

  if (stats.total === 0) return (
    <EmptyState
      icon={<LayoutDashboard className="w-6 h-6" />}
      title="Welcome to your Command Centre"
      description="Start by adding a property or connecting your Meta Ads to capture your first leads automatically."
      primaryAction={{ label: 'Add First Property', onClick: () => nav('properties') }}
      secondaryAction={{ label: 'Connect Meta Ads', href: '/builder?section=marketing' }}
    />
  )

  const hotLeads  = leads.filter(l => l.tier === 'HOT')
  const breached  = leads.filter(l => l.tier === 'HOT' && l.sla_deadline && new Date(l.sla_deadline).getTime() < Date.now())
  const urgent    = leads.filter(l => l.tier === 'HOT' && l.sla_deadline && (() => { const t = new Date(l.sla_deadline!).getTime(); return t > Date.now() && t - Date.now() < 15 * 60 * 1000 })())
  const todayLeads = leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString())

  // Pipeline funnel from real data
  const maxCount = Math.max(...PIPELINE_DISPLAY.map(s => stats.pipelineCounts[s] ?? 0), 1)
  const pipelineItems = PIPELINE_DISPLAY.map(s => ({
    label: PIPELINE_LABELS[s],
    count: stats.pipelineCounts[s] ?? 0,
    pct: Math.round(((stats.pipelineCounts[s] ?? 0) / maxCount) * 100),
  }))

  // Recent Tharaga AI activity
  const recentAI = leads.filter(l => l.ai_stage !== null).slice(0, 3)

  function TierCard({ tier }: { tier: Tier }) {
    const cfg = TIER_CONFIG[tier]
    const tLeads = leads.filter(l => l.tier === tier)
    const avg = tLeads.length > 0 ? Math.round(tLeads.reduce((s, l) => s + l.smartscore, 0) / tLeads.length) : 0
    return (
      <motion.div variants={fade}>
        <GlassCard glow={tier === 'HOT'} className={`p-5 border-t-2 ${cfg.border}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span className="text-xl">{cfg.emoji}</span><span className="text-sm font-bold text-zinc-100 uppercase tracking-wide">{cfg.label}</span></div>
            <span className="text-2xl font-bold text-zinc-100">{tLeads.length}</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Avg Score</span><span className="font-semibold text-zinc-200">{avg}</span></div>
            {tier === 'HOT' && <div className="flex justify-between"><span className="text-zinc-500">SLA Breaches</span><span className={`font-semibold ${breached.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{breached.length}</span></div>}
            <div className="flex justify-between"><span className="text-zinc-500">Active today</span><span className="font-semibold text-zinc-300">{todayLeads.filter(l => l.tier === tier).length}</span></div>
          </div>
        </GlassCard>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Command Centre</h1>
            <p className="text-xs text-zinc-500">
              {ts.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              <span className="text-emerald-400 font-medium">● Live</span>
            </p>
          </div>
        </div>
        <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition-all">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',    value: String(stats.total),           sub: `${todayLeads.length} today`,     icon: <Users className="w-4 h-4" />,      accent: false },
          { label: '🔥 Hot Leads',   value: String(stats.hot),             sub: breached.length > 0 ? `${breached.length} breached` : 'All on track', icon: <Activity className="w-4 h-4" />, accent: true  },
          { label: 'Avg SmartScore', value: String(stats.avgScore),        sub: 'Live average',                   icon: <TrendingUp className="w-4 h-4" />, accent: false },
          { label: 'In Booking',     value: String(stats.inBooking),       sub: 'Tharaga AI active',               icon: <MessageSquare className="w-4 h-4" />, accent: false },
        ].map(m => (
          <motion.div key={m.label} variants={fade}>
            <GlassCard glow={m.accent} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${m.accent ? 'bg-red-500/15 border-red-500/25 text-red-400' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400'}`}>{m.icon}</div>
                {m.sub && <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">{m.sub}</span>}
              </div>
              <div className={`text-2xl font-bold mb-1 ${m.accent ? 'text-red-400' : 'text-zinc-100'}`}>{m.value}</div>
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{m.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tier cards ─────────────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TierCard tier="HOT"  />
        <TierCard tier="WARM" />
        <TierCard tier="COOL" />
      </motion.div>

      {/* ── Funnel + SLA ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Pipeline Funnel</h3>
              <span className="text-xs text-zinc-500">{stats.total} leads total</span>
            </div>
            {pipelineItems.every(p => p.count === 0) ? (
              <p className="text-zinc-600 text-sm py-4 text-center">No pipeline data yet</p>
            ) : (
              <div className="space-y-2">
                {pipelineItems.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-24 text-[11px] text-zinc-500 text-right flex-shrink-0">{s.label}</div>
                    <div className="flex-1 h-5 rounded bg-white/[0.03] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded ${i === 0 ? 'bg-amber-500/45' : i === 1 ? 'bg-amber-500/30' : i === 2 ? 'bg-amber-500/20' : 'bg-emerald-500/40'}`} />
                    </div>
                    <div className="w-6 text-[11px] font-bold text-zinc-200 flex-shrink-0 text-right">{s.count}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="lg:col-span-2">
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />SLA Alerts
              </h3>
              <span className="text-[11px] text-red-400 font-semibold">{breached.length + urgent.length} urgent</span>
            </div>
            {[...breached, ...urgent].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"><Activity className="w-4 h-4 text-emerald-400" /></div>
                <p className="text-xs text-zinc-500">All hot leads on track</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...breached, ...urgent].slice(0, 4).map(lead => (
                  <div key={lead.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${breached.includes(lead) ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/15'}`}>
                    <SmartScoreRing score={lead.smartscore} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{lead.name}</p>
                      <p className="text-[10px] text-zinc-500">{lead.phone}</p>
                    </div>
                    <SlaTimer deadline={lead.sla_deadline} tier={lead.tier} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Tharaga AI + Quick Actions ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-3">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />Tharaga AI — Active Conversations
              </h3>
              <button onClick={() => nav('automations')} className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {recentAI.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2"><MessageSquare className="w-4 h-4 text-emerald-400" /></div>
                <p className="text-xs text-zinc-500">No active AI conversations yet</p>
                <p className="text-[11px] text-zinc-700 mt-1">Tharaga AI will engage leads automatically when they arrive</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAI.map(lead => (
                  <div key={lead.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-400">{lead.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-zinc-200">{lead.name}</span>
                        <TierBadge tier={lead.tier} showEmoji={false} />
                      </div>
                      <p className="text-[10px] text-zinc-500">{lead.phone}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500">
                          Tharaga AI: {AI_STAGE_LABELS[lead.ai_stage!]}
                        </span>
                      </div>
                    </div>
                    <SlaTimer deadline={lead.sla_deadline} tier={lead.tier} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <GlassCard className="p-5 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {QUICK_ACTIONS.map(a => (
                <motion.button key={a.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => nav(a.section)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border ${a.color} transition-all duration-200`}>
                  <a.icon className="w-5 h-5" />
                  <span className="text-[11px] font-semibold leading-tight text-center">{a.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">Today</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="flex justify-between text-xs">
                <div><div className="font-bold text-zinc-100">{todayLeads.length}</div><div className="text-zinc-600">New</div></div>
                <div><div className="font-bold text-red-400">{todayLeads.filter(l => l.tier === 'HOT').length}</div><div className="text-zinc-600">Hot</div></div>
                <div><div className="font-bold text-emerald-400">{stats.inBooking}</div><div className="text-zinc-600">Booking</div></div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
