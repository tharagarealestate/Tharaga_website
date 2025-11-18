'use client'

import React, { useState } from 'react'
import { Search, MapPin, Sparkles } from 'lucide-react'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface SearchFilter {
  id: string
  label: string
  active: boolean
}

export function BuyerSearchHero() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilter[]>([
    { id: 'bhk', label: '2-3 BHK', active: false },
    { id: 'budget', label: '₹50L - 1Cr', active: false },
    { id: 'readiness', label: 'Ready to Move', active: false },
  ])

  const toggleFilter = (id: string) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, active: !f.active } : f
    ))
  }

  const handleAISearch = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    }
    
    const activeFilters = filters.filter(f => f.active)
    if (activeFilters.find(f => f.id === 'bhk')) {
      params.set('bhk', '2-3')
    }
    if (activeFilters.find(f => f.id === 'budget')) {
      params.set('minPrice', '5000000')
      params.set('maxPrice', '10000000')
    }
    if (activeFilters.find(f => f.id === 'readiness')) {
      params.set('status', 'ready')
    }
    
    router.push(`/property-listing/?${params.toString()}`)
  }

  return (
    <GlassContainer 
      intensity="medium"
      className="p-8 max-w-5xl mx-auto backdrop-blur-xl bg-white/10 border-2 border-white/20"
    >
      {/* Search Input */}
      <div className="relative mb-6">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 w-6 h-6" />
        <input
          type="text"
          placeholder="Search by location, builder, or project name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAISearch()
            }
          }}
          className={cn(
            "w-full pl-14 pr-4 py-4 rounded-xl",
            "bg-white/20 backdrop-blur-sm",
            "border border-white/30",
            "text-white placeholder:text-white/60",
            "focus:outline-none focus:ring-2 focus:ring-yellow-500/50",
            "text-lg"
          )}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => toggleFilter(filter.id)}
            className={cn(
              "px-5 py-2.5 rounded-lg",
              "backdrop-blur-sm border transition-all duration-200",
              "font-medium",
              filter.active
                ? "bg-white/30 border-white/50 text-white"
                : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
            )}
          >
            {filter.label}
          </button>
        ))}
        
        <button
          onClick={() => router.push('/property-listing')}
          className={cn(
            "px-5 py-2.5 rounded-lg",
            "bg-white/10 border border-white/20",
            "text-white/80 hover:bg-white/20",
            "backdrop-blur-sm transition-all duration-200",
            "font-medium"
          )}
        >
          + More Filters
        </button>
      </div>

      {/* AI Search Button */}
      <button
        onClick={handleAISearch}
        className={cn(
          "w-full py-4 rounded-xl",
          "bg-gradient-to-r from-yellow-500 to-yellow-600",
          "hover:from-yellow-600 hover:to-yellow-700",
          "text-gray-900 font-bold text-lg",
          "flex items-center justify-center gap-3",
          "transition-all duration-300",
          "shadow-lg shadow-yellow-500/25"
        )}
      >
        <Sparkles className="w-6 h-6" />
        AI Search
      </button>
    </GlassContainer>
  )
}

