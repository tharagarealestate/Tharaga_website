'use client'

import {
  Suspense, useState, useEffect, useMemo, useCallback, useRef,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Property } from '@/types/property'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  Search, MapPin, Bed, Maximize, Heart,
  SlidersHorizontal, LayoutGrid, List, ChevronDown, X, Shield,
  Building2, ArrowUpDown, ChevronLeft, ChevronRight,
  Sparkles, Check, AlertCircle,
  Calendar, RefreshCw, Phone, Clock, Mic,
  Brain, Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
]
const BHK_OPTIONS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+']
const BUDGET_PRESETS = [
  { label: 'Under Rs.30L', min: 0, max: 3000000 },
  { label: 'Rs.30L-Rs.60L', min: 3000000, max: 6000000 },
  { label: 'Rs.60L-Rs.1Cr', min: 6000000, max: 10000000 },
  { label: 'Rs.1Cr-Rs.2Cr', min: 10000000, max: 20000000 },
  { label: 'Above Rs.2Cr', min: 20000000, max: 0 },
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
]
const AI_PROMPTS = [
  '3BHK near metro under Rs.80L',
  'Villa with pool in ECR',
  'Ready to move apartment in OMR',
  'Budget flat under Rs.40L',
  'Luxury penthouse with sea view',
]

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  if (price >= 10000000) return 'Rs.' + (price / 10000000).toFixed(1) + ' Cr'
  if (price >= 100000) return 'Rs.' + (price / 100000).toFixed(1) + ' L'
  return 'Rs.' + price.toLocaleString('en-IN')
}
function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}
function getAiScore(property: Property): number | null {
  const p = property as any
  if (p.ai_insights?.location_score?.overall) return Math.round(p.ai_insights.location_score.overall * 10)
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
  return '/property-listing?' + params.toString()
}
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

// ─── Ambient Background ───────────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-zinc-950" />
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute -bottom-40 -right-40 w-[800px] h-[800px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(251,191,36,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.4) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/60" />
    </div>
  )
}

