'use client'

/**
 * useDashboardData — Real-time Supabase hook for all builder dashboard sections.
 * Fetches leads with Realtime postgres_changes subscription.
 * Provides computed stats (HOT/WARM/COOL counts, SLA breaches, pipeline counts).
 * NO mock data — returns empty arrays with loading/error states.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tier = 'HOT' | 'WARM' | 'COOL'

export type AIStage =
  | 'GREETING'
  | 'QUALIFICATION'
  | 'BUDGET_CHECK'
  | 'TIMELINE_CHECK'
  | 'OBJECTION_HANDLING'
  | 'BOOKING'

export const AI_STAGES: AIStage[] = [
  'GREETING', 'QUALIFICATION', 'BUDGET_CHECK',
  'TIMELINE_CHECK', 'OBJECTION_HANDLING', 'BOOKING',
]

export const AI_STAGE_LABELS: Record<AIStage, string> = {
  GREETING:           'Introduction',
  QUALIFICATION:      'Discovery',
  BUDGET_CHECK:       'Budget Check',
  TIMELINE_CHECK:     'Timeline',
  OBJECTION_HANDLING: 'Negotiation',
  BOOKING:            'Booking',
}

export const PIPELINE_STAGES = [
  'new', 'contacted', 'qualified', 'converted', 'lost',
]

export interface DashboardLead {
  id: string
  name: string
  phone: string
  email: string | null
  smartscore: number
  tier: Tier
  ai_stage: AIStage | null
  pipeline_status: string
  assigned_to: string | null
  sla_deadline: string | null
  budget: number | null
  purpose: string | null
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  score_breakdown: {
    budget?: number
    timeline?: number
    behavioral?: number
    intent?: number
  } | null
  preferred_location: string | null
  property_type_interest: string | null
  property_id: string | null
  builder_id: string | null
  created_at: string
}

export interface DashboardStats {
  total: number
  hot: number
  warm: number
  cool: number
  slaBreached: number
  slaUrgent: number
  inBooking: number
  avgScore: number
  pipelineCounts: Record<string, number>
  stageCounts: Partial<Record<AIStage, number>>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tierFromScore(score: number): Tier {
  if (score >= 70) return 'HOT'
  if (score >= 40) return 'WARM'
  return 'COOL'
}

function parseAIStage(raw: any): AIStage | null {
  // Try column first, fall back to qualification_data.stage
  const stage = raw.ai_stage ?? raw.qualification_data?.stage ?? null
  if (!stage) return null
  const upper = String(stage).toUpperCase() as AIStage
  return AI_STAGES.includes(upper) ? upper : null
}

function mapRaw(raw: any): DashboardLead {
  // smartscore column (0-100) or fall back from old score column (0-10)
  const smartscore = typeof raw.smartscore === 'number' && raw.smartscore > 0
    ? raw.smartscore
    : typeof raw.score === 'number'
      ? Math.round(raw.score * 10)
      : 0

  return {
    id: raw.id,
    name: raw.name ?? 'Unknown',
    phone: raw.phone ?? raw.phone_normalized ?? '',
    email: raw.email ?? null,
    smartscore,
    tier: tierFromScore(smartscore),
    ai_stage: parseAIStage(raw),
    pipeline_status: raw.status ?? 'new',
    assigned_to: raw.assigned_to ?? null,
    sla_deadline: raw.sla_deadline ?? null,
    budget: raw.budget ?? null,
    purpose: raw.purpose ?? null,
    source: raw.source ?? raw.utm_source ?? null,
    utm_source: raw.utm_source ?? null,
    utm_medium: raw.utm_medium ?? null,
    utm_campaign: raw.utm_campaign ?? null,
    score_breakdown: raw.score_breakdown ?? null,
    preferred_location: raw.preferred_location ?? null,
    property_type_interest: raw.property_type_interest ?? null,
    property_id: raw.property_id ?? null,
    builder_id: raw.builder_id ?? null,
    created_at: raw.created_at,
  }
}

function deriveStats(leads: DashboardLead[]): DashboardStats {
  const now = Date.now()
  const hot  = leads.filter(l => l.tier === 'HOT')
  const warm = leads.filter(l => l.tier === 'WARM')
  const cool = leads.filter(l => l.tier === 'COOL')

  const slaBreached = hot.filter(l =>
    l.sla_deadline && new Date(l.sla_deadline).getTime() < now
  )
  const slaUrgent = hot.filter(l => {
    if (!l.sla_deadline) return false
    const t = new Date(l.sla_deadline).getTime()
    return t > now && (t - now) < 15 * 60 * 1000
  })

  const pipelineCounts: Record<string, number> = {}
  const stageCounts: Partial<Record<AIStage, number>> = {}

  leads.forEach(l => {
    pipelineCounts[l.pipeline_status] = (pipelineCounts[l.pipeline_status] ?? 0) + 1
    if (l.ai_stage) {
      stageCounts[l.ai_stage] = (stageCounts[l.ai_stage] ?? 0) + 1
    }
  })

  return {
    total: leads.length,
    hot: hot.length,
    warm: warm.length,
    cool: cool.length,
    slaBreached: slaBreached.length,
    slaUrgent: slaUrgent.length,
    inBooking: leads.filter(l => l.ai_stage === 'BOOKING').length,
    avgScore: leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + l.smartscore, 0) / leads.length)
      : 0,
    pipelineCounts,
    stageCounts,
  }
}

// ─── localStorage SWR cache ───────────────────────────────────────────────────
// Leads data is cached per-builder so re-login is instant (stale-while-revalidate).
// TTL: 10 minutes. Realtime subscription keeps data fresh during the session.

const LEADS_CACHE_TTL = 10 * 60 * 1000

function leadsCacheKey(builderId: string, isAdmin: boolean): string {
  return `__tharaga_leads_${isAdmin ? 'admin' : builderId}`
}

function readLeadsCache(key: string): DashboardLead[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > LEADS_CACHE_TTL) return null
    return data as DashboardLead[]
  } catch { return null }
}

function writeLeadsCache(key: string, data: DashboardLead[]): void {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

// ─── Main hook ────────────────────────────────────────────────────────────────

interface UseDashboardDataResult {
  leads: DashboardLead[]
  stats: DashboardStats
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboardData(
  builderId: string | null,
  isAdmin = false,
): UseDashboardDataResult {
  // ── Seed from localStorage — instant render on re-login (stale-while-revalidate)
  const [leads, setLeads] = useState<DashboardLead[]>(() => {
    if (typeof window === 'undefined' || !builderId) return []
    return readLeadsCache(leadsCacheKey(builderId, isAdmin)) ?? []
  })
  // If we have cached data start non-loading; otherwise show skeleton
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined' || !builderId) return true
    return readLeadsCache(leadsCacheKey(builderId, isAdmin)) === null
  })
  const [error, setError] = useState<string | null>(null)
  const fetchCountRef     = useRef(0)

  // ── Primary fetch: goes through /api/builder/leads (Node.js → Supabase)
  // Root cause of 8-12s skeleton: browser→Supabase has cold-start TCP overhead.
  // Netlify serverless functions maintain a WARM persistent connection to Supabase,
  // reducing this to <800ms. Service role key bypasses RLS (admin/builder enforced here).
  const fetchLeads = useCallback(async () => {
    if (!builderId) { setLoading(false); return }

    const key    = leadsCacheKey(builderId, isAdmin)
    const cached = typeof window !== 'undefined' ? readLeadsCache(key) : null
    if (!cached) setLoading(true)   // spinner only when no stale data to show
    setError(null)

    const fetchId    = ++fetchCountRef.current
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 10000) // 10s max

    try {
      // Read the user's access token from the Supabase client (localStorage)
      let accessToken: string | null = null
      try {
        const { data: { session } } = await getSupabase().auth.getSession()
        accessToken = session?.access_token ?? null
      } catch { /* proceed without token — API will reject with 401 */ }

      const res = await fetch(`/api/builder/leads?limit=300`, {
        method:      'GET',
        credentials: 'include',
        signal:      controller.signal,
        headers: {
          'Content-Type':  'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      })
      clearTimeout(timeoutId)

      if (fetchId !== fetchCountRef.current) return  // stale fetch — ignore
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      const mapped = ((json.leads ?? []) as any[]).map(mapRaw)
      writeLeadsCache(key, mapped)
      setLeads(mapped)
    } catch (e: any) {
      clearTimeout(timeoutId)
      if (fetchId !== fetchCountRef.current) return  // stale fetch — ignore
      if (e?.name === 'AbortError') {
        if (!cached) setError('Dashboard data took too long to load. Please refresh.')
      } else {
        setError(e?.message ?? 'Failed to load leads')
      }
    } finally {
      if (fetchId === fetchCountRef.current) setLoading(false)
    }
  }, [builderId, isAdmin])

  // ── Initial fetch + Realtime subscription for live updates ────────────────
  useEffect(() => {
    fetchLeads()
    if (!builderId) return

    const supabase    = getSupabase()
    const channelName = `dashboard-${builderId}-${Date.now()}`
    const filterStr   = isAdmin ? undefined : `builder_id=eq.${builderId}`

    let pollInterval: ReturnType<typeof setInterval> | null = null

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'leads',
          ...(filterStr ? { filter: filterStr } : {}),
        },
        (payload) => {
          // Live update — mutate local state directly without a full refetch
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [mapRaw(payload.new), ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev =>
              prev.map(l => l.id === payload.new.id ? mapRaw(payload.new) : l)
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id
            setLeads(prev => prev.filter(l => l.id !== deletedId))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useDashboardData] Realtime channel error — polling every 60s')
          if (!pollInterval) pollInterval = setInterval(fetchLeads, 60000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [fetchLeads, builderId, isAdmin])

  // ── Absolute safety net: loading NEVER spins beyond 12 seconds ────────────
  // Even if fetch AND AbortController both fail silently, this guarantees
  // the skeleton always resolves. fetchLeads.finally is the normal path.
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoading(false), 12000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // mount-once

  return { leads, stats: deriveStats(leads), loading, error, refetch: fetchLeads }
}
