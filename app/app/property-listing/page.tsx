'use client'

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Property } from '@/types/property'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Search, Home, Filter, MapPin, Bed, Maximize, Eye, Heart,
  SlidersHorizontal, LayoutGrid, List, ChevronDown, X, Shield,
  TrendingUp, Building2, ArrowUpDown, ChevronLeft, ChevronRight,
  Sparkles, Star, Check, Loader2, AlertCircle, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Price Formatter ───────────────────────────────────────────────────
function formatPrice(price: number): string {
  if (price >= 10000000) return `\u20B9${(price / 10000000).toFixed(1)}Cr`
  if (price >= 100000) return `\u20B9${(price / 100000).toFixed(1)}L`
  return `\u20B9${price.toLocaleString('en-IN')}`
}

// ─── Property Types & BHK Options ──────────────────────────────────────
const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'penthouse', 'studio', 'duplex']
const BHK_OPTIONS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+']
const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest First' },
  { id: 'popular', label: 'Most Popular' },
]

// ─── Modern Property Card ──────────────────────────────────────────────
function PropertyCard({ property, layout = 'grid' }: { property: Property; layout?: 'grid' | 'list' }) {
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const daysSinceListing = Math.floor(
    (new Date().getTime() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleClick = () => {
    router.push(`/property/${property.slug || property.id}`)
  }

  const imageUrl = property.thumbnail_url || property.images?.[0] || '/placeholder-property.jpg'

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleClick}
        className="group bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all duration-300 flex flex-col sm:flex-row"
      >
        {/* Image */}
        <div className="relative sm:w-72 h-56 sm:h-auto flex-shrink-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className={cn('object-cover transition-all duration-500 group-hover:scale-105', !imageLoaded && 'blur-sm')}
            sizes="(max-width: 640px) 100vw, 288px"
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {daysSinceListing <= 7 && (
              <span className="px-2 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded-md uppercase tracking-wider">New</span>
            )}
            {property.rera_verified && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] font-bold rounded-md">
                <Shield className="w-2.5 h-2.5" /> RERA
              </span>
            )}
          </div>

          {/* Favorite */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsFavorited(!isFavorited) }}
            className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
          >
            <Heart className={cn('w-4 h-4', isFavorited ? 'fill-red-500 text-red-500' : 'text-white')} />
          </button>

          {/* Views */}
          {property.view_count > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[10px] text-white/80">
              <Eye className="w-3 h-3" /> {property.view_count}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-zinc-100 line-clamp-1 group-hover:text-amber-400 transition-colors">{property.title}</h3>
              <div className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{property.address}, {property.city}</span>
              </div>
            </div>
            {property.ai_appreciation_band && (
              <span className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border flex-shrink-0',
                property.ai_appreciation_band === 'high' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                property.ai_appreciation_band === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              )}>
                <TrendingUp className="w-3 h-3" />
                {property.ai_appreciation_band === 'high' ? 'High Growth' : property.ai_appreciation_band === 'medium' ? 'Medium' : 'Stable'}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-amber-400">{formatPrice(property.base_price)}</span>
            {property.price_per_sqft && (
              <span className="text-xs text-zinc-500 ml-2">\u20B9{property.price_per_sqft.toLocaleString('en-IN')}/sqft</span>
            )}
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-zinc-300">
              <Bed className="w-4 h-4 text-zinc-500" />
              <span className="font-medium">{property.bhk_type}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-zinc-300">
              <Maximize className="w-4 h-4 text-zinc-500" />
              <span className="font-medium">{property.carpet_area} sqft</span>
            </div>
            <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium border',
              property.possession_status === 'ready-to-move'
                ? 'bg-emerald-500/8 text-emerald-400 border-emerald-500/15'
                : 'bg-amber-500/8 text-amber-400 border-amber-500/15'
            )}>
              {property.possession_status === 'ready-to-move' ? 'Ready to Move' : 'Under Construction'}
            </span>
          </div>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {property.amenities.slice(0, 5).map(a => (
                <span key={a} className="px-2 py-0.5 bg-zinc-800/60 text-zinc-400 text-[11px] rounded-md border border-zinc-800/60">{a}</span>
              ))}
              {property.amenities.length > 5 && (
                <span className="px-2 py-0.5 text-zinc-500 text-[11px]">+{property.amenities.length - 5}</span>
              )}
            </div>
          )}

          {/* Builder */}
          {property.builder && (
            <div className="flex items-center justify-between pt-3 mt-auto border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                {property.builder.logo_url && (
                  <Image src={property.builder.logo_url} alt={property.builder.company_name} width={28} height={28} className="rounded-lg border border-zinc-800" />
                )}
                <span className="text-xs text-zinc-400 font-medium">{property.builder.company_name}</span>
                {property.builder.verified && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/property/${property.slug || property.id}#contact`) }}
                className="px-4 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-lg hover:bg-amber-500/20 transition-colors"
              >
                Contact
              </button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Grid Card ────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className="group bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-700/80 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-black/20 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className={cn('object-cover transition-all duration-500 group-hover:scale-105', !imageLoaded && 'blur-sm')}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {daysSinceListing <= 7 && (
            <span className="px-2 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded-md uppercase tracking-wider">New</span>
          )}
          {property.rera_verified && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] font-bold rounded-md">
              <Shield className="w-2.5 h-2.5" /> RERA
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsFavorited(!isFavorited) }}
          className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
        >
          <Heart className={cn('w-4 h-4', isFavorited ? 'fill-red-500 text-red-500' : 'text-white')} />
        </button>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xl font-bold text-white drop-shadow-lg">{formatPrice(property.base_price)}</span>
          {property.price_per_sqft && (
            <span className="text-[10px] text-white/60 ml-1.5">\u20B9{property.price_per_sqft.toLocaleString('en-IN')}/sqft</span>
          )}
        </div>

        {/* Views */}
        {property.view_count > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[10px] text-white/80">
            <Eye className="w-3 h-3" /> {property.view_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-zinc-100 line-clamp-1 mb-1.5 group-hover:text-amber-400 transition-colors">{property.title}</h3>
        <div className="flex items-center gap-1 text-[12px] text-zinc-500 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{property.address}, {property.city}</span>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-1 text-sm text-zinc-300">
            <Bed className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-medium text-[13px]">{property.bhk_type}</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="flex items-center gap-1 text-sm text-zinc-300">
            <Maximize className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-medium text-[13px]">{property.carpet_area} sqft</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <span className={cn('text-[11px] font-medium',
            property.possession_status === 'ready-to-move' ? 'text-emerald-400' : 'text-amber-400'
          )}>
            {property.possession_status === 'ready-to-move' ? 'Ready' : 'Upcoming'}
          </span>
        </div>

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {property.amenities.slice(0, 3).map(a => (
              <span key={a} className="px-1.5 py-0.5 bg-zinc-800/60 text-zinc-500 text-[10px] rounded-md border border-zinc-800/40">{a}</span>
            ))}
            {property.amenities.length > 3 && (
              <span className="text-[10px] text-zinc-600 self-center">+{property.amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Builder footer */}
        {property.builder && (
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/40">
            <div className="flex items-center gap-2 min-w-0">
              {property.builder.logo_url && (
                <Image src={property.builder.logo_url} alt={property.builder.company_name} width={24} height={24} className="rounded border border-zinc-800 flex-shrink-0" />
              )}
              <span className="text-[11px] text-zinc-500 truncate">{property.builder.company_name}</span>
            </div>
            {property.builder.verified && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 flex-shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Inline Filter Chips ───────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap',
        active
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-300'
      )}
    >
      {label}
    </button>
  )
}

// ─── Sidebar Filter Panel ──────────────────────────────────────────────
function FilterPanel({ filters, setFilters, onApply, onClear, activeCount }: {
  filters: any
  setFilters: (fn: (prev: any) => any) => void
  onApply: () => void
  onClear: () => void
  activeCount: number
}) {
  const toggleArrayFilter = (key: string, value: string) => {
    setFilters((prev: any) => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] }
    })
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-5 sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500" /> Filters
        </h3>
        {activeCount > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Property Type */}
        <FilterGroup title="Property Type">
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map(type => (
              <FilterChip key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} active={filters.property_type.includes(type)} onClick={() => toggleArrayFilter('property_type', type)} />
            ))}
          </div>
        </FilterGroup>

        {/* BHK */}
        <FilterGroup title="Configuration">
          <div className="flex flex-wrap gap-1.5">
            {BHK_OPTIONS.map(bhk => (
              <FilterChip key={bhk} label={bhk} active={filters.bhk_type.includes(bhk)} onClick={() => toggleArrayFilter('bhk_type', bhk)} />
            ))}
          </div>
        </FilterGroup>

        {/* Budget */}
        <FilterGroup title="Budget">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min \u20B9"
              value={filters.min_price}
              onChange={(e) => setFilters((prev: any) => ({ ...prev, min_price: e.target.value }))}
              className="px-3 py-2 bg-zinc-800/60 border border-zinc-800/60 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            <input
              type="number"
              placeholder="Max \u20B9"
              value={filters.max_price}
              onChange={(e) => setFilters((prev: any) => ({ ...prev, max_price: e.target.value }))}
              className="px-3 py-2 bg-zinc-800/60 border border-zinc-800/60 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </FilterGroup>

        {/* Possession */}
        <FilterGroup title="Possession">
          <div className="flex gap-1.5">
            {[['ready-to-move', 'Ready to Move'], ['under-construction', 'Under Construction']].map(([val, label]) => (
              <FilterChip key={val} label={label} active={filters.possession_status.includes(val)} onClick={() => toggleArrayFilter('possession_status', val)} />
            ))}
          </div>
        </FilterGroup>

        {/* Verification */}
        <FilterGroup title="Trust & Safety">
          <div className="space-y-2">
            {[
              { key: 'rera_verified', label: 'RERA Verified', icon: Shield },
              { key: 'approved_by_bank', label: 'Bank Approved', icon: Building2 },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={cn(
                  'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                  filters[item.key]
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-zinc-700 bg-zinc-800/60 group-hover:border-zinc-600'
                )}>
                  {filters[item.key] && <Check className="w-3 h-3 text-zinc-950" />}
                </div>
                <item.icon className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-sm text-zinc-300">{item.label}</span>
              </label>
            ))}
          </div>
        </FilterGroup>

        {/* Amenities */}
        <FilterGroup title="Amenities" defaultCollapsed>
          <div className="flex flex-wrap gap-1.5">
            {['Parking', 'Lift', 'Security', 'Gym', 'Pool', 'Power Backup'].map(a => (
              <FilterChip key={a} label={a} active={filters.amenities.includes(a)} onClick={() => toggleArrayFilter('amenities', a)} />
            ))}
          </div>
        </FilterGroup>
      </div>

      <button
        onClick={onApply}
        className="w-full mt-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold rounded-xl transition-colors"
      >
        Apply Filters
      </button>
    </div>
  )
}

