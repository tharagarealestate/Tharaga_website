"use client"

import * as React from 'react'
import Image from 'next/image'
import type { RecommendationItem } from '@/types/recommendations'
import { fetchRecommendationsClient, readCookie } from '@/lib/api-client'

type Props = {
  initialItems?: RecommendationItem[]
  error?: string | null
}

export function RecommendationsGrid({ initialItems = [], error = null }: Props) {
  const [items, setItems] = React.useState<RecommendationItem[]>(initialItems)
  const [loading, setLoading] = React.useState(false)
  const [clientError, setClientError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (initialItems.length === 0) {
      const sid = readCookie('thg_sid')
      if (!sid) return
      setLoading(true)
      fetchRecommendationsClient({ session_id: sid, num_results: 24 })
        .then((data) => setItems(data.items || []))
        .catch(() => setClientError('Failed to load properties'))
        .finally(() => setLoading(false))
    }
  }, [initialItems.length])

  if ((error || clientError) && items.length === 0) {
    return <div>Could not load properties. Please try again.</div>
  }

  if (loading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-deepBlue/10 bg-brandWhite shadow-subtle">
            <div className="h-40 w-full bg-deepBlue/10" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 bg-deepBlue/10 rounded" />
              <div className="h-3 w-2/3 bg-deepBlue/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <div>No properties yet. Explore and come back for tailored picks.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.property_id} className="rounded-xl border border-deepBlue/10 bg-brandWhite shadow-subtle overflow-hidden">
          <div className="relative h-44 w-full">
            <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
          </div>
          <div className="p-3 space-y-2">
            <h3 className="font-medium leading-snug">{item.title}</h3>
            <p className="text-sm text-deepBlue/70">{specLine(item)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function specLine(item: RecommendationItem): string {
  const parts: string[] = []
  const s = item.specs
  if (s.bedrooms) parts.push(`${s.bedrooms} BHK`)
  if (s.bathrooms) parts.push(`${s.bathrooms} Bath`)
  if (s.area_sqft) parts.push(`${Math.round(s.area_sqft)} sqft`)
  if (s.location) parts.push(s.location)
  return parts.join(' • ')
}

