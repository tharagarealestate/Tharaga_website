"use client"

import * as React from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'
import type { RecommendationItem } from '@/types/recommendations'
import { Tooltip } from '@/components/ui/Tooltip'

type Props = {
  items?: RecommendationItem[]
  isLoading?: boolean
  error?: string | null
}

export function RecommendationsCarousel({ items = [], isLoading = false, error = null }: Props) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        We’re having trouble loading recommendations. Please try again later.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Recommended for you</h2>
        <div className="hidden md:flex items-center gap-2">
          <NavButton direction="prev" />
          <NavButton direction="next" />
        </div>
      </div>
      <ScrollableRow>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) => <PropertyCard key={item.property_id} item={item} />)
        )}
      </ScrollableRow>
    </div>
  )
}

function PropertyCard({ item }: { item: RecommendationItem }) {
  return (
    <div className="min-w-[280px] max-w-[320px] rounded-xl bg-brandWhite shadow-subtle border border-deepBlue/10 overflow-hidden">
      <div className="relative h-40 w-full">
        <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 80vw, 320px" />
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

