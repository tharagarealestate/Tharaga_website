"use client"

import * as React from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'
import type { RecommendationItem } from '@/types/recommendations'
import { Tooltip } from '@/components/ui/Tooltip'
import { LeadModal } from '@/components/lead/LeadModal'
import { fetchRecommendationsClient, readCookie } from '@/lib/api-client'

type Props = {
  items?: RecommendationItem[]
  isLoading?: boolean
  error?: string | null
}

export function RecommendationsCarousel({ items = [], isLoading = false, error = null }: Props) {
  const [clientItems, setClientItems] = React.useState(items)
  const [retrying, setRetrying] = React.useState(false)
  const [clientError, setClientError] = React.useState<string | null>(null)
  const [leadFor, setLeadFor] = React.useState<string | null>(null)

  React.useEffect(() => {
    // If server failed to load, attempt one client-side retry for resilience
    if ((error || items.length === 0) && !retrying) {
      let sid = readCookie('thg_sid')
      if (!sid) {
        // create a client-side session id if missing
        sid = `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
        document.cookie = `thg_sid=${encodeURIComponent(sid)}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
      }
      setRetrying(true)
      fetchRecommendationsClient({ session_id: sid, num_results: 6 })
        .then((data) => {
          setClientItems(data.items || [])
          setClientError(null)
        })
        .catch(() => setClientError('Failed to load recommendations'))
        .finally(() => setRetrying(false))
    }
  }, [error, items.length, retrying])

  if (error && clientItems.length === 0 && !retrying) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        We’re having trouble loading recommendations. Please try again later.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="hidden md:flex items-center justify-end gap-2">
        <NavButton direction="prev" />
        <NavButton direction="next" />
      </div>
      <ScrollableRow>
        {isLoading || retrying ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (clientItems.length || items.length) === 0 ? (
          <EmptyState />
        ) : (
          (clientItems.length ? clientItems : items).map((item) => (
            <PropertyCard
              key={item.property_id}
              item={item}
              onLead={(id) => setLeadFor(id)}
            />
          ))
        )}
      </ScrollableRow>
      <LeadModal propertyId={leadFor ?? ''} open={!!leadFor} onClose={() => setLeadFor(null)} />
    </div>
  )
}

function PropertyCard({ item, onLead }: { item: RecommendationItem; onLead: (propertyId: string) => void }) {
  const [loaded, setLoaded] = React.useState(false)
  const blurDataURL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' // tiny 1x1
  return (
    <div className="min-w-[280px] max-w-[320px] rounded-xl bg-brandWhite shadow-subtle border border-deepBlue/10 overflow-hidden">
      <div className="relative h-40 w-full bg-deepBlue/10">
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 80vw, 320px"
          placeholder="blur"
          blurDataURL={blurDataURL}
          priority={false}
          className={clsx('object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          onLoadingComplete={() => setLoaded(true)}
        />
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug line-clamp-2">{item.title}</h3>
          <Tooltip content={<WhyContent reasons={item.reasons} />}>
            <button className="shrink-0 rounded-full border border-gold/60 text-gold px-2 py-1 text-xs hover:bg-gold/10 transition-colors" aria-label="Why recommended?">
              Why?
            </button>
          </Tooltip>
        </div>
        <Specs specs={item.specs} />
        <div className="mt-2 flex gap-2">
          <button
            className="rounded-lg border px-3 py-1 text-sm"
            onClick={() => onLead(item.property_id)}
          >
            Request details
          </button>
          <a href={`/property-listing/`} className="rounded-lg border px-3 py-1 text-sm">See similar</a>
        </div>
      </div>
    </div>
  )
}

function Specs({ specs }: { specs: RecommendationItem['specs'] }) {
  const parts: string[] = []
  if (specs.bedrooms) parts.push(`${specs.bedrooms} BHK`)
  if (specs.bathrooms) parts.push(`${specs.bathrooms} Bath`)
  if (specs.area_sqft) parts.push(`${Math.round(specs.area_sqft)} sqft`)
  if (specs.location) parts.push(specs.location)
  return <p className="text-sm text-deepBlue/70">{parts.join(' • ')}</p>
}

function WhyContent({ reasons }: { reasons: string[] }) {
  if (!reasons?.length) return <span>Based on your browsing patterns.</span>
  return (
    <ul className="list-disc pl-5 space-y-1">
      {reasons.slice(0, 3).map((reason, i) => (
        <li key={i}>{reason}</li>
      ))}
    </ul>
  )
}

function NavButton({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <button
      className="rounded-full border border-deepBlue/20 text-deepBlue/80 hover:text-deepBlue hover:bg-deepBlue/5 px-3 py-1 text-sm"
      data-dir={direction}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
      onClick={(e) => {
        const container = (e.currentTarget as HTMLButtonElement).closest('[data-scroll-root]')?.querySelector('[data-scroll-row]') as HTMLElement | null
        if (!container) return
        const delta = direction === 'prev' ? -1 : 1
        container.scrollBy({ left: delta * (container.clientWidth * 0.8), behavior: 'smooth' })
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  )
}

function ScrollableRow({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight') el.scrollBy({ left: el.clientWidth * 0.8, behavior: 'smooth' })
      if (ev.key === 'ArrowLeft') el.scrollBy({ left: -el.clientWidth * 0.8, behavior: 'smooth' })
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div data-scroll-root>
      <div
        ref={ref}
        data-scroll-row
        tabIndex={0}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth focus:outline-none"
      >
        {children}
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="min-w-[280px] max-w-[320px] rounded-xl bg-brandWhite shadow-subtle border border-deepBlue/10 overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-deepBlue/10" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 bg-deepBlue/10 rounded" />
        <div className="h-3 w-2/3 bg-deepBlue/10 rounded" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="min-w-[280px] rounded-xl border border-deepBlue/10 bg-brandWhite p-6 text-center">
      <p className="text-deepBlue/70">No recommendations yet. Explore properties to get tailored picks.</p>
    </div>
  )
}

