'use client'

/**
 * Marketing — Channel performance, UTM source quality from real leads.
 * Social Media tab: AI auto-generates + posts to Instagram/Facebook via backend.
 * CAPI and behavioral tabs show ComingSoonEmpty (no integration data yet).
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, TrendingUp, Target, Globe, Users, Share2, Loader2, CheckCircle2, Sparkles, ImageIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  GlassCard, DashboardSkeleton, EmptyState, ErrorDisplay, ComingSoonEmpty,
  useDashboardData,
} from './AgenticShared'
import { useBuilderAuth } from '../BuilderAuthProvider'

const CHANNEL_META: Record<string, { icon: string; color: string; bg: string; bar: string }> = {
  'Meta Ads': { icon: '📱', color: 'text-blue-400',    bg: 'bg-blue-500/10  border-blue-500/20',    bar: '#3B82F6' },
  'Google':   { icon: '🔍', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: '#10B981' },
  'WhatsApp': { icon: '💬', color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20',   bar: '#22C55E' },
  'Organic':  { icon: '🌱', color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20', bar: '#8B5CF6' },
  'Referral': { icon: '🤝', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   bar: '#F59E0B' },
}
const DEFAULT_META = { icon: '📡', color: 'text-zinc-400', bg: 'bg-zinc-700/40 border-zinc-600/30', bar: '#71717A' }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900/95 border border-white/[0.08] rounded-xl px-3 py-2 text-[11px]">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill ?? p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export function MarketingSection() {
  const { builderId, builderProfile } = useBuilderAuth()
  const isAdmin = builderProfile?.email === 'tharagarealestate@gmail.com'
  const { leads, stats, loading, error, refetch } = useDashboardData(builderId, isAdmin)

  const [activeTab, setActiveTab] = useState<'overview' | 'social' | 'capi' | 'behavioral'>('overview')

  // ── Social media state ────────────────────────────────────────────────────
  const [smPropertyId, setSmPropertyId]   = useState('')
  const [smCaption, setSmCaption]         = useState('')
  const [smPlatforms, setSmPlatforms]     = useState<string[]>(['instagram', 'facebook'])
  const [smLoading, setSmLoading]         = useState(false)
  const [smError, setSmError]             = useState('')
  const [smResult, setSmResult]           = useState<any>(null)
  const [genLoading, setGenLoading]       = useState(false)

  const generateCaption = async () => {
    if (!smPropertyId) return
    setGenLoading(true); setSmError('')
    try {
      const res = await fetch(`/api/social-media/analytics/${smPropertyId}`)
      const data = await res.json()
      // Use AI to generate a caption from property data
      setSmCaption(data.suggested_caption || data.caption ||
        `🏠 Discover your dream home! ${data.title || 'Premium property'} in ${data.city || 'Chennai'}.\n📍 Prime location | 🌟 Modern amenities\n\nContact us today! 📞\n\n#TharagaRealestate #Chennai #RealEstate #DreamHome`)
    } catch {
      setSmCaption('🏠 Discover your dream home in Chennai! Premium property with modern amenities.\nContact us today!\n\n#TharagaRealestate #Chennai #RealEstate')
    } finally { setGenLoading(false) }
  }

  const handleSocialPost = async () => {
    if (!smCaption.trim()) { setSmError('Add a caption first'); return }
    setSmLoading(true); setSmError(''); setSmResult(null)
    try {
      const res = await fetch('/api/social-media/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: smPropertyId || null,
          caption: smCaption,
          platforms: smPlatforms,
          post_type: 'property',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Post failed')
      setSmResult(data)
    } catch (e: any) {
      setSmError(e.message || 'Social media post failed. Check your account connections.')
    } finally { setSmLoading(false) }
  }

  // ── Derive channel stats from real leads ──────────────────────────────────

  const channels = useMemo(() => {
    const map: Record<string, { leads: number; hot: number; totalScore: number }> = {}
    leads.forEach(l => {
      const src = l.source ?? 'Unknown'
      if (!map[src]) map[src] = { leads: 0, hot: 0, totalScore: 0 }
      map[src].leads++
      map[src].totalScore += l.smartscore
      if (l.tier === 'HOT') map[src].hot++
    })
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        leads:    d.leads,
        avgScore: Math.round(d.totalScore / d.leads),
        hotPct:   Math.round((d.hot / d.leads) * 100),
        ...( CHANNEL_META[name] ?? DEFAULT_META ),
      }))
      .sort((a, b) => b.leads - a.leads)
  }, [leads])

  const utmSources = useMemo(() => {
    const map: Record<string, { leads: number; totalScore: number; hot: number; campaign: string | null }> = {}
    leads.forEach(l => {
      const src = l.utm_source ?? l.source ?? 'direct'
      if (!map[src]) map[src] = { leads: 0, totalScore: 0, hot: 0, campaign: null }
      map[src].leads++
      map[src].totalScore += l.smartscore
      if (l.tier === 'HOT') map[src].hot++
      if (!map[src].campaign && l.utm_campaign) map[src].campaign = l.utm_campaign
    })
    return Object.entries(map)
      .map(([source, d]) => ({
        source,
        medium:   leads.find(l => (l.utm_source ?? l.source) === source)?.utm_medium ?? '—',
        leads:    d.leads,
        avgScore: Math.round(d.totalScore / d.leads),
        hotPct:   Math.round((d.hot / d.leads) * 100),
        campaign: d.campaign,
      }))
      .sort((a, b) => b.hotPct - a.hotPct)
  }, [leads])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton rows={5} />
  if (error)   return <ErrorDisplay message={error} onRetry={refetch} />

  if (leads.length === 0) return (
    <EmptyState
      title="No marketing data yet"
      description="Channel performance and UTM analytics will appear here once leads start flowing in via Meta Ads, Google, or other sources."
      primaryAction={{ label: 'Connect Meta Ads', onClick: () => {} }}
    />
  )

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Marketing</h1>
          <p className="text-xs text-zinc-500">Channel Analytics · Source Quality · UTM Attribution</p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-wrap">
        {([
          { id: 'overview',  label: 'Overview'     },
          { id: 'social',    label: '📱 Social AI'  },
          { id: 'capi',      label: 'Meta CAPI'    },
          { id: 'behavioral',label: 'Behavioral'   },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${activeTab === t.id ? 'bg-amber-500/15 border border-amber-500/25 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Channel KPI cards */}
          {channels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {channels.map(ch => (
                <motion.div key={ch.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard className={`p-4 border-t-2 ${ch.bg.split(' ')[1]}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{ch.icon}</span>
                      <span className={`text-[11px] font-bold ${ch.color}`}>{ch.name}</span>
                    </div>
                    <div className="text-xl font-bold text-zinc-100 mb-1">{ch.leads}</div>
                    <div className="text-[10px] text-zinc-500 mb-2">leads</div>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between"><span className="text-zinc-600">Avg Score</span><span className="text-zinc-300">{ch.avgScore}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-600">HOT %</span><span className={ch.hotPct >= 30 ? 'text-red-400' : 'text-zinc-300'}>{ch.hotPct}%</span></div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : null}

          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Leads',  value: String(stats.total), icon: <Users className="w-4 h-4" />,      sub: 'All sources'         },
              { label: 'HOT Leads',    value: String(stats.hot),   icon: <TrendingUp className="w-4 h-4" />, sub: 'Score ≥ 70'          },
              { label: 'Avg Score',    value: String(stats.avgScore), icon: <Target className="w-4 h-4" />, sub: 'Across all channels' },
            ].map(s => (
              <GlassCard key={s.label} className="p-5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-bold text-zinc-100 mb-0.5">{s.value}</div>
                <div className="text-[11px] text-zinc-500">{s.sub}</div>
              </GlassCard>
            ))}
          </div>

          {/* Channel bar chart */}
          {channels.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Lead Volume by Channel</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={channels} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="leads" radius={[4, 4, 0, 0]} name="Leads">
                    {channels.map((ch, i) => (
                      <Cell key={i} fill={ch.bar} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* UTM source table */}
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-400" />UTM Source Quality
              </h3>
              <span className="text-[11px] text-zinc-500">Ranked by HOT % 🔥</span>
            </div>
            {utmSources.length === 0 ? (
              <div className="p-6">
                <ComingSoonEmpty title="No UTM data" description="UTM source quality will appear once leads include utm_source parameters." />
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                <div className="grid grid-cols-[1fr_60px_60px_60px_80px] gap-4 px-5 py-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  <span>Source</span>
                  <span className="text-center">Leads</span>
                  <span className="text-center">Avg Score</span>
                  <span className="text-center">HOT %</span>
                  <span className="text-right">Campaign</span>
                </div>
                {utmSources.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_60px_60px_80px] gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors text-xs items-center">
                    <div>
                      <p className="text-zinc-300 font-medium text-[11px]">{row.source}</p>
                      <p className="text-zinc-600 text-[10px]">{row.medium}</p>
                    </div>
                    <div className="text-center font-bold text-zinc-200">{row.leads}</div>
                    <div className="text-center font-bold text-zinc-200">{row.avgScore}</div>
                    <div className={`text-center font-bold ${row.hotPct >= 30 ? 'text-red-400' : 'text-zinc-400'}`}>{row.hotPct}%</div>
                    <div className="text-right text-zinc-500 text-[11px] truncate">{row.campaign ?? 'Direct'}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* ── Social Media tab ──────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100">AI Social Media Auto-Post</h2>
                <p className="text-[11px] text-zinc-500">Generate AI captions and post to Instagram & Facebook automatically</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Property ID + AI generate */}
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Property ID (optional)</label>
                  <input value={smPropertyId} onChange={e => setSmPropertyId(e.target.value)}
                    placeholder="e.g. abc123 — leave blank for generic post"
                    className="w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors" />
                </div>
                <div className="flex items-end">
                  <button onClick={generateCaption} disabled={genLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-40 border border-purple-500/30 rounded-xl text-sm font-medium text-white transition-colors">
                    {genLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    AI Caption
                  </button>
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Caption</label>
                <textarea value={smCaption} onChange={e => setSmCaption(e.target.value)} rows={5}
                  placeholder="Write or AI-generate a caption for your property post..."
                  className="w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors resize-none" />
                <p className="text-[10px] text-zinc-600">{smCaption.length} / 2200 characters</p>
              </div>

              {/* Platforms */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Post to</label>
                <div className="flex gap-2">
                  {[
                    { id: 'instagram', label: 'Instagram',  color: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
                    { id: 'facebook',  label: 'Facebook',   color: 'bg-blue-500/10 border-blue-500/20 text-blue-400'  },
                  ].map(p => (
                    <button key={p.id}
                      onClick={() => setSmPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold transition-all ${
                        smPlatforms.includes(p.id) ? p.color : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'}`}>
                      {smPlatforms.includes(p.id) && <CheckCircle2 className="w-3 h-3" />}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {smError && <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2">{smError}</p>}

              {smResult && (
                <div className="flex items-start gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">Posted successfully!</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {smResult.instagram_post_id && `Instagram: ${smResult.instagram_post_id}`}
                      {smResult.facebook_post_id && ` · Facebook: ${smResult.facebook_post_id}`}
                    </p>
                  </div>
                </div>
              )}

              <button onClick={handleSocialPost} disabled={smLoading || smPlatforms.length === 0 || !smCaption.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all">
                {smLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                {smLoading ? 'Posting…' : `Post to ${smPlatforms.join(' & ')}`}
              </button>
            </div>
          </GlassCard>

          {/* Analytics coming soon */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-300">Post Performance</h3>
            </div>
            <ComingSoonEmpty title="Post analytics coming soon" description="Reach, impressions, and engagement stats will appear here once posts are published." />
          </GlassCard>
        </div>
      )}

      {/* ── CAPI tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'capi' && (
        <GlassCard className="p-8">
          <ComingSoonEmpty
            title="Meta CAPI not connected"
            description="Server-side Conversions API integration with Meta will appear here once CAPI is configured for your account. This enables accurate attribution, deduplication, and lower CPL."
          />
        </GlassCard>
      )}

      {/* ── Behavioral tab ────────────────────────────────────────────────── */}
      {activeTab === 'behavioral' && (
        <GlassCard className="p-8">
          <ComingSoonEmpty
            title="Behavioral signals not tracked"
            description="Scroll depth, CTA clicks, form engagement and session quality data will appear here once the behavioral tracking pixel is installed on your property pages."
          />
        </GlassCard>
      )}
    </div>
  )
}
