'use client'

import {
  Suspense, useState, useEffect, useMemo, useCallback, useRef,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Property } from '@/types/property'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import {
  Search, Home, Filter, MapPin, Bed, Maximize, Eye, Heart,
  SlidersHorizontal, LayoutGrid, List, ChevronDown, X, Shield,
  TrendingUp, Building2, ArrowUpDown, ChevronLeft, ChevronRight,
  Sparkles, Star, Check, Loader2, AlertCircle, Zap, Map,
  Calendar, Bookmark, RefreshCw, IndianRupee, Phone, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ──────────────────────────────────────────────────────────────
const PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
]
const BHK_OPTIONS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+']

const BUDGET_PRESETS = [
  { label: 'Under ₹30L', min: 0, max: 3000000 },
  { label: '₹30L – ₹60L', min: 3000000, max: 6000000 },
  { label: '₹60L – ₹1Cr', min: 6000000, max: 10000000 },
  { label: '₹1Cr – ₹2Cr', min: 10000000, max: 20000000 },
  { label: 'Above ₹2Cr', min: 20000000, max: 0 },
]

const AMENITIES_LIST = [
  'Gym', 'Swimming Pool', 'Parking', 'Power Backup', 'Lift',
  'Security', 'Clubhouse', 'Children Play Area', 'Garden',
  'Metro Nearby', 'CCTV', 'Intercom', 'Rainwater Harvesting',
]

const SORT_OPTIONS = [
  { id: 'relevance', label: 'AI Relevance' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest First' },
  { id: 'popular', label: 'Most Viewed' },
  { id: 'ai_match', label: 'AI Match Score' },
]

// ─── Types ───────────────────────────────────────────────────────────────────
interface FilterState {
  q: string
  city: string
  property_type: string[]
  bhk_type: string[]
  min_price: string
  max_price: string
  min_area: string
  max_area: string
  possession_status: string[]
  amenities: string[]
  rera_verified: boolean
  approved_by_bank: boolean
}

interface PaginationState {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function getAiMatchScore(property: Property): number | null {
  const p = property as any
  if (p.ai_insights?.location_score?.overall) {
    return Math.round(p.ai_insights.location_score.overall * 10)
  }
  return null
}

function buildUrl(filters: FilterState, sortBy: string, page: number): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.city) params.set('city', filters.city)
  filters.property_type.forEach(v => params.append('property_type', v))
  filters.bhk_type.forEach(v => params.append('bhk_type', v))
  if (filters.min_price) params.set('min_price', filters.min_price)
  if (filters.max_price) params.set('max_price', filters.max_price)
  if (filters.min_area) params.set('min_area', filters.min_area)
  if (filters.max_area) params.set('max_area', filters.max_area)
  filters.possession_status.forEach(v => params.append('possession_status', v))
  filters.amenities.forEach(v => params.append('amenities', v))
  if (filters.rera_verified) params.set('rera_verified', 'true')
  if (filters.approved_by_bank) params.set('approved_by_bank', 'true')
  if (sortBy !== 'relevance') params.set('sort', sortBy)
  if (page > 1) params.set('page', String(page))
  return `/property-listing?${params.toString()}`
}

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
}
const fadeVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ layout }: { layout: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden flex animate-pulse">
        <div className="w-64 h-48 bg-zinc-800/60 flex-shrink-0" />
        <div className="flex-1 p-5 space-y-3">
          <div className="h-5 w-1/3 bg-zinc-800/60 rounded-lg" />
          <div className="h-4 w-2/3 bg-zinc-800/40 rounded-lg" />
          <div className="h-4 w-1/2 bg-zinc-800/40 rounded-lg" />
          <div className="flex gap-2 mt-4">
            <div className="h-8 w-24 bg-zinc-800/50 rounded-lg" />
            <div className="h-8 w-24 bg-zinc-800/50 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-52 bg-zinc-800/60" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-zinc-800/60 rounded-lg" />
        <div className="h-3 w-1/2 bg-zinc-800/40 rounded-lg" />
        <div className="h-3 w-1/3 bg-zinc-800/40 rounded-lg" />
        <div className="flex gap-2 pt-2">
          <div className="h-7 flex-1 bg-zinc-800/50 rounded-lg" />
          <div className="h-7 flex-1 bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Active Filter Chip ───────────────────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full text-[11px] font-medium"
    >
      {label}
      <button onClick={onRemove} className="hover:text-amber-300 transition-colors" aria-label={`Remove ${label} filter`}>
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  )
}

