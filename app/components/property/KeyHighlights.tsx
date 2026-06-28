'use client'

import { ShieldCheck, MapPin, TrendingUp, Award, Car, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeyHighlightsProps {
  property: {
    isVerified?: boolean
    reraId?: string
    priceINR?: number | null
    pricePerSqftINR?: number | null
    locality?: string
    city?: string
    parking?: number | null
    propertyType?: string
    listingStatus?: string
    builderName?: string
  }
}

export default function KeyHighlights({ property }: KeyHighlightsProps) {
  const highlights: Array<{
    icon: React.ReactNode
    text: string
    color: 'emerald' | 'amber' | 'blue' | 'purple'
  }> = []

  if (property.isVerified || property.reraId) {
    highlights.push({ icon: <ShieldCheck size={14} />, text: 'RERA Verified', color: 'emerald' })
  }

  const premiumLocalities = ['Anna Nagar', 'T Nagar', 'Adyar', 'Besant Nagar', 'Kotturpuram', 'Alwarpet', 'Mylapore']
  if (property.locality && premiumLocalities.some(loc => property.locality?.includes(loc))) {
    highlights.push({ icon: <MapPin size={14} />, text: 'Premium Location', color: 'amber' })
  }

  if (property.pricePerSqftINR && property.pricePerSqftINR < 8000) {
    highlights.push({ icon: <TrendingUp size={14} />, text: 'Great Value', color: 'blue' })
  }

  if (
    property.listingStatus?.toLowerCase().includes('ready') ||
    property.listingStatus?.toLowerCase().includes('possession')
  ) {
    highlights.push({ icon: <Building2 size={14} />, text: 'Ready to Move', color: 'blue' })
  }

  if (property.parking && property.parking > 0) {
    highlights.push({
      icon: <Car size={14} />,
      text: `${property.parking} Parking ${property.parking > 1 ? 'Spaces' : 'Space'}`,
      color: 'purple',
    })
  }

  if (property.builderName) {
    highlights.push({ icon: <Award size={14} />, text: 'Reputed Builder', color: 'amber' })
  }

  if (highlights.length === 0) return null

  const colorMap = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/10   border-amber-500/20   text-amber-400',
    blue:    'bg-blue-500/10    border-blue-500/20    text-blue-400',
    purple:  'bg-purple-500/10  border-purple-500/20  text-purple-400',
  }

  return (
    <div className="flex flex-wrap gap-2">
      {highlights.map((h, i) => (
        <div
          key={i}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold',
            colorMap[h.color],
          )}
        >
          {h.icon}
          {h.text}
        </div>
      ))}
    </div>
  )
}