function FilterGroup({ title, children, defaultCollapsed = false }: { title: string; children: React.ReactNode; defaultCollapsed?: boolean }) {
  const [open, setOpen] = useState(!defaultCollapsed)
  return (
    <div className="border-b border-zinc-800/40 pb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-2.5">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-600 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────
function PropertyListingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1, limit: 18, total: 0, total_pages: 0, has_next: false, has_prev: false,
  })
  const [filters, setFilters] = useState({
    property_type: searchParams.getAll('property_type'),
    bhk_type: searchParams.getAll('bhk_type'),
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    possession_status: searchParams.getAll('possession_status'),
    amenities: searchParams.getAll('amenities'),
    rera_verified: searchParams.get('rera_verified') === 'true',
    approved_by_bank: searchParams.get('approved_by_bank') === 'true',
  })

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).flat().filter(v => v && v !== '' && v !== false).length
  }, [filters])

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      searchParams.forEach((value, key) => params.append(key, value))
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (sortBy !== 'relevance') params.set('sort', sortBy)

      const response = await fetch(`/api/properties-list?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch properties')
      const data = await response.json()
      const propertiesList = Array.isArray(data)
        ? data
        : Array.isArray(data.properties) ? data.properties
        : Array.isArray(data.data?.properties) ? data.data.properties
        : []

      setProperties(propertiesList)
      if (data.pagination) setPagination(data.pagination)
      else if (data.data?.pagination) setPagination(data.data.pagination)
      else setPagination(prev => ({ ...prev, total: propertiesList.length, total_pages: Math.ceil(propertiesList.length / prev.limit) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [searchParams, pagination.page, pagination.limit, sortBy])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach(v => params.append(key, v))
      else if (value && value !== '' && value !== false) params.append(key, String(value))
    })
    router.push(`/property-listing?${params.toString()}`)
    setShowMobileFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      property_type: [], bhk_type: [], min_price: '', max_price: '',
      possession_status: [], amenities: [], rera_verified: false, approved_by_bank: false,
    })
    router.push('/property-listing')
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Hero / Search Header ─────────────────────────────────── */}
      <div className="relative border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-zinc-600 mb-4">
            <button onClick={() => router.push('/')} className="hover:text-zinc-400 transition-colors">Home</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-400">Property Search</span>
          </div>

          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Find Your Perfect Home</h1>
              <p className="text-sm text-zinc-500 mt-1">Explore verified listings with AI-powered insights</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI-powered search</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by location, project name, or builder..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/80 border border-zinc-800/60 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('q', (e.target as HTMLInputElement).value)
                  router.push(`/property-listing?${params.toString()}`)
                }
              }}
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none pb-1">
            {BHK_OPTIONS.map(bhk => (
              <FilterChip
                key={bhk}
                label={bhk}
                active={filters.bhk_type.includes(bhk)}
                onClick={() => {
                  const newTypes = filters.bhk_type.includes(bhk)
                    ? filters.bhk_type.filter(b => b !== bhk)
                    : [...filters.bhk_type, bhk]
                  setFilters(prev => ({ ...prev, bhk_type: newTypes }))
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete('bhk_type')
                  newTypes.forEach(b => params.append('bhk_type', b))
                  router.push(`/property-listing?${params.toString()}`)
                }}
              />
            ))}
            <div className="w-px h-5 bg-zinc-800 flex-shrink-0" />
            <FilterChip label="Ready to Move" active={filters.possession_status.includes('ready-to-move')} onClick={() => {
              const newStatuses = filters.possession_status.includes('ready-to-move')
                ? filters.possession_status.filter(s => s !== 'ready-to-move')
                : [...filters.possession_status, 'ready-to-move']
              setFilters(prev => ({ ...prev, possession_status: newStatuses }))
              const params = new URLSearchParams(searchParams.toString())
              params.delete('possession_status')
              newStatuses.forEach(s => params.append('possession_status', s))
              router.push(`/property-listing?${params.toString()}`)
            }} />
            <FilterChip label="RERA Verified" active={filters.rera_verified} onClick={() => {
              const newVal = !filters.rera_verified
              setFilters(prev => ({ ...prev, rera_verified: newVal }))
              const params = new URLSearchParams(searchParams.toString())
              if (newVal) params.set('rera_verified', 'true')
              else params.delete('rera_verified')
              router.push(`/property-listing?${params.toString()}`)
            }} />
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <FilterPanel filters={filters} setFilters={setFilters} onApply={applyFilters} onClear={clearFilters} activeCount={activeFilterCount} />
          </aside>

          {/* Properties */}
          <section className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-xs text-zinc-400"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold">{activeFilterCount}</span>
                  )}
                </button>
                <p className="text-sm text-zinc-400">
                  {loading ? 'Searching...' : (
                    <>
                      <span className="text-zinc-200 font-semibold">{properties.length}</span>
                      {pagination.total > 0 && properties.length < pagination.total && (
                        <span> of {pagination.total}</span>
                      )}
                      {' '}properties
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Sort'}
                  </button>
                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/30 overflow-hidden z-50"
                      >
                        {SORT_OPTIONS.map(option => (
                          <button
                            key={option.id}
                            onClick={() => { setSortBy(option.id); setShowSortMenu(false) }}
                            className={cn(
                              'w-full text-left px-3 py-2 text-xs transition-colors',
                              sortBy === option.id ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View toggle */}
                <div className="flex items-center bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn('p-1.5 rounded-md transition-all', viewMode === 'grid' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400')}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn('p-1.5 rounded-md transition-all', viewMode === 'list' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400')}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className={cn(
                'gap-5',
                viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'
              )}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-52 bg-zinc-800/40" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 w-3/4 bg-zinc-800/40 rounded" />
                      <div className="h-3 w-1/2 bg-zinc-800/30 rounded" />
                      <div className="h-4 w-1/3 bg-zinc-800/40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-200 mb-1">Something went wrong</h3>
                <p className="text-sm text-zinc-500 mb-4">{error}</p>
                <button onClick={fetchProperties} className="px-4 py-2 bg-zinc-800 text-zinc-200 text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && properties.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
                  <Home className="w-7 h-7 text-zinc-600" />
                </div>
                <h3 className="text-lg font-bold text-zinc-200 mb-1">
                  {activeFilterCount > 0 ? 'No properties match your filters' : 'No properties available'}
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  {activeFilterCount > 0 ? 'Try adjusting your filters to see more results' : 'Check back soon for new listings'}
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="px-4 py-2 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {/* Property Grid/List */}
            {!loading && !error && properties.length > 0 && (
              <>
                <div className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
                    : 'space-y-4'
                )}>
                  {properties.map((property, i) => (
                    <motion.div key={property.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <PropertyCard property={property} layout={viewMode} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!pagination.has_prev}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-sm text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm text-zinc-500 tabular-nums">
                      Page <span className="text-zinc-300 font-semibold">{pagination.page}</span> of {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!pagination.has_next}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-sm text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-[320px] bg-zinc-950 border-r border-zinc-800 z-[1001] overflow-y-auto lg:hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-zinc-200">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
                <FilterPanel filters={filters} setFilters={setFilters} onApply={applyFilters} onClear={clearFilters} activeCount={activeFilterCount} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PropertyListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-sm text-zinc-500">Loading properties...</span>
        </div>
      </div>
    }>
      <PropertyListingContent />
    </Suspense>
  )
}