// ─── Property Card (Grid) ─────────────────────────────────────────────────────
function PropertyCardGrid({ property }: { property: Property }) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [heartAnim, setHeartAnim] = useState(false)

  const p = property as any
  const days = daysSince(property.created_at)
  const aiScore = getAiMatchScore(property)
  const imgSrc = p.thumbnail_url || property.images?.[0] || '/placeholder-property.jpg'
  const isNew = days <= 7
  const slug = p.slug || property.id

  return (
    <motion.div
      variants={cardVariants}
      onClick={() => router.push(`/property/${slug}`)}
      className="group relative bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-700/70 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden flex-shrink-0">
        <Image
          src={imgSrc} alt={property.title} fill
          className={cn('object-cover transition-all duration-500 group-hover:scale-[1.04]', imgLoaded ? 'blur-0' : 'blur-md scale-105')}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setImgLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isNew && <span className="px-2 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded-md uppercase tracking-widest">New</span>}
          {p.rera_verified && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-md">
              <Shield className="w-2.5 h-2.5" /> RERA
            </span>
          )}
        </div>
        {aiScore !== null && (
          <div className="absolute top-3 right-12 z-10">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/90 backdrop-blur-sm text-zinc-950 text-[10px] font-bold rounded-md">
              <Sparkles className="w-2.5 h-2.5" /> {aiScore}% Match
            </span>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); setFavorited(f => !f); setHeartAnim(true); setTimeout(() => setHeartAnim(false), 400) }}
          aria-label="Save property"
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors">
          <motion.div animate={heartAnim ? { scale: [1, 1.5, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
            <Heart className={cn('w-4 h-4 transition-colors', favorited ? 'fill-red-500 text-red-500' : 'text-white')} />
          </motion.div>
        </button>
        <div className="absolute bottom-3 left-3 z-10">
          <div className="text-xl font-extrabold text-white drop-shadow-lg leading-none">
            {formatPrice(p.base_price || p.priceINR || 0)}
          </div>
          {p.price_per_sqft && <div className="text-[10px] text-white/60 mt-0.5">₹{p.price_per_sqft.toLocaleString('en-IN')}/sqft</div>}
        </div>
        {(p.view_count || 0) > 0 && (
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[10px] text-white/80">
            <Eye className="w-3 h-3" /> {p.view_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-[15px] font-bold text-zinc-100 line-clamp-1 mb-1 group-hover:text-amber-400 transition-colors">{property.title}</h3>
        <div className="flex items-center gap-1 text-[12px] text-zinc-500 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{p.address || p.locality}, {p.city}</span>
        </div>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800/50">
          {p.bhk_type && (
            <div className="flex items-center gap-1 text-[13px] text-zinc-300 font-medium">
              <Bed className="w-3.5 h-3.5 text-zinc-500" />{p.bhk_type}
            </div>
          )}
          {p.bhk_type && <div className="w-px h-3 bg-zinc-800" />}
          {(p.carpet_area || p.sqft) && (
            <div className="flex items-center gap-1 text-[13px] text-zinc-300 font-medium">
              <Maximize className="w-3.5 h-3.5 text-zinc-500" />{p.carpet_area || p.sqft} sqft
            </div>
          )}
          {(p.possession_status || p.status) && (
            <>
              <div className="w-px h-3 bg-zinc-800" />
              <span className={cn('text-[11px] font-semibold', (p.possession_status || p.status) === 'ready-to-move' || (p.possession_status || p.status) === 'active' ? 'text-emerald-400' : 'text-amber-400')}>
                {(p.possession_status || p.status) === 'ready-to-move' || (p.possession_status || p.status) === 'active' ? 'Ready' : 'UC'}
              </span>
            </>
          )}
        </div>
        {p.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {p.amenities.slice(0, 3).map((a: string) => (
              <span key={a} className="px-1.5 py-0.5 bg-zinc-800/60 text-zinc-500 text-[10px] rounded-md border border-zinc-800/40">{a}</span>
            ))}
            {p.amenities.length > 3 && <span className="text-[10px] text-zinc-600 self-center">+{p.amenities.length - 3}</span>}
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-zinc-800/40 flex items-center justify-between gap-2">
          {p.builder ? (
            <div className="flex items-center gap-2 min-w-0">
              {p.builder.logo_url && (
                <Image src={p.builder.logo_url} alt={p.builder.company_name} width={22} height={22} className="rounded border border-zinc-800 flex-shrink-0" />
              )}
              <span className="text-[11px] text-zinc-500 truncate">{p.builder.company_name}</span>
              {p.builder.verified && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
            </div>
          ) : <span />}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); router.push(`/property/${slug}#schedule`) }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800/80 text-zinc-300 text-[11px] font-semibold rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700/50">
              <Calendar className="w-3 h-3" /> Visit
            </button>
            <button onClick={e => { e.stopPropagation(); router.push(`/property/${slug}#contact`) }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/15 text-amber-400 text-[11px] font-semibold rounded-lg hover:bg-amber-500/25 transition-colors border border-amber-500/20">
              <Phone className="w-3 h-3" /> Contact
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Property Card (List) ─────────────────────────────────────────────────────
function PropertyCardList({ property }: { property: Property }) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [heartAnim, setHeartAnim] = useState(false)

  const p = property as any
  const days = daysSince(property.created_at)
  const aiScore = getAiMatchScore(property)
  const imgSrc = p.thumbnail_url || property.images?.[0] || '/placeholder-property.jpg'
  const isNew = days <= 7
  const slug = p.slug || property.id

  return (
    <motion.div
      variants={cardVariants}
      onClick={() => router.push(`/property/${slug}`)}
      className="group bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-700/70 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 flex flex-col sm:flex-row"
    >
      <div className="relative sm:w-64 h-52 sm:h-auto flex-shrink-0 overflow-hidden">
        <Image src={imgSrc} alt={property.title} fill
          className={cn('object-cover transition-all duration-500 group-hover:scale-[1.04]', imgLoaded ? 'blur-0' : 'blur-md scale-105')}
          sizes="(max-width: 640px) 100vw, 256px"
          onLoad={() => setImgLoaded(true)} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isNew && <span className="px-2 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded-md uppercase tracking-widest">New</span>}
          {p.rera_verified && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] font-bold rounded-md">
              <Shield className="w-2.5 h-2.5" /> RERA
            </span>
          )}
        </div>
        {aiScore !== null && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/90 text-zinc-950 text-[10px] font-bold rounded-md">
              <Sparkles className="w-2.5 h-2.5" /> {aiScore}% Match
            </span>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); setFavorited(f => !f); setHeartAnim(true); setTimeout(() => setHeartAnim(false), 400) }}
          aria-label="Save" className="absolute top-3 right-3 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors">
          <motion.div animate={heartAnim ? { scale: [1, 1.5, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
            <Heart className={cn('w-4 h-4', favorited ? 'fill-red-500 text-red-500' : 'text-white')} />
          </motion.div>
        </button>
      </div>
      <div className="flex-1 p-5 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-zinc-100 line-clamp-1 group-hover:text-amber-400 transition-colors">{property.title}</h3>
            <div className="flex items-center gap-1 text-[12px] text-zinc-500 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{p.address || p.locality}, {p.city}{p.state ? `, ${p.state}` : ''}</span>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <span className="text-2xl font-extrabold text-amber-400 leading-none">{formatPrice(p.base_price || p.priceINR || 0)}</span>
          {p.price_per_sqft && <span className="text-xs text-zinc-500 ml-2">₹{p.price_per_sqft.toLocaleString('en-IN')}/sqft</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-sm text-zinc-300">
          {p.bhk_type && (
            <div className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-zinc-500" /><span className="font-medium">{p.bhk_type}</span></div>
          )}
          {(p.carpet_area || p.sqft) && (
            <div className="flex items-center gap-1.5"><Maximize className="w-4 h-4 text-zinc-500" /><span className="font-medium">{p.carpet_area || p.sqft} sqft</span></div>
          )}
          {p.possession_status && (
            <span className={cn('px-2 py-0.5 rounded-lg text-[11px] font-semibold border',
              p.possession_status === 'ready-to-move' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')}>
              {p.possession_status === 'ready-to-move' ? 'Ready to Move' : 'Under Construction'}
            </span>
          )}
        </div>
        {p.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.amenities.slice(0, 6).map((a: string) => (
              <span key={a} className="px-2 py-0.5 bg-zinc-800/60 text-zinc-400 text-[11px] rounded-md border border-zinc-800/50">{a}</span>
            ))}
            {p.amenities.length > 6 && <span className="text-[11px] text-zinc-600 self-center">+{p.amenities.length - 6}</span>}
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-zinc-800/40 flex items-center justify-between flex-wrap gap-3">
          {p.builder && (
            <div className="flex items-center gap-2 min-w-0">
              {p.builder.logo_url && (
                <Image src={p.builder.logo_url} alt={p.builder.company_name} width={28} height={28} className="rounded-lg border border-zinc-800 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs text-zinc-300 font-medium truncate block">{p.builder.company_name}</span>
                {p.builder.verified && <span className="flex items-center gap-0.5 text-[10px] text-emerald-400"><Check className="w-3 h-3" /> Verified</span>}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); router.push(`/property/${slug}#schedule`) }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700/50">
              <Calendar className="w-3.5 h-3.5" /> Schedule Visit
            </button>
            <button onClick={e => { e.stopPropagation(); router.push(`/property/${slug}#contact`) }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-xl hover:bg-amber-500/25 transition-colors border border-amber-500/25">
              <Phone className="w-3.5 h-3.5" /> Contact Builder
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── More Filters Drawer ──────────────────────────────────────────────────────
function DrawerSection({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-amber-500/80" />
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function MoreFiltersDrawer({ open, onClose, filters, setFilters, onApply, onClear, activeCount }: {
  open: boolean; onClose: () => void
  filters: FilterState; setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  onApply: () => void; onClear: () => void; activeCount: number
}) {
  const toggleArr = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[200]" onClick={onClose} />
          <motion.div key="panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[460px] bg-zinc-950 border-l border-zinc-800/80 z-[201] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-zinc-100">Advanced Filters</h2>
                {activeCount > 0 && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded-full">{activeCount}</span>}
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
              <DrawerSection title="Property Type" icon={Building2}>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(({ value, label }) => {
                    const active = filters.property_type.includes(value)
                    return (
                      <button key={value} onClick={() => toggleArr('property_type', value)}
                        className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                          active ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-300')}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </DrawerSection>
              <DrawerSection title="Configuration" icon={Bed}>
                <div className="flex flex-wrap gap-2">
                  {BHK_OPTIONS.map(bhk => {
                    const active = filters.bhk_type.includes(bhk)
                    return (
                      <button key={bhk} onClick={() => toggleArr('bhk_type', bhk)}
                        className={cn('px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                          active ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60 hover:border-zinc-700')}>
                        {bhk}
                      </button>
                    )
                  })}
                </div>
              </DrawerSection>
              <DrawerSection title="Budget Range" icon={IndianRupee}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(['min_price', 'max_price'] as const).map((key, i) => (
                      <div key={key} className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                        <input type="number" placeholder={i === 0 ? 'Min price' : 'Max price'} value={filters[key]}
                          onChange={e => setFilters(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full pl-6 pr-3 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BUDGET_PRESETS.map(preset => {
                      const isActive = filters.min_price === String(preset.min) && filters.max_price === String(preset.max)
                      return (
                        <button key={preset.label}
                          onClick={() => setFilters(p => ({ ...p, min_price: String(preset.min), max_price: String(preset.max) }))}
                          className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all',
                            isActive ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-zinc-900/60 text-zinc-500 border-zinc-800/40 hover:border-zinc-700 hover:text-zinc-400')}>
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </DrawerSection>
              <DrawerSection title="Area (sq.ft)" icon={Maximize}>
                <div className="grid grid-cols-2 gap-2">
                  {(['min_area', 'max_area'] as const).map((key, i) => (
                    <input key={key} type="number" placeholder={i === 0 ? 'Min sqft' : 'Max sqft'} value={filters[key]}
                      onChange={e => setFilters(p => ({ ...p, [key]: e.target.value }))}
                      className="px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors" />
                  ))}
                </div>
              </DrawerSection>
              <DrawerSection title="Possession Status" icon={Clock}>
                <div className="flex flex-col gap-2">
                  {[{ value: 'ready-to-move', label: 'Ready to Move' }, { value: 'under-construction', label: 'Under Construction' }].map(({ value, label }) => {
                    const active = filters.possession_status.includes(value)
                    return (
                      <label key={value} className="flex items-center gap-3 cursor-pointer group">
                        <div onClick={() => toggleArr('possession_status', value)}
                          className={cn('w-5 h-5 rounded-md border transition-all flex items-center justify-center flex-shrink-0',
                            active ? 'bg-amber-500 border-amber-500' : 'border-zinc-700 bg-zinc-800/60 group-hover:border-zinc-500')}>
                          {active && <Check className="w-3 h-3 text-zinc-950" />}
                        </div>
                        <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{label}</span>
                      </label>
                    )
                  })}
                </div>
              </DrawerSection>
              <DrawerSection title="Amenities" icon={Star}>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES_LIST.map(a => {
                    const active = filters.amenities.includes(a)
                    return (
                      <label key={a} className="flex items-center gap-2.5 cursor-pointer group">
                        <div onClick={() => toggleArr('amenities', a)}
                          className={cn('w-4 h-4 rounded border transition-all flex items-center justify-center flex-shrink-0',
                            active ? 'bg-amber-500 border-amber-500' : 'border-zinc-700 bg-zinc-800/60 group-hover:border-zinc-500')}>
                          {active && <Check className="w-2.5 h-2.5 text-zinc-950" />}
                        </div>
                        <span className="text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors">{a}</span>
                      </label>
                    )
                  })}
                </div>
              </DrawerSection>
              <DrawerSection title="Trust & Safety" icon={Shield}>
                <div className="space-y-3">
                  {([
                    { key: 'rera_verified' as const, label: 'RERA Verified', desc: 'Registered under RERA' },
                    { key: 'approved_by_bank' as const, label: 'Bank Approved', desc: 'Home loan available' },
                  ]).map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/40 hover:border-zinc-700/60 transition-colors">
                      <div onClick={() => setFilters(p => ({ ...p, [key]: !p[key] }))}
                        className={cn('w-10 h-6 rounded-full transition-all relative flex-shrink-0', filters[key] ? 'bg-amber-500' : 'bg-zinc-700')}>
                        <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', filters[key] ? 'left-5' : 'left-1')} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-zinc-300">{label}</span>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </DrawerSection>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800/60 flex-shrink-0 bg-zinc-950">
              <button onClick={onClear} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-colors border border-zinc-700/50">Clear All</button>
              <button onClick={() => { onApply(); onClose() }} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20">Show Results</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClearFilters, onBrowseAll }: { hasFilters: boolean; onClearFilters: () => void; onBrowseAll: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-zinc-800/60 border border-zinc-800/50 flex items-center justify-center mb-6">
        <Home className="w-10 h-10 text-zinc-600" />
      </div>
      <h3 className="text-xl font-bold text-zinc-200 mb-2">{hasFilters ? 'No properties match your filters' : 'No properties available'}</h3>
      <p className="text-sm text-zinc-500 mb-8 max-w-sm">{hasFilters ? 'Try adjusting your criteria or removing some filters.' : 'New properties are added regularly. Check back soon.'}</p>
      <div className="flex items-center gap-3">
        {hasFilters && (
          <button onClick={onClearFilters} className="px-5 py-2.5 bg-amber-500/15 text-amber-400 text-sm font-semibold rounded-xl border border-amber-500/25 hover:bg-amber-500/25 transition-colors">Clear Filters</button>
        )}
        <button onClick={onBrowseAll} className="px-5 py-2.5 bg-zinc-800 text-zinc-200 text-sm font-semibold rounded-xl border border-zinc-700/50 hover:bg-zinc-700 transition-colors">Browse All</button>
      </div>
    </motion.div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-zinc-200 mb-1">Something went wrong</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">{message}</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 text-zinc-200 text-sm font-semibold rounded-xl border border-zinc-700/50 hover:bg-zinc-700 transition-colors">
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </motion.div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ pagination, onPageChange }: { pagination: PaginationState; onPageChange: (p: number) => void }) {
  if (pagination.total_pages <= 1) return null
  const { page, total_pages } = pagination
  const pages: (number | '...')[] = []
  if (total_pages <= 7) { for (let i = 1; i <= total_pages; i++) pages.push(i) }
  else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(total_pages - 1, page + 1); i++) pages.push(i)
    if (page < total_pages - 2) pages.push('...')
    pages.push(total_pages)
  }
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button onClick={() => onPageChange(page - 1)} disabled={!pagination.has_prev}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-sm text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 hover:text-zinc-300 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? <span key={`e${i}`} className="px-2 text-zinc-600 text-sm">...</span> : (
          <button key={p} onClick={() => onPageChange(p as number)}
            className={cn('w-9 h-9 rounded-xl text-sm font-semibold transition-all',
              page === p ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/25' : 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300')}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPageChange(page + 1)} disabled={!pagination.has_next}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-sm text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 hover:text-zinc-300 transition-colors">
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Filter Init ──────────────────────────────────────────────────────────────
function buildDefaultFilters(sp: ReturnType<typeof useSearchParams>): FilterState {
  return {
    q: sp.get('q') || '', city: sp.get('city') || '',
    property_type: sp.getAll('property_type'), bhk_type: sp.getAll('bhk_type'),
    min_price: sp.get('min_price') || '', max_price: sp.get('max_price') || '',
    min_area: sp.get('min_area') || '', max_area: sp.get('max_area') || '',
    possession_status: sp.getAll('possession_status'), amenities: sp.getAll('amenities'),
    rera_verified: sp.get('rera_verified') === 'true', approved_by_bank: sp.get('approved_by_bank') === 'true',
  }
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function PropertyListingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reducedMotion = useReducedMotion()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [savedSearch, setSavedSearch] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [pagination, setPagination] = useState<PaginationState>({ page: Number(searchParams.get('page')) || 1, limit: 18, total: 0, total_pages: 0, has_next: false, has_prev: false })
  const [filters, setFilters] = useState<FilterState>(() => buildDefaultFilters(searchParams))
  const sortMenuRef = useRef<HTMLDivElement>(null)

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.q) n++; if (filters.city) n++
    n += filters.property_type.length + filters.bhk_type.length
    if (filters.min_price || filters.max_price) n++
    if (filters.min_area || filters.max_area) n++
    n += filters.possession_status.length + filters.amenities.length
    if (filters.rera_verified) n++; if (filters.approved_by_bank) n++
    return n
  }, [filters])

  const activeChips = useMemo(() => {
    const chips: { label: string; remove: () => void }[] = []
    if (filters.city) chips.push({ label: filters.city, remove: () => setFilters(p => ({ ...p, city: '' })) })
    if (filters.q) chips.push({ label: `"${filters.q}"`, remove: () => { setFilters(p => ({ ...p, q: '' })); setSearchInput('') } })
    filters.bhk_type.forEach(b => chips.push({ label: b, remove: () => setFilters(p => ({ ...p, bhk_type: p.bhk_type.filter(v => v !== b) })) }))
    filters.property_type.forEach(t => chips.push({ label: t.charAt(0).toUpperCase() + t.slice(1), remove: () => setFilters(p => ({ ...p, property_type: p.property_type.filter(v => v !== t) })) }))
    if (filters.min_price || filters.max_price) chips.push({ label: `${filters.min_price ? formatPrice(+filters.min_price) : '₹0'} – ${filters.max_price ? formatPrice(+filters.max_price) : 'Any'}`, remove: () => setFilters(p => ({ ...p, min_price: '', max_price: '' })) })
    if (filters.rera_verified) chips.push({ label: 'RERA Verified', remove: () => setFilters(p => ({ ...p, rera_verified: false })) })
    if (filters.approved_by_bank) chips.push({ label: 'Bank Approved', remove: () => setFilters(p => ({ ...p, approved_by_bank: false })) })
    filters.possession_status.forEach(s => chips.push({ label: s === 'ready-to-move' ? 'Ready to Move' : 'Under Construction', remove: () => setFilters(p => ({ ...p, possession_status: p.possession_status.filter(v => v !== s) })) }))
    return chips
  }, [filters])

  const fetchProperties = useCallback(async (isTransition = false) => {
    if (isTransition) setTransitioning(true)
    else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      searchParams.forEach((value, key) => params.append(key, value))
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (sortBy !== 'relevance') params.set('sort', sortBy)
      const res = await fetch(`/api/properties-list?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
      const data = await res.json()
      const list: Property[] = Array.isArray(data) ? data : Array.isArray(data.properties) ? data.properties : Array.isArray(data.data?.properties) ? data.data.properties : []
      setProperties(list)
      if (data.pagination) setPagination(data.pagination)
      else setPagination(prev => ({ ...prev, total: list.length, total_pages: Math.ceil(list.length / prev.limit), has_next: false, has_prev: prev.page > 1 }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties')
    } finally {
      setLoading(false)
      setTransitioning(false)
    }
  }, [searchParams, pagination.page, pagination.limit, sortBy])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setShowSortMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const applyFilters = useCallback(() => { setPagination(p => ({ ...p, page: 1 })); router.push(buildUrl(filters, sortBy, 1)); setShowMoreFilters(false) }, [filters, sortBy, router])
  const clearFilters = useCallback(() => {
    const c: FilterState = { q: '', city: '', property_type: [], bhk_type: [], min_price: '', max_price: '', min_area: '', max_area: '', possession_status: [], amenities: [], rera_verified: false, approved_by_bank: false }
    setFilters(c); setSearchInput(''); router.push('/property-listing')
  }, [router])
  const toggleBhk = useCallback((bhk: string) => { const arr = filters.bhk_type.includes(bhk) ? filters.bhk_type.filter(b => b !== bhk) : [...filters.bhk_type, bhk]; const u = { ...filters, bhk_type: arr }; setFilters(u); router.push(buildUrl(u, sortBy, 1)) }, [filters, sortBy, router])
  const toggleRera = useCallback(() => { const u = { ...filters, rera_verified: !filters.rera_verified }; setFilters(u); router.push(buildUrl(u, sortBy, 1)) }, [filters, sortBy, router])
  const handleSort = useCallback((id: string) => { setSortBy(id); setShowSortMenu(false); router.push(buildUrl(filters, id, 1)) }, [filters, router])
  const handlePageChange = useCallback((page: number) => { setPagination(p => ({ ...p, page })); router.push(buildUrl(filters, sortBy, page)); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [filters, sortBy, router])

  const resultsLabel = useMemo(() => {
    const loc = filters.city || (filters.q ? `"${filters.q}"` : 'all areas')
    if (pagination.total > 0) return `${pagination.total.toLocaleString('en-IN')} properties in ${loc}`
    if (properties.length > 0) return `${properties.length} properties`
    return null
  }, [pagination.total, filters, properties.length])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ═══ STICKY FILTER BAR ═══════════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/60 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            {/* Search */}
            <div className="relative flex-shrink-0 w-52 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setFilters(p => ({ ...p, q: searchInput })); router.push(buildUrl({ ...filters, q: searchInput }, sortBy, 1)) } }}
                placeholder="City, project, builder..." autoComplete="off"
                className="w-full pl-9 pr-3 py-2 bg-zinc-900/80 border border-zinc-800/60 rounded-xl text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all" />
            </div>
            <div className="w-px h-5 bg-zinc-800/80 flex-shrink-0" />
            {BHK_OPTIONS.map(bhk => (
              <button key={bhk} onClick={() => toggleBhk(bhk)}
                className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all whitespace-nowrap flex-shrink-0',
                  filters.bhk_type.includes(bhk) ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-300')}>
                {bhk}
              </button>
            ))}
            <div className="w-px h-5 bg-zinc-800/80 flex-shrink-0" />
            <button onClick={toggleRera}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all whitespace-nowrap flex-shrink-0',
                filters.rera_verified ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-300')}>
              <Shield className="w-3.5 h-3.5" /> RERA
            </button>
            <button onClick={() => setShowMoreFilters(true)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all whitespace-nowrap flex-shrink-0 ml-auto',
                activeFilterCount > 0 ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-300')}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> More Filters
              {activeFilterCount > 0 && <span className="px-1.5 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded-full">{activeFilterCount}</span>}
            </button>
          </div>
          <AnimatePresence>
            {activeChips.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="flex items-center gap-2 pb-2.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] text-zinc-600 flex-shrink-0">Active:</span>
                <AnimatePresence mode="popLayout">
                  {activeChips.map(chip => <ActiveChip key={chip.label} label={chip.label} onRemove={chip.remove} />)}
                </AnimatePresence>
                <button onClick={clearFilters} className="ml-1 text-[11px] text-zinc-600 hover:text-zinc-400 underline underline-offset-2 transition-colors flex-shrink-0">Clear all</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ PAGE BODY ═══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results header */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            {loading ? (
              <div className="h-6 w-56 bg-zinc-800/50 rounded-lg animate-pulse" />
            ) : resultsLabel ? (
              <h2 className="text-[15px] font-semibold text-zinc-300">
                <span className="text-zinc-100 font-bold">{resultsLabel.split(' ')[0]}</span>{' '}
                {resultsLabel.split(' ').slice(1).join(' ')}
              </h2>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setSavedSearch(p => !p)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all',
                savedSearch ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-zinc-900/60 text-zinc-500 border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-400')}>
              <Bookmark className={cn('w-3.5 h-3.5', savedSearch && 'fill-amber-400')} />
              {savedSearch ? 'Saved' : 'Save Search'}
            </button>
            <div className="relative" ref={sortMenuRef}>
              <button onClick={() => setShowSortMenu(p => !p)}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-[12px] text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-all">
                <ArrowUpDown className="w-3.5 h-3.5" />
                {SORT_OPTIONS.find(s => s.id === sortBy)?.label ?? 'Sort'}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showSortMenu && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    {SORT_OPTIONS.map(option => (
                      <button key={option.id} onClick={() => handleSort(option.id)}
                        className={cn('w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between',
                          sortBy === option.id ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300')}>
                        {option.label}
                        {sortBy === option.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-0.5">
              {([{ mode: 'grid' as const, Icon: LayoutGrid, label: 'Grid' }, { mode: 'list' as const, Icon: List, label: 'List' }] as const).map(({ mode, Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)} aria-label={`${label} view`}
                  className={cn('p-2 rounded-lg transition-all', viewMode === mode ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-600 hover:text-zinc-400')}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && !transitioning && (
          <motion.div variants={reducedMotion ? undefined : containerVariants} initial="hidden" animate="show"
            className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4')}>
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} layout={viewMode} />)}
          </motion.div>
        )}

        {/* Error */}
        {!loading && error && <ErrorState message={error} onRetry={() => fetchProperties()} />}

        {/* Empty */}
        {!loading && !error && properties.length === 0 && (
          <EmptyState hasFilters={activeFilterCount > 0} onClearFilters={clearFilters} onBrowseAll={() => router.push('/property-listing')} />
        )}

        {/* Results */}
        {!error && properties.length > 0 && (
          <AnimatePresence mode="wait">
            {transitioning ? (
              <motion.div key="skeleton" variants={reducedMotion ? undefined : fadeVariants} initial="hidden" animate="show" exit="exit"
                className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4')}>
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} layout={viewMode} />)}
              </motion.div>
            ) : (
              <motion.div key={`r-${pagination.page}-${sortBy}-${viewMode}`}
                variants={reducedMotion ? undefined : containerVariants} initial="hidden" animate="show"
                className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4')}>
                {properties.map(property =>
                  viewMode === 'grid' ? <PropertyCardGrid key={property.id} property={property} /> : <PropertyCardList key={property.id} property={property} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!loading && !error && properties.length > 0 && <Pagination pagination={pagination} onPageChange={handlePageChange} />}
      </div>

      <MoreFiltersDrawer open={showMoreFilters} onClose={() => setShowMoreFilters(false)} filters={filters} setFilters={setFilters} onApply={applyFilters} onClear={clearFilters} activeCount={activeFilterCount} />
    </div>
  )
}

export default function PropertyListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Home className="w-6 h-6 text-amber-500/70" />
            </div>
            <Loader2 className="absolute -inset-2 w-16 h-16 text-amber-500/30 animate-spin" />
          </div>
          <span className="text-sm text-zinc-500">Finding properties...</span>
        </div>
      </div>
    }>
      <PropertyListingContent />
    </Suspense>
  )
}
