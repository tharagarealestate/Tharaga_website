/**
 * GET /api/builder/behavior-events
 *
 * Returns aggregated behavioral metrics from the behavior_events table:
 *  - avgScrollDepth (%)
 *  - ctaClickRate (%)
 *  - avgSessionSec (seconds)
 *  - bounceRate (%)
 *  - topProperties (top 5 by event count)
 *
 * If the behavior_events table doesn't exist (DB not yet set up),
 * returns an empty-but-valid response so the frontend shows graceful empty state.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser, getServiceSupabase } from '../_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authed = await getBuilderUser(request)
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceSupabase()

    // ── Check if behavior_events table exists ─────────────────────────────
    // Use a try/catch around the query; if the table doesn't exist, Postgres
    // returns an error and we return the empty metrics response.
    const { data: events, error } = await serviceClient
      .from('behavior_events')
      .select('event_type,value,property_id,session_id,created_at')
      .eq('builder_id', authed.user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // last 30 days
      .limit(5000)

    if (error) {
      // Table might not exist yet — return empty metrics gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(emptyMetrics())
      }
      console.error('[behavior-events] Query error:', error.message)
      return NextResponse.json(emptyMetrics())
    }

    if (!events || events.length === 0) {
      return NextResponse.json(emptyMetrics())
    }

    // ── Aggregate metrics ─────────────────────────────────────────────────
    const scrollEvents  = events.filter(e => e.event_type === 'scroll_depth')
    const ctaEvents     = events.filter(e => e.event_type === 'cta_click')
    const sessionEvents = events.filter(e => e.event_type === 'session_end' || e.event_type === 'session_duration')
    const pageViews     = events.filter(e => e.event_type === 'page_view')

    // Average scroll depth (value = 0–100)
    const avgScrollDepth = scrollEvents.length > 0
      ? Math.round(scrollEvents.reduce((s, e) => s + Number(e.value || 0), 0) / scrollEvents.length)
      : 0

    // CTA click rate = unique sessions with CTA click / total sessions
    const totalSessions  = new Set(events.map(e => e.session_id).filter(Boolean)).size
    const ctaSessions    = new Set(ctaEvents.map(e => e.session_id).filter(Boolean)).size
    const ctaClickRate   = totalSessions > 0 ? Math.round((ctaSessions / totalSessions) * 100) : 0

    // Average session duration (seconds)
    const avgSessionSec = sessionEvents.length > 0
      ? Math.round(sessionEvents.reduce((s, e) => s + Number(e.value || 0), 0) / sessionEvents.length)
      : 0

    // Bounce rate = sessions with ≤ 1 page view event / total sessions
    const sessionPageCount: Record<string, number> = {}
    pageViews.forEach(e => {
      if (e.session_id) sessionPageCount[e.session_id] = (sessionPageCount[e.session_id] || 0) + 1
    })
    const bounceSessions = Object.values(sessionPageCount).filter(c => c <= 1).length
    const bounceRate     = Object.keys(sessionPageCount).length > 0
      ? Math.round((bounceSessions / Object.keys(sessionPageCount).length) * 100)
      : 0

    // Top 5 properties by event count
    const propMap: Record<string, number> = {}
    events.forEach(e => {
      if (e.property_id) propMap[e.property_id] = (propMap[e.property_id] || 0) + 1
    })
    const topPropertyIds = Object.entries(propMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    // Fetch property titles for top properties
    let topProperties: Array<{ id: string; title: string; events: number; avgScroll: number }> = []
    if (topPropertyIds.length > 0) {
      const { data: props } = await serviceClient
        .from('properties')
        .select('id,title')
        .in('id', topPropertyIds)

      topProperties = topPropertyIds.map(id => {
        const prop  = props?.find(p => p.id === id)
        const pScrolls = scrollEvents.filter(e => e.property_id === id)
        const avgScroll = pScrolls.length > 0
          ? Math.round(pScrolls.reduce((s, e) => s + Number(e.value || 0), 0) / pScrolls.length)
          : 0
        return {
          id,
          title:     prop?.title || 'Untitled property',
          events:    propMap[id],
          avgScroll,
        }
      })
    }

    return NextResponse.json({
      avgScrollDepth,
      ctaClickRate,
      avgSessionSec,
      bounceRate,
      topProperties,
      totalEvents: events.length,
      loaded: true,
    })
  } catch (err: any) {
    console.error('[behavior-events] Unexpected error:', err?.message || err)
    return NextResponse.json(emptyMetrics())
  }
}

function emptyMetrics() {
  return {
    avgScrollDepth: 0,
    ctaClickRate: 0,
    avgSessionSec: 0,
    bounceRate: 0,
    topProperties: [],
    totalEvents: 0,
    loaded: true,
  }
}
