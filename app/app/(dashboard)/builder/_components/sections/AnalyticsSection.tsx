'use client'

/**
 * Analytics — SmartScore distribution histogram, conversion funnel, source quality
 * Signature: SmartScore distribution histogram + Source Quality scatter matrix
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Target, Users, ArrowUpRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { GlassCard, MOCK_LEADS } from './AgenticShared'

// ─── Mock data ────────────────────────────────────────────────────────────────

const SCORE_DIST = [
  { range: '0–10',  count: 0  },
  { range: '10–20', count: 0  },
  { range: '20–30', count: 0  },
  { range: '30–40', count: 2  },
  { range: '40–50', count: 2  },
  { range: '50–60', count: 2  },
  { range: '60–70', count: 1  },
  { range: '70–80', count: 2  },
  { range: '80–90', count: 1  },
  { range: '90–100',count: 0  },
]

const FUNNEL_STAGES = [
  { stage: 'Lead Capture',  count: 90, drop: 0,  color: '#F59E0B' },
  { stage: 'Contacted',     count: 68, drop: 24, color: '#F59E0B' },
  { stage: 'Qualified',     count: 41, drop: 40, color: '#EAB308' },
  { stage: 'Site Visit',    count: 22, drop: 46, color: '#EAB308' },
  { stage: 'Negotiation',   count: 11, drop: 50, color: '#10B981' },
  { stage: 'Closed Won',    count: 4,  drop: 64, color: '#10B981' },
]

const LEAD_TREND = [
  { day: '9 Mar', lion: 1, monkey: 2, dog: 3 },
  { day: '10 Mar', lion: 2, monkey: 3, dog: 4 },
  { day: '11 Mar', lion: 1, monkey: 4, dog: 3 },
  { day: '12 Mar', lion: 3, monkey: 2, dog: 5 },
  { day: '13 Mar', lion: 2, monkey: 3, dog: 2 },
  { day: '14 Mar', lion: 4, monkey: 2, dog: 3 },
  { day: '15 Mar', lion: 2, monkey: 4, dog: 2 },
]

const SOURCE_QUALITY = [
  { source: 'Referral',  volume: 7,  avgScore: 79, convRate: 34, color: '#F59E0B' },
  { source: 'Organic',   volume: 9,  avgScore: 71, convRate: 22, color: '#8B5CF6' },
  { source: 'Google',    volume: 22, avgScore: 66, convRate: 14, color: '#10B981' },
  { source: 'WhatsApp',  volume: 14, avgScore: 62, convRate: 28, color: '#22C55E' },
  { source: 'Meta Ads',  volume: 38, avgScore: 55, convRate: 18, color: '#3B82F6' },
]

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

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsSection() {
  const avgScore = Math.round(MOCK_LEADS.reduce((s, l) => s + l.smartScore, 0) / MOCK_LEADS.length)
  const lionCount = MOCK_LEADS.filter(l => l.classification === 'LION').length
  const convRate = Math.round((4 / 90) * 100)

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
          { label: 'Total Leads',    value: String(MOCK_LEADS.length), icon: <Users className="w-4 h-4" />,      color: 'text-zinc-100' },
          { label: 'Avg SmartScore', value: String(avgScore),          icon: <Target className="w-4 h-4" />,     color: 'text-amber-400' },
          { label: 'Conversion Rate',value: `${convRate}%`,            icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400' },
          { label: 'Lions (70+)',    value: `${Math.round(lionCount / MOCK_LEADS.length * 100)}%`, icon: <ArrowUpRight className="w-4 h-4" />, color: 'text-amber-400' },
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
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />DOG &lt;40</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />MONKEY 40–70</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />LION 70+</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={SCORE_DIST} barCategoryGap="20%">
            <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Leads">
              {SCORE_DIST.map((entry, index) => {
                const mid = parseInt(entry.range.split('–')[0])
                const fill = mid >= 70 ? '#F59E0B' : mid >= 40 ? '#EAB308' : '#71717A'
                return <Bar key={index} fill={fill} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* ── Conversion Funnel + Lead Trend ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Conversion Funnel</h3>
          <div className="space-y-2">
            {FUNNEL_STAGES.map((stage, i) => {
              const pct = Math.round((stage.count / FUNNEL_STAGES[0].count) * 100)
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-200">{stage.count}</span>
                      {stage.drop > 0 && (
                        <span className="text-red-400 text-[10px]">-{stage.drop}%</span>
                      )}
                    </div>
                  </div>
                  <div className="h-6 rounded-lg bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-lg"
                      style={{ background: `${stage.color}${Math.round(pct * 0.4).toString(16).padStart(2, '0')}` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex justify-between text-xs">
            <div><div className="font-bold text-zinc-100">4.4%</div><div className="text-zinc-600">Overall conversion</div></div>
            <div><div className="font-bold text-amber-400">28d</div><div className="text-zinc-600">Avg sale cycle</div></div>
            <div><div className="font-bold text-emerald-400">12d</div><div className="text-zinc-600">Lion avg cycle</div></div>
          </div>
        </GlassCard>

        {/* Lead trend */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">7-Day Lead Trend</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Lion</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Monkey</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />Dog</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={LEAD_TREND}>
              <defs>
                <linearGradient id="lionGrad"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
                <linearGradient id="monkeyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#EAB308" stopOpacity={0.2} /><stop offset="95%" stopColor="#EAB308" stopOpacity={0} /></linearGradient>
                <linearGradient id="dogGrad"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#71717A" stopOpacity={0.15}/><stop offset="95%" stopColor="#71717A" stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
              <Area type="monotone" dataKey="lion"   stroke="#F59E0B" fill="url(#lionGrad)"   strokeWidth={2} dot={false} name="Lion"   />
              <Area type="monotone" dataKey="monkey" stroke="#EAB308" fill="url(#monkeyGrad)" strokeWidth={2} dot={false} name="Monkey" />
              <Area type="monotone" dataKey="dog"    stroke="#71717A" fill="url(#dogGrad)"    strokeWidth={1} dot={false} name="Dog"    />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ── Source Quality Matrix ────────────────────────────────────────────── */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Source Quality Matrix</h3>
        <p className="text-[11px] text-zinc-600 mb-5">Bubble size = conversion rate. Y-axis = avg SmartScore. X-axis = lead volume.</p>
        <div className="relative h-48 border-l border-b border-white/[0.08]">
          {/* Y axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between -ml-8 text-[10px] text-zinc-600">
            <span>90</span><span>75</span><span>60</span><span>45</span>
          </div>
          {/* X axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between translate-y-5 text-[10px] text-zinc-600">
            <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span>
          </div>
          {/* Bubbles */}
          {SOURCE_QUALITY.map((src, i) => {
            const x = (src.volume / 40) * 100
            const y = 100 - ((src.avgScore - 40) / 50) * 100
            const size = 20 + src.convRate * 0.8
            return (
              <motion.div
                key={src.source}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, type: 'spring' }}
                className="absolute flex flex-col items-center gap-1"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div
                  className="rounded-full flex items-center justify-center font-bold text-[10px] text-zinc-950"
                  style={{ width: size, height: size, background: src.color, boxShadow: `0 0 16px ${src.color}50` }}
                >
                  {src.convRate}%
                </div>
                <span className="text-[9px] text-zinc-500 whitespace-nowrap">{src.source}</span>
              </motion.div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-8 text-[10px] text-zinc-500">
          <span>🟡 Referral: highest quality, lowest volume → grow referral network</span>
          <span>🔵 Meta Ads: highest volume, medium quality → optimize targeting</span>
        </div>
      </GlassCard>
    </div>
  )
}
