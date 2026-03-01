'use client'

import { ShieldCheck, MapPin, TrendingUp, Award, Car, Building2 } from 'lucide-react'

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
  const highlights = []

  // RERA Verified
  if (property.isVerified || property.reraId) {
    highlights.push({
      icon: <ShieldCheck size={18} />,
      text: 'RERA Verified',
      color: 'emerald'
    })
  }

  // Premium Location
  if (property.locality && ['Anna Nagar', 'T Nagar', 'Adyar', 'Besant Nagar', 'Kotturpuram'].some(loc => property.locality?.includes(loc))) {
    highlights.push({
      icon: <MapPin size={18} />,
      text: 'Premium Location',
      color: 'amber'
    })
  }

  // Good Price per Sqft
  if (property.pricePerSqftINR && property.pricePerSqftINR < 8000) {
    highlights.push({
      icon: <TrendingUp size={18} />,
      text: 'Great Value',
      color: 'green'
    })
  }

  // Ready to Move
  if (property.listingStatus?.toLowerCase().includes('ready') || property.listingStatus?.toLowerCase().includes('possession')) {
    highlights.push({
      icon: <Building2 size={18} />,
      text: 'Ready to Move',
      color: 'blue'
    })
  }

  // Parking Available
  if (property.parking && property.parking > 0) {
    highlights.push({
      icon: <Car size={18} />,
      text: `${property.parking} Parking ${property.parking > 1 ? 'Spaces' : 'Space'}`,
      color: 'purple'
    })
  }

  // Reputed Builder
  if (property.builderName) {
    highlights.push({
      icon: <Award size={18} />,
      text: 'Reputed Builder',
      color: 'amber'
    })
  }

  if (highlights.length === 0) return null

  const colorClasses = {
    emerald: 'bg-emerald-500/20 border-emerald-300/50 text-emerald-300',
    amber: 'bg-amber-500/20 border-amber-300/50 text-amber-300',
    green: 'bg-green-500/20 border-green-300/50 text-green-300',
    blue: 'bg-blue-500/20 border-blue-300/50 text-blue-300',
    purple: 'bg-purple-500/20 border-purple-300/50 text-purple-300'
  }

  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Key Highlights</h2>
      <div className="flex flex-wrap gap-3">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${colorClasses[highlight.color as keyof typeof colorClasses]} transition-all hover:scale-105`}
          >
            {highlight.icon}
            <span className="font-medium text-sm whitespace-nowrap">{highlight.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
















