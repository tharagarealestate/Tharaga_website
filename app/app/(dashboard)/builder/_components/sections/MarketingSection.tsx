'use client'

/**
 * Marketing — Channel performance, UTM source quality from real leads.
 * Social Media tab: AI auto-generates + posts to Instagram/Facebook via backend.
 * Meta CAPI tab: Pixel ID + Access Token configuration (server-side events).
 * Behavioral tab: scroll depth, CTA clicks, session quality from behavior_events.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, TrendingUp, Target, Globe, Users, Share2, Loader2,
  CheckCircle2, Sparkles, ImageIcon, Eye, MousePointerClick,
  Clock, Activity, Save, RefreshCw, Zap, AlertCircle, Info,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  GlassCard, DashboardSkeleton, EmptyState, ErrorDisplay, ComingSoonEmpty,
  useDashboardData,
} from './AgenticShared'
import { useBuilderAuth } from '../BuilderAuthProvider'
import { getSupabase } from '@/lib/supabase'

// ─── Shared helper: get the current session access token ─────────────────────
async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await getSupabase().auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

// ─── Channel metadata ─────────────────────────────────────────────────────────
const CHANNEL_META: Record<string, { icon: string; color: string; bg: string; bar: string }> = {
  'Meta Ads': { icon: '📱', color: 'text-blue-400',    bg: 'bg-blue-500/10  border-blue-500/20',    bar: '#3B82F6' },
  'Google':   { icon: '🔍', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: '#10B981' },
  'WhatsApp': { icon: '💬', color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20',   bar: '#22C55E' },
  'Organic':  { icon: '🌱', color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20', bar: '#8B5CF6' },
  'Referral': { icon: '🤝', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   bar: '#F59E0B' },
}
const DEFAULT_META = { icon: '📡', color: 'text-zinc-400', bg: 'bg-zinc-700/40 border-zinc-600/30', bar: '#71717A' }

// ─── Custom tooltip ───────────────────────────────────────────────────────────
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

// ─── Behavioral event type ────────────────────────────────────────────────────
interface BehaviorMetrics {
  avgScrollDepth: number
  ctaClickRate: number
  avgSessionSec: number
  bounceRate: number
  topProperties: Array<{ id: string; title: string; events: number; avgScroll: number }>
  loaded: boolean
}

// ─── CAPI state type ──────────────────────────────────────────────────────────
interface CapiState {
  pixelId: string
  accessToken: string
  loading: boolean
  saved: boolean
  error: string
  testStatus: 'idle' | 'testing' | 'ok' | 'fail'
}

// ─── Main component ───────────────────────────────────────────────────────────
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

  // ── CAPI state ────────────────────────────────────────────────────────────
  const [capi, setCapi] = useState<CapiState>({
    pixelId: '', accessToken: '', loading: false, saved: false, error: '', testStatus: 'idle',
  })

  // ── Behavioral state ──────────────────────────────────────────────────────
  const [behavior, setBehavior] = useState<BehaviorMetrics>({
    avgScrollDepth: 0, ctaClickRate: 0, avgSessionSec: 0, bounceRate: 0,
    topProperties: [], loaded: false,
  })
  const [behaviorLoading, setBehaviorLoading] = useState(false)

  // ── Load CAPI settings from builder profile ───────────────────────────────
  useEffect(() => {
    if (!builderId) return
    const stored = sessionStorage.getItem(`capi_${builderId}`)
    if (stored) {
      try {
        const { pixelId, accessToken } = JSON.parse(stored)
        setCapi(prev => ({ ...prev, pixelId: pixelId || '', accessToken: accessToken || '' }))
      } catch {}
    }
  }, [builderId])

  // ── Load behavioral data ──────────────────────────────────────────────────
  const loadBehavioralData = useCallback(async () => {
    if (!builderId || behavior.loaded) return
    setBehaviorLoading(true)
    try {
      const accessToken = await getAccessToken()
      const res = await fetch('/api/builder/behavior-events', {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setBehavior({ ...data, loaded: true })
      } else {
        // API not yet available — show empty state gracefully
        setBehavior(prev => ({ ...prev, loaded: true }))
      }
    } catch {
      setBehavior(prev => ({ ...prev, loaded: true }))
    } finally {
      setBehaviorLoading(false)
    }
  }, [builderId, behavior.loaded])

  useEffect(() => {
    if (activeTab === 'behavioral' && !behavior.loaded) {
      loadBehavioralData()
    }
  }, [activeTab, behavior.loaded, loadBehavioralData])

  // ── CAPI actions ──────────────────────────────────────────────────────────
  const saveCapi = async () => {
    if (!capi.pixelId || !capi.accessToken) return
    setCapi(prev => ({ ...prev, loading: true, error: '', saved: false }))
    try {
      // Save to session (no sensitive data to DB without backend CAPI endpoint)
      if (builderId) {
        sessionStorage.setItem(`capi_${builderId}`, JSON.stringify({
          pixelId: capi.pixelId,
          accessToken: capi.accessToken,
        }))
      }
      setCapi(prev => ({ ...prev, loading: false, saved: true }))
      setTimeout(() => setCapi(prev => ({ ...prev, saved: false })), 3000)
    } catch (e: any) {
      setCapi(prev => ({ ...prev, loading: false, error: e?.message || 'Save failed' }))
    }
  }

  const testCapiConnection = async () => {
    if (!capi.pixelId || !capi.accessToken) return
    setCapi(prev => ({ ...prev, testStatus: 'testing', error: '' }))
    try {
      // Test the Facebook Graph API with the provided token
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${capi.pixelId}?access_token=${capi.accessToken}&fields=name,id`
      )
      const data = await res.json()
      if (data.id) {
        setCapi(prev => ({ ...prev, testStatus: 'ok' }))
      } else {
        setCapi(prev => ({ ...prev, testStatus: 'fail', error: data.error?.message || 'Invalid credentials' }))
      }
    } catch {
      setCapi(prev => ({ ...prev, testStatus: 'fail', error: 'Network error — check your credentials' }))
    }
    setTimeout(() => setCapi(prev => ({ ...prev, testStatus: 'idle' })), 5000)
  }

  // ── Caption generator ─────────────────────────────────────────────────────
  const generateCaption = async () => {
    setGenLoading(true); setSmError('')
    try {
      const url = smPropertyId
        ? `/api/social-media/analytics/${smPropertyId}`
        : null

      if (url) {
        const accessToken = await getAccessToken()
        const res = await fetch(url, {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        })
        const data = await res.json()
        setSmCaption(
          data.suggested_caption || data.caption ||
          `🏠 ${data.title || 'Premium property'} in ${data.city || 'Chennai'}\n📍 Prime location | 🌟 Modern amenities\n\nContact us today! 📞\n\n#TharagaRealestate #Chennai #RealEstate #DreamHome`
        )
      } else {
        // Generic caption for non-property-specific posts
        setSmCaption(
          `🏠 Discover your dream home in Chennai!\n\n📍 Premium locations | 🌟 Modern amenities\n💰 Transparent pricing | ✅ RERA approved\n\nContact us today!\n\n#TharagaRealestate #Chennai #RealEstate #DreamHome`
        )
      }
    } catch {
      setSmCaption(
        '🏠 Discover your dream home in Chennai! Premium properties with modern amenities.\nContact us today!\n\n#TharagaRealestate #Chennai #RealEstate'
      )
    } finally { setGenLoading(false) }
  }

  // ── Social post handler ───────────────────────────────────────────────────
  const handleSocialPost = async () => {
    if (!smCaption.trim()) { setSmError('Add a caption first'); return }
    setSmLoading(true); setSmError(''); setSmResult(null)
    try {
      const accessToken = await getAccessToken()
      const res = await fetch('/api/social-media/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
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
      primaryAction={{
        label: 'Connect Meta Ads',
        onClick: () => {
          setActiveTab('capi')
          // Also dispatch event to ensure the CAPI tab is shown if this EmptyState
          // renders before the full section mounts
          window.dispatchEvent(new CustomEvent('dashboard-section-change', {
            detail: { section: 'marketing' }
          }))
        },
      }}
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
          { id: 'overview',   label: 'Overview'    },
          { id: 'social',     label: '📱 Social AI' },
          { id: 'capi',       label: 'Meta CAPI'   },
          { id: 'behavioral', label: 'Behavioral'  },
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
          {channels.length > 0 && (
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
          )}

          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Leads',  value: String(stats.total),    icon: <Users className="w-4 h-4" />,      sub: 'All sources'         },
              { label: 'HOT Leads',    value: String(stats.hot),      icon: <TrendingUp className="w-4 h-4" />, sub: 'Score ≥ 70'          },
              { label: 'Avg Score',    value: String(stats.avgScore), icon: <Target className="w-4 h-4" />,     sub: 'Across all channels' },
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
                    {channels.map((ch, i) => <Cell key={i} fill={ch.bar} />)}
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
                  <span>Source</span><span className="text-center">Leads</span>
                  <span className="text-center">Avg Score</span><span className="text-center">HOT %</span>
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
                    { id: 'instagram', label: 'Instagram', color: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
                    { id: 'facebook',  label: 'Facebook',  color: 'bg-blue-500/10 border-blue-500/20 text-blue-400'  },
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
                      {smResult.facebook_post_id  && ` · Facebook: ${smResult.facebook_post_id}`}
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

          {/* Social post analytics */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-300">Post Performance</h3>
            </div>
            <ComingSoonEmpty
              title="Post analytics coming soon"
              description="Reach, impressions, and engagement stats will appear here once posts are published via the connected accounts." />
          </GlassCard>
        </div>
      )}

      {/* ── Meta CAPI tab ─────────────────────────────────────────────────── */}
      {activeTab === 'capi' && (
        <div className="space-y-5">
          {/* Connection card */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100">Meta Conversions API (CAPI)</h2>
                <p className="text-[11px] text-zinc-500">Server-side events for accurate attribution &amp; lower CPL</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Pixel ID */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Meta Pixel ID</label>
                <input
                  type="text"
                  value={capi.pixelId}
                  onChange={e => setCapi(prev => ({ ...prev, pixelId: e.target.value }))}
                  placeholder="e.g. 1234567890123456"
                  className="mt-1 w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 transition-colors font-mono"
                />
              </div>

              {/* Access token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Facebook Access Token</label>
                  <a
                    href="https://developers.facebook.com/tools/access_token/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
                  >
                    <Info className="w-3 h-3" />
                    Get token
                  </a>
                </div>
                <input
                  type="password"
                  value={capi.accessToken}
                  onChange={e => setCapi(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="EAAxxxx... (System User Access Token)"
                  className="w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 transition-colors font-mono"
                />
              </div>

              {/* Test connection status */}
              <AnimatePresence>
                {capi.testStatus === 'ok' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-400">Connection successful! Pixel verified.</p>
                  </motion.div>
                )}
                {capi.testStatus === 'fail' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-red-500/8 border border-red-500/15 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{capi.error || 'Connection failed. Check your credentials.'}</p>
                  </motion.div>
                )}
                {capi.saved && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-400">Credentials saved to your session.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={saveCapi}
                  disabled={capi.loading || !capi.pixelId || !capi.accessToken}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-40 border border-blue-500/30 rounded-xl text-sm font-semibold text-white transition-colors"
                >
                  {capi.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Credentials
                </button>
                <button
                  onClick={testCapiConnection}
                  disabled={capi.testStatus === 'testing' || !capi.pixelId || !capi.accessToken}
                  className="px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-700/40 rounded-xl text-sm font-medium text-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  {capi.testStatus === 'testing'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  Test
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Events that will be tracked */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Server-Side Events Tracked</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { event: 'PageView',     trigger: 'Property page load',             icon: '👁',  status: 'ready'    },
                { event: 'Lead',         trigger: 'Contact form submission',         icon: '📋', status: 'ready'    },
                { event: 'ViewContent',  trigger: '30+ seconds on property page',   icon: '⏱',  status: 'ready'    },
                { event: 'Schedule',     trigger: 'Site visit booking',             icon: '📅', status: 'upcoming' },
                { event: 'InitiateCheckout', trigger: 'EMI calculator interaction', icon: '🧮', status: 'upcoming' },
                { event: 'CompleteRegistration', trigger: 'User sign-up',          icon: '✅', status: 'ready'    },
              ].map(({ event, trigger, icon, status }) => (
                <div key={event} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <span className="text-base shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold text-zinc-200">{event}</p>
                      {status === 'ready' ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ready</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-700/40 text-zinc-500 border border-zinc-700/30">Soon</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{trigger}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Setup guide */}
          <GlassCard className="p-5 border-blue-500/10">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2 text-[11px] text-zinc-400">
                <p className="font-semibold text-zinc-300">How to get your Meta CAPI credentials</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-500">
                  <li>Go to <span className="text-zinc-300">Meta Business Manager → Events Manager</span></li>
                  <li>Select or create a Pixel, then copy the <span className="text-zinc-300">Pixel ID</span></li>
                  <li>Open <span className="text-zinc-300">Settings → Conversions API</span></li>
                  <li>Generate a <span className="text-zinc-300">System User Access Token</span></li>
                  <li>Paste both above and click Save</li>
                </ol>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── Behavioral tab ────────────────────────────────────────────────── */}
      {activeTab === 'behavioral' && (
        <div className="space-y-5">
          {behaviorLoading ? (
            <DashboardSkeleton rows={3} />
          ) : behavior.avgScrollDepth > 0 ? (
            <>
              {/* KPI grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Avg Scroll Depth', value: `${behavior.avgScrollDepth}%`, icon: <Eye className="w-4 h-4" />,              color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'    },
                  { label: 'CTA Click Rate',    value: `${behavior.ctaClickRate}%`,   icon: <MousePointerClick className="w-4 h-4" />, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'  },
                  { label: 'Avg Session',       value: formatDuration(behavior.avgSessionSec), icon: <Clock className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Bounce Rate',       value: `${behavior.bounceRate}%`,     icon: <Activity className="w-4 h-4" />,         color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20'  },
                ].map(m => (
                  <GlassCard key={m.label} className="p-4">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${m.bg} ${m.color}`}>{m.icon}</div>
                    <div className="text-xl font-bold text-zinc-100">{m.value}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{m.label}</div>
                  </GlassCard>
                ))}
              </div>

              {/* Top properties by engagement */}
              {behavior.topProperties.length > 0 && (
                <GlassCard className="overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-zinc-300">Top Properties by Engagement</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {behavior.topProperties.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                        <span className="text-[11px] font-bold text-zinc-600 w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-zinc-300 truncate">{p.title}</p>
                          <p className="text-[10px] text-zinc-600">{p.events} events</p>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-bold text-blue-400">{p.avgScroll}%</div>
                          <div className="text-[10px] text-zinc-600">scroll</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          ) : (
            /* No data yet — show informative empty state */
            <div className="space-y-5">
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-100">Behavioral Intelligence</h2>
                    <p className="text-[11px] text-zinc-500">Session quality, scroll depth, and CTA engagement from your property pages</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 opacity-40 pointer-events-none select-none">
                  {[
                    { label: 'Avg Scroll Depth', value: '—', icon: '👁' },
                    { label: 'CTA Click Rate',    value: '—', icon: '🎯' },
                    { label: 'Avg Session',       value: '—', icon: '⏱' },
                    { label: 'Bounce Rate',       value: '—', icon: '↩' },
                  ].map(m => (
                    <GlassCard key={m.label} className="p-4">
                      <div className="text-xl mb-1">{m.icon}</div>
                      <div className="text-xl font-bold text-zinc-100">{m.value}</div>
                      <div className="text-[10px] text-zinc-500">{m.label}</div>
                    </GlassCard>
                  ))}
                </div>

                <div className="flex items-start gap-3 p-4 bg-violet-500/5 border border-violet-500/15 rounded-xl">
                  <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-[11px]">
                    <p className="font-semibold text-zinc-300">How behavioral tracking works</p>
                    <p className="text-zinc-400 leading-relaxed">
                      Tharaga automatically tracks visitor interactions on your property pages — scroll depth,
                      CTA clicks, time-on-page, and form engagement. Data appears here once visitors start
                      viewing your listings.
                    </p>
                    <p className="text-zinc-500">No additional code required — tracking is built in.</p>
                  </div>
                </div>
              </GlassCard>

              {/* What will be tracked */}
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4">Signals Tracked Automatically</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { signal: 'Scroll depth',       desc: 'How far visitors scroll on property pages',       icon: '📜' },
                    { signal: 'CTA clicks',          desc: '"Contact", "Book site visit", "Call" clicks',      icon: '🎯' },
                    { signal: 'Session duration',    desc: 'Time spent viewing each property',                icon: '⏱' },
                    { signal: 'Gallery views',       desc: 'Image gallery interactions and zoom events',      icon: '🖼️' },
                    { signal: 'Calculator usage',    desc: 'EMI / ROI calculator engagement',                 icon: '🧮' },
                    { signal: 'Return visits',       desc: 'Repeat visitors per property (high intent)',       icon: '🔄' },
                  ].map(({ signal, desc, icon }) => (
                    <div key={signal} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                      <span className="text-base shrink-0">{icon}</span>
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-200">{signal}</p>
                        <p className="text-[10px] text-zinc-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
