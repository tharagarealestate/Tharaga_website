'use client'

/**
 * Marketing — Meta CAPI, channel performance, behavioral signals, ad spend
 * Signature: CAPI Match Rate gauge + UTM source quality matrix
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, TrendingUp, Zap, Target, Activity,
  ArrowUpRight, ArrowDownRight, Globe, Eye, Users,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GlassCard } from './AgenticShared'

// ─── Mock data ────────────────────────────────────────────────────────────────

const CHANNELS = [
  { name: 'Meta Ads',  icon: '📱', leads: 38, cpl: 420, conversion: 18, spend: 15960, color: 'text-blue-400',    bg: 'bg-blue-500/10  border-blue-500/20',    bar: '#3B82F6' },
  { name: 'Google',    icon: '🔍', leads: 22, cpl: 680, conversion: 14, spend: 14960, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',bar: '#10B981' },
  { name: 'WhatsApp',  icon: '💬', leads: 14, cpl: 0,   conversion: 28, spend: 0,     color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',    bar: '#22C55E' },
  { name: 'Organic',   icon: '🌱', leads: 9,  cpl: 0,   conversion: 22, spend: 0,     color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20',  bar: '#8B5CF6' },
  { name: 'Referral',  icon: '🤝', leads: 7,  cpl: 0,   conversion: 34, spend: 0,     color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',    bar: '#F59E0B' },
]

const CAPI_EVENTS = [
  { event: 'Lead',               server: 90, pixel: 95, dedup: 4  },
  { event: 'ViewContent',        server: 72, pixel: 88, dedup: 18 },
  { event: 'InitiateCheckout',   server: 28, pixel: 31, dedup: 9  },
  { event: 'Purchase',           server: 3,  pixel: 3,  dedup: 0  },
]

const UTM_SOURCES = [
  { source: 'fb_cpc_3bhk_june', medium: 'cpc',     leads: 24, avgScore: 68, lionPct: 38, spend: 10080 },
  { source: 'google_brand',      medium: 'cpc',     leads: 12, avgScore: 74, lionPct: 42, spend: 8160  },
  { source: 'instagram_stories', medium: 'social',  leads: 14, avgScore: 55, lionPct: 21, spend: 5880  },
  { source: 'organic_seo',       medium: 'organic', leads: 9,  avgScore: 71, lionPct: 33, spend: 0     },
  { source: 'referral_agent',    medium: 'referral',leads: 7,  avgScore: 79, lionPct: 57, spend: 0     },
]

const SPEND_DATA = [
  { day: 'Mon', meta: 2240, google: 2100 }, { day: 'Tue', meta: 2800, google: 2250 },
  { day: 'Wed', meta: 2100, google: 1980 }, { day: 'Thu', meta: 3200, google: 2420 },
  { day: 'Fri', meta: 2600, google: 2180 }, { day: 'Sat', meta: 1800, google: 1620 },
  { day: 'Sun', meta: 1220, google: 1400 },
]

const BEHAVIORAL = [
  { label: '25% Scroll',  pct: 82, color: 'bg-amber-500/60' },
  { label: '50% Scroll',  pct: 61, color: 'bg-amber-500/50' },
  { label: '75% Scroll',  pct: 38, color: 'bg-amber-500/35' },
  { label: '100% Scroll', pct: 18, color: 'bg-amber-500/25' },
  { label: 'CTA Click',   pct: 24, color: 'bg-emerald-500/50'},
  { label: 'Form Start',  pct: 16, color: 'bg-blue-500/50'  },
]

// ─── CAPI gauge ───────────────────────────────────────────────────────────────

function CapiGauge({ matchRate }: { matchRate: number }) {
  const r = 52
  const circ = Math.PI * r
  const offset = circ - (matchRate / 100) * circ
  const color = matchRate >= 80 ? '#10B981' : matchRate >= 60 ? '#F59E0B' : '#EF4444'
  const label = matchRate >= 80 ? 'Excellent' : matchRate >= 60 ? 'Good' : 'Needs work'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-16 overflow-hidden">
        <svg width={120} height={70} viewBox="0 0 120 70" style={{ overflow: 'visible' }}>
          <path d="M 10 65 A 52 52 0 0 1 110 65" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
          <motion.path
            d="M 10 65 A 52 52 0 0 1 110 65"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
          <text x="60" y="60" textAnchor="middle" className="fill-zinc-100" style={{ fontSize: 22, fontWeight: 700 }}>{matchRate}%</text>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold" style={{ color }}>{label}</p>
        <p className="text-[10px] text-zinc-600">CAPI Match Rate</p>
      </div>
    </div>
  )
}

// ─── Custom tooltip for recharts ──────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900/95 border border-white/[0.08] rounded-xl px-3 py-2 text-[11px]">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>₹{(p.value / 1000).toFixed(1)}k — {p.name}</p>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MarketingSection() {
  const [activeTab, setActiveTab] = useState<'overview' | 'capi' | 'behavioral'>('overview')

  const totalLeads  = CHANNELS.reduce((s, c) => s + c.leads, 0)
  const totalSpend  = CHANNELS.reduce((s, c) => s + c.spend, 0)
  const blendedCPL  = Math.round(totalSpend / totalLeads)

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Marketing</h1>
            <p className="text-xs text-zinc-500">Meta CAPI · Channel Analytics · Behavioral Signals</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {(['overview', 'capi', 'behavioral'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${activeTab === t ? 'bg-amber-500/15 border border-amber-500/25 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Channel KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CHANNELS.map(ch => (
              <motion.div key={ch.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className={`p-4 border-t-2 ${ch.bg.split(' ')[1]}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{ch.icon}</span>
                    <span className={`text-[11px] font-bold ${ch.color}`}>{ch.name}</span>
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mb-1">{ch.leads}</div>
                  <div className="text-[10px] text-zinc-500 mb-2">leads</div>
                  <div className="space-y-1 text-[10px]">
                    {ch.spend > 0 && <div className="flex justify-between"><span className="text-zinc-600">CPL</span><span className="text-zinc-300">₹{ch.cpl}</span></div>}
                    <div className="flex justify-between"><span className="text-zinc-600">Conv.</span><span className={ch.conversion >= 25 ? 'text-emerald-400' : 'text-zinc-300'}>{ch.conversion}%</span></div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Leads', value: String(totalLeads), icon: <Users className="w-4 h-4" />, sub: 'This month' },
              { label: 'Ad Spend', value: `₹${(totalSpend / 1000).toFixed(1)}k`, icon: <TrendingUp className="w-4 h-4" />, sub: 'Meta + Google' },
              { label: 'Blended CPL', value: `₹${blendedCPL}`, icon: <Target className="w-4 h-4" />, sub: 'Across channels' },
            ].map(s => (
              <GlassCard key={s.label} className="p-5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-bold text-zinc-100 mb-0.5">{s.value}</div>
                <div className="text-[11px] text-zinc-500">{s.sub}</div>
              </GlassCard>
            ))}
          </div>

          {/* Ad Spend chart */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-amber-400" />Daily Ad Spend</h3>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Meta</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Google</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={SPEND_DATA} barCategoryGap="30%" barGap={4}>
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="meta"   fill="#3B82F6" radius={[4, 4, 0, 0]} name="Meta"   />
                <Bar dataKey="google" fill="#10B981" radius={[4, 4, 0, 0]} name="Google" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* UTM source table */}
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-amber-400" />UTM Source Quality</h3>
              <span className="text-[11px] text-zinc-500">Ranked by 🦁 Lion %</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {UTM_SOURCES.sort((a, b) => b.lionPct - a.lionPct).map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_60px_60px_70px] gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors text-xs items-center">
                  <div>
                    <p className="text-zinc-300 font-medium text-[11px] truncate">{row.source}</p>
                    <p className="text-zinc-600 text-[10px]">{row.medium}</p>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-zinc-200">{row.leads}</div>
                    <div className="text-[10px] text-zinc-600">leads</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-zinc-200">{row.avgScore}</div>
                    <div className="text-[10px] text-zinc-600">avg score</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${row.lionPct >= 40 ? 'text-amber-400' : 'text-zinc-400'}`}>{row.lionPct}%</div>
                    <div className="text-[10px] text-zinc-600">🦁 lions</div>
                  </div>
                  <div className="text-right text-zinc-500 text-[11px]">{row.spend > 0 ? `₹${(row.spend/1000).toFixed(1)}k` : 'Free'}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'capi' && (
        <>
          {/* CAPI overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard className="p-6 flex flex-col items-center gap-4">
              <h3 className="text-sm font-semibold text-zinc-300 self-start">Server-to-Pixel Match Rate</h3>
              <CapiGauge matchRate={87} />
              <div className="w-full grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-lg font-bold text-zinc-100">312</div>
                  <div className="text-zinc-600 text-[10px]">Server Events</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-lg font-bold text-zinc-100">289</div>
                  <div className="text-zinc-600 text-[10px]">Matched</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-lg font-bold text-emerald-400">42</div>
                  <div className="text-zinc-600 text-[10px]">Dedup Saved</div>
                </div>
              </div>
              <div className="w-full p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-[11px] text-emerald-400 font-semibold">Server-side CAPI is active</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">42 duplicate conversions eliminated this month — saving estimated ₹1,800 in wasted spend</p>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Event Funnel</h3>
              <div className="space-y-3">
                {CAPI_EVENTS.map((evt, i) => (
                  <div key={evt.event} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 font-medium">{evt.event}</span>
                      <div className="flex gap-3">
                        <span className="text-blue-400">Server: {evt.server}</span>
                        <span className="text-zinc-500">Pixel: {evt.pixel}</span>
                        {evt.dedup > 0 && <span className="text-amber-400">-{evt.dedup} dedup</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(evt.server / 95) * 100}%` }}
                        transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                        className="h-full rounded-l-full bg-blue-500/60"
                      />
                      <div className="flex-1 rounded-r-full bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[11px] font-semibold text-zinc-400 mb-2">Data Quality</p>
                {[
                  { label: 'Email hashed (SHA-256)', pct: 94 },
                  { label: 'Phone hashed (SHA-256)', pct: 89 },
                  { label: '_fbc cookie present', pct: 72 },
                  { label: '_fbp cookie present', pct: 68 },
                ].map(q => (
                  <div key={q.label} className="flex items-center gap-3 mb-1.5">
                    <span className="text-[10px] text-zinc-500 w-40 flex-shrink-0">{q.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500/60" style={{ width: `${q.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-400 w-8 text-right">{q.pct}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {activeTab === 'behavioral' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-amber-400" />Scroll Depth &amp; Engagement</h3>
            <div className="space-y-3">
              {BEHAVIORAL.map((b, i) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 w-24 flex-shrink-0">{b.label}</span>
                  <div className="flex-1 h-6 rounded-lg bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${b.pct}%` }}
                      transition={{ delay: 0.2 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-lg ${b.color} flex items-center pl-2`}
                    >
                      <span className="text-[10px] font-bold text-zinc-100">{b.pct}%</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Session Quality by Source</h3>
            <div className="space-y-3">
              {[
                { source: 'Referral',  avgTime: '4m 22s', scrollPct: 78, formRate: 34, color: 'text-amber-400' },
                { source: 'Organic',   avgTime: '3m 48s', scrollPct: 72, formRate: 28, color: 'text-violet-400' },
                { source: 'Google',    avgTime: '2m 15s', scrollPct: 58, formRate: 18, color: 'text-emerald-400' },
                { source: 'Meta Ads',  avgTime: '1m 42s', scrollPct: 45, formRate: 14, color: 'text-blue-400' },
                { source: 'WhatsApp',  avgTime: '3m 05s', scrollPct: 65, formRate: 24, color: 'text-green-400' },
              ].map(row => (
                <div key={row.source} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className={`text-[11px] font-bold w-20 ${row.color}`}>{row.source}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-[11px] font-semibold text-zinc-200">{row.avgTime}</div><div className="text-[9px] text-zinc-600">Avg time</div></div>
                    <div><div className="text-[11px] font-semibold text-zinc-200">{row.scrollPct}%</div><div className="text-[9px] text-zinc-600">50% scroll</div></div>
                    <div><div className={`text-[11px] font-semibold ${row.formRate >= 25 ? 'text-emerald-400' : 'text-zinc-200'}`}>{row.formRate}%</div><div className="text-[9px] text-zinc-600">Form rate</div></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
