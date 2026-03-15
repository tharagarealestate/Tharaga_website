'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, Zap, AlertTriangle,
  MessageSquare, Building2, Users, ArrowUpRight,
  RefreshCw, ChevronRight, Activity,
} from 'lucide-react'
import {
  SmartScoreRing, ClassBadge, SlaTimer, MOCK_LEADS,
  GlassCard, type Classification,
} from './AgenticShared'

const PIPELINE_STAGES = [
  { label: 'Lead Capture', count: 24, pct: 100 },
  { label: 'New Lead',     count: 19, pct: 79  },
  { label: 'Contacted',    count: 14, pct: 58  },
  { label: 'Qualified',    count: 9,  pct: 38  },
  { label: 'Site Visit',   count: 6,  pct: 25  },
  { label: 'Negotiation',  count: 3,  pct: 13  },
  { label: 'Booked',       count: 2,  pct: 8   },
  { label: 'Closed Won',   count: 1,  pct: 4   },
]

const PRIYA_LIVE = [
  { name: 'Rajesh Kumar',   stage: 'BOOKING',       time: '2m ago',  message: "Yes I'm available Saturday 11am for the site visit.",       cls: 'LION'   as Classification },
  { name: 'Meena Krishnan', stage: 'BUDGET_CHECK',  time: '8m ago',  message: "My budget is around 50 lakhs. Is there anything available?", cls: 'MONKEY' as Classification },
  { name: 'Venkat Raman',   stage: 'QUALIFICATION', time: '15m ago', message: "Looking for a 3BHK in OMR or Sholinganallur area.",           cls: 'MONKEY' as Classification },
]

const QUICK_ACTIONS = [
  { label: 'Add Lead',       icon: Users,      color: 'text-amber-400  bg-amber-500/10  border-amber-500/20',    section: 'leads'      },
  { label: 'Add Property',   icon: Building2,  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', section: 'properties' },
  { label: 'Run Campaign',   icon: Zap,        color: 'text-blue-400   bg-blue-500/10   border-blue-500/20',      section: 'marketing'  },
  { label: 'View Analytics', icon: TrendingUp, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',   section: 'analytics'  },
]

const fade    = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

export function OverviewSection() {
  const [ts, setTs] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTs(new Date()), 60000); return () => clearInterval(t) }, [])

  const lions   = MOCK_LEADS.filter(l => l.classification === 'LION')
  const monkeys = MOCK_LEADS.filter(l => l.classification === 'MONKEY')
  const dogs    = MOCK_LEADS.filter(l => l.classification === 'DOG')
  const breached = MOCK_LEADS.filter(l => l.classification === 'LION' && l.slaDeadline.getTime() < Date.now())
  const urgent   = MOCK_LEADS.filter(l => l.classification === 'LION' && l.slaDeadline.getTime() > Date.now() && l.slaDeadline.getTime() - Date.now() < 15 * 60 * 1000)
  const avgScore = Math.round(MOCK_LEADS.reduce((s, l) => s + l.smartScore, 0) / MOCK_LEADS.length)
  const nav = (s: string) => window.dispatchEvent(new CustomEvent('builder-navigate', { detail: { section: s } }))

  function ClassCol({ type, emoji, leads, conv, border }: { type: string; emoji: string; leads: typeof lions; conv: number; border: string }) {
    const avg = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.smartScore, 0) / leads.length) : 0
    return (
      <motion.div variants={fade}>
        <GlassCard glow={type === 'LION'} className={`p-5 border-t-2 ${border}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span className="text-xl">{emoji}</span><span className="text-sm font-bold text-zinc-100 uppercase tracking-wide">{type}</span></div>
            <span className="text-2xl font-bold text-zinc-100">{leads.length}</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Avg Score</span><span className="font-semibold text-zinc-200">{avg}</span></div>
            {type === 'LION' && <div className="flex justify-between"><span className="text-zinc-500">SLA Breaches</span><span className={`font-semibold ${breached.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{breached.length}</span></div>}
            <div className="flex justify-between"><span className="text-zinc-500">Conversion</span><span className="font-semibold text-zinc-200">{conv}%</span></div>
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
        <button onClick={() => setTs(new Date())}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition-all">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',    value: String(MOCK_LEADS.length), sub: '+3 today',            icon: <Users className="w-4 h-4" />,      accent: false },
          { label: '🦁 Hot Lions',   value: String(lions.length),      sub: breached.length > 0 ? `${breached.length} breached` : 'On track', icon: <Activity className="w-4 h-4" />, accent: true },
          { label: 'Avg SmartScore', value: String(avgScore),          sub: '↑2 vs yesterday',     icon: <TrendingUp className="w-4 h-4" />, accent: false },
          { label: 'Pipeline Value', value: '₹4.8Cr',                  sub: '+₹60L this week',     icon: <TrendingUp className="w-4 h-4" />, accent: false },
        ].map(m => (
          <motion.div key={m.label} variants={fade}>
            <GlassCard glow={m.accent} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${m.accent ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400'}`}>{m.icon}</div>
                {m.sub && <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">{m.sub}</span>}
              </div>
              <div className={`text-2xl font-bold mb-1 ${m.accent ? 'text-amber-400' : 'text-zinc-100'}`}>{m.value}</div>
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{m.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Classification cards ────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ClassCol type="LION"   emoji="🦁" leads={lions}   conv={34} border="border-amber-500/50" />
        <ClassCol type="MONKEY" emoji="🐒" leads={monkeys} conv={12} border="border-yellow-500/40" />
        <ClassCol type="DOG"    emoji="🐕" leads={dogs}    conv={4}  border="border-zinc-700/60"  />
      </motion.div>

      {/* ── Funnel + SLA ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Pipeline Funnel</h3>
              <span className="text-xs text-zinc-500">24 total</span>
            </div>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-28 text-[11px] text-zinc-500 text-right flex-shrink-0">{s.label}</div>
                  <div className="flex-1 h-5 rounded bg-white/[0.03] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded ${i === 0 ? 'bg-amber-500/45' : i <= 2 ? 'bg-amber-500/28' : i <= 4 ? 'bg-amber-500/18' : 'bg-emerald-500/40'}`}
                    />
                  </div>
                  <div className="w-6 text-[11px] font-bold text-zinc-200 flex-shrink-0 text-right">{s.count}</div>
                </div>
              ))}
            </div>
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
                <p className="text-xs text-zinc-500">All Lions on track</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...breached, ...urgent].map(lead => (
                  <div key={lead.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${breached.includes(lead) ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/15'}`}>
                    <SmartScoreRing score={lead.smartScore} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{lead.name}</p>
                      <p className="text-[10px] text-zinc-500">{lead.assignedTo}</p>
                    </div>
                    <SlaTimer deadline={lead.slaDeadline} classification={lead.classification} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Priya + Quick Actions ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-3">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />AI Priya — Live
              </h3>
              <button onClick={() => nav('automations')} className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              {PRIYA_LIVE.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-400">{c.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-zinc-200">{c.name}</span>
                      <ClassBadge classification={c.cls} showEmoji={false} />
                      <span className="text-[10px] text-zinc-600 ml-auto">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">{c.message}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-zinc-500">{c.stage.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                <div><div className="font-bold text-zinc-100">3</div><div className="text-zinc-600">New</div></div>
                <div><div className="font-bold text-amber-400">1</div><div className="text-zinc-600">Visits</div></div>
                <div><div className="font-bold text-emerald-400">1</div><div className="text-zinc-600">Booked</div></div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
