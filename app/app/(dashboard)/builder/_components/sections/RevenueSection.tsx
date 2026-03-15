'use client'

/**
 * Revenue — Deal tracking, commissions, velocity by LION/MONKEY/DOG, monthly chart
 * Signature: Deal velocity by classification (Lion closes 3x faster)
 */

import { motion } from 'framer-motion'
import { TrendingUp, IndianRupee, Clock, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { GlassCard, ClassBadge, type Classification } from './AgenticShared'

// ─── Mock data ────────────────────────────────────────────────────────────────

const REVENUE_MONTHLY = [
  { month: 'Oct', closed: 2400000, pipeline: 5200000 },
  { month: 'Nov', closed: 3100000, pipeline: 6800000 },
  { month: 'Dec', closed: 1800000, pipeline: 4400000 },
  { month: 'Jan', closed: 4200000, pipeline: 7600000 },
  { month: 'Feb', closed: 3800000, pipeline: 8200000 },
  { month: 'Mar', closed: 5100000, pipeline: 12400000 },
]

const DEALS = [
  { name: 'Rajesh Kumar',  property: 'Prestige 3BHK',  cls: 'LION'   as Classification, value: 9800000, commission: 196000, status: 'booked',     days: 8  },
  { name: 'Suresh Babu',   property: 'Park View 4BHK', cls: 'LION'   as Classification, value: 12400000,commission: 248000, status: 'negotiation', days: 14 },
  { name: 'Meena Krishnan',property: 'OMR 2BHK',       cls: 'MONKEY' as Classification, value: 5200000, commission: 104000, status: 'site_visit',  days: 22 },
  { name: 'Venkat Raman',  property: 'Sholinganallur 3BHK', cls: 'MONKEY' as Classification, value: 6800000, commission: 136000, status: 'qualified', days: 18 },
  { name: 'Saranya Vijay', property: 'Thoraipakkam 2BHK',   cls: 'MONKEY' as Classification, value: 5800000, commission: 116000, status: 'qualified', days: 31 },
]

const VELOCITY = [
  { cls: 'LION'   as Classification, emoji: '🦁', avgDays: 12, deals: 3, conversion: 34, color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  { cls: 'MONKEY' as Classification, emoji: '🐒', avgDays: 28, deals: 6, conversion: 12, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { cls: 'DOG'    as Classification, emoji: '🐕', avgDays: 65, deals: 2, conversion: 4,  color: 'text-zinc-400',   bg: 'bg-zinc-700/30 border-zinc-600/30' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  booked:      { label: 'Booked',       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  negotiation: { label: 'Negotiation',  color: 'text-amber-400  bg-amber-500/10  border-amber-500/20'    },
  site_visit:  { label: 'Site Visit',   color: 'text-blue-400   bg-blue-500/10   border-blue-500/20'      },
  qualified:   { label: 'Qualified',    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'    },
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900/95 border border-white/[0.08] rounded-xl px-3 py-2 text-[11px]">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: ₹{(p.value / 1000000).toFixed(1)}Cr
        </p>
      ))}
    </div>
  )
}

export function RevenueSection() {
  const totalClosed   = DEALS.reduce((s, d) => s + (d.status === 'booked' ? d.value : 0), 0)
  const pipelineVal   = DEALS.reduce((s, d) => s + d.value, 0)
  const avgDeal       = Math.round(pipelineVal / DEALS.length)
  const totalComm     = DEALS.filter(d => d.status === 'booked').reduce((s, d) => s + d.commission, 0)

  const fmt = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}k`

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Revenue</h1>
          <p className="text-xs text-zinc-500">Deal tracking · Commissions · Velocity by classification</p>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Closed Revenue', value: fmt(totalClosed),  sub: 'Booked deals',     color: 'text-emerald-400', icon: '✅' },
          { label: 'Pipeline Value', value: fmt(pipelineVal),  sub: 'Active pipeline',  color: 'text-amber-400',   icon: '🔄' },
          { label: 'Avg Deal Size',  value: fmt(avgDeal),       sub: 'Across all deals', color: 'text-zinc-100',    icon: '📊' },
          { label: 'Commission',     value: fmt(totalComm),     sub: 'Earned this month',color: 'text-emerald-400', icon: '💰' },
        ].map(s => (
          <GlassCard key={s.label} className="p-5">
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-500 font-medium">{s.sub}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── Revenue chart + Deal velocity ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly chart */}
        <div className="lg:col-span-2">
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />Revenue Timeline
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Closed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/60" />Pipeline</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={REVENUE_MONTHLY} barCategoryGap="25%" barGap={4}>
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000000).toFixed(0)}Cr`} width={42} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="closed"   fill="#10B981" radius={[4, 4, 0, 0]} name="Closed"   />
                <Bar dataKey="pipeline" fill="rgba(245,158,11,0.35)" radius={[4, 4, 0, 0]} name="Pipeline" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.06] text-xs">
              <div><div className="font-bold text-emerald-400">₹2.04Cr</div><div className="text-zinc-600">Closed this month</div></div>
              <div className="text-right"><div className="font-bold text-amber-400 flex items-center gap-1 justify-end"><ArrowUpRight className="w-3 h-3" />+34%</div><div className="text-zinc-600">vs last month</div></div>
            </div>
          </GlassCard>
        </div>

        {/* Deal velocity */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Deal Velocity</h3>
          </div>
          <p className="text-[11px] text-zinc-600 mb-4">Avg days from lead to close</p>
          <div className="space-y-4">
            {VELOCITY.map(v => (
              <div key={v.cls} className={`rounded-xl border p-4 ${v.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{v.emoji}</span>
                    <span className={`text-xs font-bold ${v.color}`}>{v.cls}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${v.color}`}>{v.avgDays}d</div>
                    <div className="text-[10px] text-zinc-600">avg cycle</div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>{v.deals} active deals</span>
                  <span>{v.conversion}% conversion</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - (v.avgDays / 65) * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${v.cls === 'LION' ? 'bg-amber-500' : v.cls === 'MONKEY' ? 'bg-yellow-500' : 'bg-zinc-500'}`}
                  />
                </div>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <p className="text-[11px] text-amber-400 font-semibold">🦁 Lions close 5x faster than Dogs</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Prioritise Lion leads for maximum ROI</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Deal table ──────────────────────────────────────────────────────── */}
      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-zinc-300">Active Deals</h3>
          <span className="text-[11px] text-zinc-500">{DEALS.length} deals · {fmt(pipelineVal)} total</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {DEALS.sort((a, b) => b.value - a.value).map((deal, i) => {
            const st = STATUS_CONFIG[deal.status]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[1fr_80px_90px_80px_80px] gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{deal.name}</p>
                  <p className="text-[11px] text-zinc-500">{deal.property}</p>
                </div>
                <ClassBadge classification={deal.cls} />
                <div className="text-right">
                  <div className="text-sm font-bold text-zinc-100">{fmt(deal.value)}</div>
                  <div className="text-[10px] text-zinc-600">Comm: {fmt(deal.commission)}</div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border text-center ${st.color}`}>{st.label}</span>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-zinc-300">{deal.days}d</div>
                  <div className="text-[10px] text-zinc-600">in pipeline</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