// ─── Neural Pulse ─────────────────────────────────────────────────────────────
function NeuralPulse({ color = 'bg-amber-400' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <motion.span
        animate={{ scale: [1, 2.5], opacity: [0.7, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        className={cn('absolute inline-flex h-full w-full rounded-full', color)}
      />
      <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', color)} />
    </span>
  )
}

// ─── AI Match Badge ───────────────────────────────────────────────────────────
function AIMatchBadge({ score }: { score: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30"
    >
      <motion.div
        animate={{ boxShadow: ['0 0 0 0px rgba(251,191,36,0.5)', '0 0 0 5px rgba(251,191,36,0)'] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full bg-amber-400"
      />
      <span className="text-[10px] font-bold text-amber-400">{score}% Match</span>
    </motion.div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="h-56 bg-gradient-to-r from-zinc-800/80 via-zinc-700/40 to-zinc-800/80"
      />
      <div className="p-5 space-y-3">
        {[3/4, 1/2, 1].map((w, i) => (
          <motion.div key={i}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
            className="h-4 bg-zinc-800/80 rounded-lg"
            style={{ width: w * 100 + '%' }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Tilt Card ────────────────────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 })

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 } as any}
      onMouseMove={(e) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={cn('relative', className)}
    >
      {children}
    </motion.div>
  )
}

// ─── Property Card Grid ───────────────────────────────────────────────────────
function PropertyCardGrid({ property, index }: { property: Property; index: number }) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [hover, setHover] = useState(false)
  const p = property as any
  const aiScore = getAiScore(property)
  const imgSrc = p.thumbnail_url || property.images?.[0] || null
  const isNew = property.created_at ? daysSince(property.created_at) <= 7 : false
  const slug = p.slug || property.id
  const price = p.base_price || p.price_inr || p.priceINR || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 28 }}
    >
      <TiltCard>
        <div
          onClick={() => router.push('/property/' + slug)}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="group relative bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden cursor-pointer hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/[0.07]"
        >
          {/* Image */}
          <div className="relative h-56 overflow-hidden bg-zinc-900/60">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={property.title}
                onLoad={() => setImgLoaded(true)}
                className={cn('w-full h-full object-cover transition-transform duration-500 group-hover:scale-105', imgLoaded ? 'opacity-100' : 'opacity-0')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-zinc-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            {/* Shimmer on hover */}
            <motion.div
              animate={hover ? { x: ['−100%', '200%'] } : { x: '-100%' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(251,191,36,0.08) 50%, transparent 60%)' }}
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 z-10">
              {isNew && <span className="px-2 py-0.5 bg-amber-500 text-zinc-950 text-[9px] font-black rounded-md uppercase tracking-widest">New</span>}
              {p.rera_verified && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 text-white text-[9px] font-bold rounded-md">
                  <Shield className="w-2 h-2" /> RERA
                </span>
              )}
            </div>
            {aiScore !== null && (
              <div className="absolute top-3 right-12 z-10"><AIMatchBadge score={aiScore} /></div>
            )}
            <button
              onClick={e => { e.stopPropagation(); setFavorited(f => !f) }}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
            >
              <Heart className={cn('w-4 h-4', favorited ? 'fill-red-500 text-red-500' : 'text-white')} />
            </button>
            {/* Price overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between">
              {price > 0 && <span className="text-xl font-extrabold text-white drop-shadow-lg">{formatPrice(price)}</span>}
              {(p.bhk_type || p.property_type) && (
                <span className="px-2 py-0.5 bg-black/60 text-zinc-200 text-[10px] rounded-md backdrop-blur-sm">
                  {p.bhk_type || p.property_type}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">{property.title}</h3>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-3">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{p.locality ? p.locality + ', ' : ''}{p.city || 'Chennai'}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400 mb-4">
              {(p.carpet_area || p.sqft) ? (
                <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{(p.carpet_area || p.sqft).toLocaleString()} sqft</span>
              ) : null}
              {p.possession_status && (
                <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold',
                  p.possession_status === 'ready-to-move' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
                  <Clock className="w-2.5 h-2.5" />{p.possession_status === 'ready-to-move' ? 'Ready' : 'Under Const.'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={e => { e.stopPropagation(); router.push('/property/' + slug + '#schedule') }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-[11px] font-semibold rounded-xl transition-colors border border-zinc-700/50"
              >
                <Calendar className="w-3 h-3" /> Visit
              </button>
              <button
                onClick={e => { e.stopPropagation(); router.push('/property/' + slug + '#contact') }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[11px] font-semibold rounded-xl transition-colors border border-amber-500/25"
              >
                <Phone className="w-3 h-3" /> Contact
              </button>
            </div>
          </div>
          <motion.div
            animate={hover ? { opacity: 1 } : { opacity: 0 }}
            className="absolute inset-0 pointer-events-none rounded-xl border border-amber-500/20"
          />
        </div>
      </TiltCard>
    </motion.div>
  )
}

// ─── Property Card List ───────────────────────────────────────────────────────
function PropertyCardList({ property, index }: { property: Property; index: number }) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const p = property as any
  const aiScore = getAiScore(property)
  const imgSrc = p.thumbnail_url || property.images?.[0] || null
  const slug = p.slug || property.id
  const price = p.base_price || p.price_inr || p.priceINR || 0
  const isNew = property.created_at ? daysSince(property.created_at) <= 7 : false

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 28 }}
      onClick={() => router.push('/property/' + slug)}
      className="group flex gap-4 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl cursor-pointer hover:border-amber-500/30 hover:bg-zinc-900/60 transition-all"
    >
      <div className="relative w-48 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-900">
        {imgSrc ? (
          <img src={imgSrc} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-zinc-700" />
          </div>
        )}
        {aiScore !== null && (
          <div className="absolute top-2 left-2"><AIMatchBadge score={aiScore} /></div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-base font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1">{property.title}</h3>
            {isNew && <span className="flex-shrink-0 px-2 py-0.5 bg-amber-500 text-zinc-950 text-[9px] font-black rounded uppercase tracking-widest">New</span>}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.locality ? p.locality + ', ' : ''}{p.city}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400">
            {p.bhk_type && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bhk_type}</span>}
            {(p.carpet_area || p.sqft) && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{(p.carpet_area || p.sqft).toLocaleString()} sqft</span>}
            {p.rera_verified && <span className="flex items-center gap-1 text-emerald-400"><Shield className="w-3 h-3" />RERA</span>}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-extrabold text-amber-400">{price > 0 ? formatPrice(price) : 'Contact'}</span>
            {p.price_per_sqft && <span className="text-[10px] text-zinc-600 ml-2">Rs.{p.price_per_sqft.toLocaleString('en-IN')}/sqft</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); router.push('/property/' + slug + '#schedule') }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-xl transition-colors border border-zinc-700/50"
            >
              Schedule Visit
            </button>
            <button
              onClick={e => { e.stopPropagation(); setFavorited(f => !f) }}
              className="w-8 h-8 flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition-colors"
            >
              <Heart className={cn('w-3.5 h-3.5', favorited ? 'fill-red-500 text-red-500' : 'text-zinc-400')} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── AI Search Bar ────────────────────────────────────────────────────────────
function AISearchBar({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const [focused, setFocused] = useState(false)
  const [promptIdx, setPromptIdx] = useState(0)

  useEffect(() => {
    if (focused) return
    const t = setInterval(() => setPromptIdx(i => (i + 1) % AI_PROMPTS.length), 3000)
    return () => clearInterval(t)
  }, [focused])

  return (
    <motion.div
      animate={{ borderColor: focused ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)' }}
      className="relative flex items-center bg-zinc-900/80 backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl shadow-black/20"
    >
      <div className="flex items-center gap-2 pl-5 pr-3 border-r border-zinc-800 flex-shrink-0">
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
          <Brain className="w-4 h-4 text-amber-400" />
        </motion.div>
        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest hidden sm:block">AI</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        placeholder={focused ? 'Describe your dream home...' : AI_PROMPTS[promptIdx]}
        className="flex-1 px-4 py-4 bg-transparent text-zinc-100 placeholder:text-zinc-600 text-sm outline-none min-w-0"
      />
      <button
        onClick={onSubmit}
        className="mx-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors flex-shrink-0"
      >
        Search
      </button>
    </motion.div>
  )
}

// ─── Active Chip ──────────────────────────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-medium"
    >
      {label}
      <button onClick={onRemove} className="hover:text-amber-300 transition-colors"><X className="w-3 h-3" /></button>
    </motion.span>
  )
}

// ─── Filters Drawer ───────────────────────────────────────────────────────────
function FiltersDrawer({ open, onClose, filters, setFilters, onApply, onClear }: {
  open: boolean; onClose: () => void
  filters: FilterState; setFilters: (f: FilterState) => void
  onApply: () => void; onClear: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-zinc-950 border-l border-zinc-800/60 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-800/50 sticky top-0 bg-zinc-950 z-10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-zinc-100">Filters</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="p-5 space-y-7">
              {/* Property Type */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Property Type</h3>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button key={pt.value}
                      onClick={() => {
                        const arr = filters.property_type.includes(pt.value)
                          ? filters.property_type.filter(v => v !== pt.value)
                          : [...filters.property_type, pt.value]
                        setFilters({ ...filters, property_type: arr })
                      }}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                        filters.property_type.includes(pt.value)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700')}>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* BHK */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">BHK Type</h3>
                <div className="flex flex-wrap gap-2">
                  {BHK_OPTIONS.map(bhk => (
                    <button key={bhk}
                      onClick={() => {
                        const arr = filters.bhk_type.includes(bhk)
                          ? filters.bhk_type.filter(v => v !== bhk)
                          : [...filters.bhk_type, bhk]
                        setFilters({ ...filters, bhk_type: arr })
                      }}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                        filters.bhk_type.includes(bhk)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700')}>
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>
              {/* Budget */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Budget</h3>
                <div className="space-y-2">
                  {BUDGET_PRESETS.map(preset => (
                    <button key={preset.label}
                      onClick={() => setFilters({ ...filters, min_price: preset.min > 0 ? String(preset.min) : '', max_price: preset.max > 0 ? String(preset.max) : '' })}
                      className={cn('w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium border transition-colors',
                        filters.min_price === String(preset.min) && (preset.max === 0 || filters.max_price === String(preset.max))
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700')}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Possession */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Possession Status</h3>
                <div className="flex flex-wrap gap-2">
                  {[{ value: 'ready-to-move', label: 'Ready to Move' }, { value: 'under-construction', label: 'Under Construction' }].map(opt => (
                    <button key={opt.value}
                      onClick={() => {
                        const arr = filters.possession_status.includes(opt.value)
                          ? filters.possession_status.filter(v => v !== opt.value)
                          : [...filters.possession_status, opt.value]
                        setFilters({ ...filters, possession_status: arr })
                      }}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                        filters.possession_status.includes(opt.value)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Amenities */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(a => (
                    <button key={a}
                      onClick={() => {
                        const arr = filters.amenities.includes(a)
                          ? filters.amenities.filter(v => v !== a)
                          : [...filters.amenities, a]
                        setFilters({ ...filters, amenities: arr })
                      }}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                        filters.amenities.includes(a)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700')}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              {/* RERA */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Verification</h3>
                <button
                  onClick={() => setFilters({ ...filters, rera_verified: !filters.rera_verified })}
                  className={cn('flex items-center gap-2.5 px-4 py-2.5 w-full rounded-xl text-xs font-medium border transition-colors',
                    filters.rera_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700')}
                >
                  <Shield className="w-3.5 h-3.5" />
                  RERA Verified Only
                  {filters.rera_verified && <Check className="w-3 h-3 ml-auto" />}
                </button>
              </div>
            </div>
            <div className="sticky bottom-0 flex gap-3 p-5 bg-zinc-950 border-t border-zinc-800/50">
              <button onClick={onClear} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors">Clear All</button>
              <button onClick={onApply} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors">Apply Filters</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full flex flex-col items-center py-24 px-6">
      <div className="relative mb-6">
        <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl" />
        <div className="relative w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-zinc-600" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-zinc-300 mb-2">{hasFilters ? 'No properties match your filters' : 'No properties available yet'}</h3>
      <p className="text-sm text-zinc-600 mb-6 text-center max-w-sm">
        {hasFilters ? 'Try adjusting your search criteria.' : 'New properties are being listed. Check back soon.'}
      </p>
      {hasFilters && (
        <button onClick={onClearFilters}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors">
          <X className="w-4 h-4" /> Clear All Filters
        </button>
      )}
    </motion.div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full flex flex-col items-center py-24 px-6">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-zinc-200 mb-1">Something went wrong</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs text-center">{message}</p>
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
    <div className="flex items-center justify-center gap-1.5 mt-12">
      <button onClick={() => onPageChange(page - 1)} disabled={!pagination.has_prev}
        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-amber-500/30 hover:text-amber-400 transition-all">
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? <span key={'e' + i} className="px-2 text-zinc-600">...</span> : (
          <button key={p} onClick={() => onPageChange(p as number)}
            className={cn('w-9 h-9 rounded-xl text-sm font-semibold transition-all',
              page === p ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/25' : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-amber-500/30 hover:text-amber-400')}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPageChange(page + 1)} disabled={!pagination.has_next}
        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-amber-500/30 hover:text-amber-400 transition-all">
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function PropertyListingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [pagination, setPagination] = useState<PaginationState>({
    page: Number(searchParams.get('page')) || 1, limit: 18, total: 0, total_pages: 0, has_next: false, has_prev: false,
  })
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

  const fetchProperties = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      searchParams.forEach((value, key) => params.append(key, value))
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (sortBy !== 'relevance') params.set('sort', sortBy)
      const res = await fetch('/api/properties-list?' + params.toString())
      if (!res.ok) throw new Error('Failed to fetch (' + res.status + ')')
      const data = await res.json()
      const list: Property[] = Array.isArray(data) ? data : Array.isArray(data.properties) ? data.properties : []
      setProperties(list)
      if (data.pagination) setPagination(data.pagination)
      else setPagination(prev => ({ ...prev, total: list.length, total_pages: Math.ceil(list.length / prev.limit), has_next: false, has_prev: prev.page > 1 }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [searchParams, pagination.page, pagination.limit, sortBy])

  useEffect(() => { fetchProperties() }, [fetchProperties])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setShowSortMenu(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const applyFilters = useCallback(() => {
    setPagination(p => ({ ...p, page: 1 })); router.push(buildUrl(filters, sortBy, 1)); setShowFilters(false)
  }, [filters, sortBy, router])

  const clearFilters = useCallback(() => {
    const c: FilterState = { q: '', city: '', property_type: [], bhk_type: [], min_price: '', max_price: '', min_area: '', max_area: '', possession_status: [], amenities: [], rera_verified: false, approved_by_bank: false }
    setFilters(c); setSearchInput(''); router.push('/property-listing')
  }, [router])

  const handleSearch = useCallback(() => {
    const u = { ...filters, q: searchInput }
    setFilters(u); setPagination(p => ({ ...p, page: 1 })); router.push(buildUrl(u, sortBy, 1))
  }, [filters, searchInput, sortBy, router])

  const toggleBhk = useCallback((bhk: string) => {
    const arr = filters.bhk_type.includes(bhk) ? filters.bhk_type.filter(b => b !== bhk) : [...filters.bhk_type, bhk]
    const u = { ...filters, bhk_type: arr }; setFilters(u); router.push(buildUrl(u, sortBy, 1))
  }, [filters, sortBy, router])

  const handleSort = useCallback((id: string) => {
    setSortBy(id); setShowSortMenu(false); router.push(buildUrl(filters, id, 1))
  }, [filters, router])

  const handlePageChange = useCallback((page: number) => {
    setPagination(p => ({ ...p, page })); router.push(buildUrl(filters, sortBy, page)); window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, sortBy, router])

  const resultsLabel = useMemo(() => {
    const loc = filters.city || (filters.q ? '"' + filters.q + '"' : 'all areas')
    if (pagination.total > 0) return pagination.total.toLocaleString('en-IN') + ' properties in ' + loc
    if (properties.length > 0) return properties.length + ' properties'
    return null
  }, [pagination.total, filters, properties.length])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AmbientBackground />

      {/* Hero Section */}
      <div className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <NeuralPulse />
            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-widest">AI-Powered Property Discovery</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">Find Your</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 bg-clip-text text-transparent">Perfect Home</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-zinc-500 text-base mb-8 max-w-xl mx-auto">
            Real-time property intelligence. AI-matched listings. Verified by RERA.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-2xl mx-auto">
            <AISearchBar value={searchInput} onChange={setSearchInput} onSubmit={handleSearch} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {BHK_OPTIONS.map(bhk => (
              <button key={bhk} onClick={() => toggleBhk(bhk)}
                className={cn('px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200',
                  filters.bhk_type.includes(bhk)
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-amber-500/20 hover:text-zinc-300')}>
                {bhk}
              </button>
            ))}
            <button
              onClick={() => setFilters(f => ({ ...f, rera_verified: !f.rera_verified }))}
              className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200',
                filters.rera_verified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-emerald-500/20 hover:text-zinc-300')}>
              <Shield className="w-3 h-3" /> RERA Verified
            </button>
          </motion.div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0 hidden sm:block">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  </motion.div>
                  <span>AI scanning properties...</span>
                </div>
              ) : resultsLabel ? (
                <span className="text-xs text-zinc-500">{resultsLabel}</span>
              ) : null}
            </div>

            {/* Sort */}
            <div className="relative" ref={sortMenuRef}>
              <button onClick={() => setShowSortMenu(s => !s)}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 hover:border-amber-500/25 hover:text-zinc-300 transition-all">
                <ArrowUpDown className="w-3 h-3" />
                {SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Sort'}
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800/60 rounded-xl shadow-xl overflow-hidden z-50">
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => handleSort(opt.id)}
                        className={cn('w-full text-left px-4 py-2.5 text-xs transition-colors',
                          sortBy === opt.id ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50')}>
                        {sortBy === opt.id && <Check className="w-3 h-3 inline mr-2" />}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View mode */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
              <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'list' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(true)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all',
                activeFilterCount > 0 ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-amber-500/20 hover:text-zinc-300')}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-500 text-zinc-950 text-[9px] font-black">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Active chips */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-none">
                {filters.q && <ActiveChip label={'"' + filters.q + '"'} onRemove={() => { setFilters(f => ({ ...f, q: '' })); setSearchInput('') }} />}
                {filters.city && <ActiveChip label={filters.city} onRemove={() => setFilters(f => ({ ...f, city: '' }))} />}
                {filters.bhk_type.map(b => <ActiveChip key={b} label={b} onRemove={() => setFilters(f => ({ ...f, bhk_type: f.bhk_type.filter(v => v !== b) }))} />)}
                {filters.property_type.map(pt => <ActiveChip key={pt} label={pt} onRemove={() => setFilters(f => ({ ...f, property_type: f.property_type.filter(v => v !== pt) }))} />)}
                {(filters.min_price || filters.max_price) && (
                  <ActiveChip label={'Budget filter'} onRemove={() => setFilters(f => ({ ...f, min_price: '', max_price: '' }))} />
                )}
                {filters.rera_verified && <ActiveChip label="RERA Verified" onRemove={() => setFilters(f => ({ ...f, rera_verified: false }))} />}
                <button onClick={clearFilters} className="flex-shrink-0 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-0.5">Clear all</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorState message={error} onRetry={fetchProperties} />
            </motion.div>
          ) : properties.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState hasFilters={activeFilterCount > 0} onClearFilters={clearFilters} />
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property, i) => (
                <PropertyCardGrid key={property.id} property={property} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {properties.map((property, i) => (
                <PropertyCardList key={property.id} property={property} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && properties.length > 0 && (
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        )}
        <div className="h-20" />
      </div>

      <FiltersDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function PropertyListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <Cpu className="w-8 h-8 text-amber-400" />
        </motion.div>
      </div>
    }>
      <PropertyListingContent />
    </Suspense>
  )
}
