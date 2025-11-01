"use client"

import * as React from 'react'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabase } from '@/lib/supabase'
import { listSaved } from '@/lib/saved'
import type { RecommendationItem } from '@/types/recommendations'

const RecommendationsCarousel = dynamic(() => import('@/features/recommendations/RecommendationsCarousel').then(m => m.RecommendationsCarousel), { ssr: false })

async function getGreeting(): Promise<string> {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata?.full_name) return `Welcome back, ${user.user_metadata.full_name.split(' ')[0]}!`
    if (user?.email) return `Welcome back, ${user.email.split('@')[0]}!`
  } catch {}
  return 'Welcome back!'
}

async function getRecommendations(): Promise<{ items: RecommendationItem[]; error?: string | null }> {
  try {
    const sid = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )thg_sid=([^;]+)/)?.[1] : null
    const res = await fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sid, num_results: 6 }) })
    if (!res.ok) return { items: [], error: 'Failed to load' }
    const data = await res.json()
    return { items: Array.isArray(data.items) ? data.items : [] }
  } catch {
    return { items: [], error: 'Failed to load' }
  }
}

function SavedQuick(): JSX.Element {
  const rows = listSaved().slice(0, 4)
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-4 text-sm text-gray-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">Nothing saved yet. Explore recommendations to get started.</div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {rows.map((r) => (
        <Link key={r.property_id} href="/property-listing/" className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="relative h-24 w-full bg-gray-100">
            <Image src={r.image_url} alt={r.title} fill sizes="200px" className="object-cover" />
          </div>
          <div className="truncate px-3 py-2 text-sm">{r.title}</div>
        </Link>
      ))}
    </div>
  )
}

function UpcomingVisitsWidget(): JSX.Element {
  // Placeholder UI; data wiring can be expanded when visits table is available
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-2 font-medium">Upcoming Site Visits</div>
      <div className="text-sm text-gray-600">No upcoming visits scheduled.</div>
    </div>
  )
}

function RecentSearchHistory(): JSX.Element {
  let items: string[] = []
  if (typeof window !== 'undefined') {
    try { items = JSON.parse(localStorage.getItem('thg_recent_searches') || '[]') } catch {}
  }
  if (!items.length) return <div className="text-sm text-gray-600">No recent searches.</div>
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
      {items.slice(0, 6).map((s, i) => (
        <li key={i}><Link href={`/property-listing/?q=${encodeURIComponent(s)}`} className="text-primary-600 hover:underline">{s}</Link></li>
      ))}
    </ul>
  )
}

export default function Page() {
  const [greeting, setGreeting] = React.useState<string>('Welcome back!')
  const [recs, setRecs] = React.useState<RecommendationItem[]>([])
  const [recError, setRecError] = React.useState<string | null>(null)

  React.useEffect(() => {
    getGreeting().then(setGreeting)
    getRecommendations().then((r) => { setRecs(r.items); setRecError(r.error ?? null) })
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <section className="rounded-lg border border-gray-300 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h1 className="text-xl font-semibold text-gray-900">{greeting}</h1>
        <p className="mt-1 text-sm text-gray-600">Here’s your personalized overview.</p>
      </section>

      {/* AI Recommendations feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">AI Recommendations</h2>
          <span className="rounded-full border border-primary-600/30 bg-primary-600/10 px-2.5 py-1 text-xs text-primary-700">Personalized</span>
        </div>
        <Suspense fallback={<div className="rounded-lg border border-gray-300 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">Loading…</div>}>
          <RecommendationsCarousel items={recs} isLoading={!recs.length && !recError} error={recError} />
        </Suspense>
      </section>

      {/* Saved quick access */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Saved Properties</h2>
          <Link href="/saved" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        <SavedQuick />
      </section>

      {/* Upcoming visits */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-900">Upcoming Site Visits</h2>
        <UpcomingVisitsWidget />
      </section>

      {/* Recent searches */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-900">Recent Search History</h2>
        <RecentSearchHistory />
      </section>
    </div>
  )
}
