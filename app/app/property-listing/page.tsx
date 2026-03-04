'use client'

import {
  Suspense, useState, useEffect, useMemo, useRef, useCallback,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Property } from '@/types/property'
import {
  motion, AnimatePresence, useMotionValue, useTransform, useSpring,
  useInView,
} from 'framer-motion'
import {
  Search, MapPin, Bed, Maximize, Heart,
  SlidersHorizontal, LayoutGrid, List, X, Shield,
  Building2, ChevronLeft, ChevronRight,
  Sparkles, Check, Phone, Brain, Cpu,
  ArrowRight, Star, Zap, TrendingUp, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Filters {
  q: string
  city: string
  property_type: string[]
  bhk_type: string[]
  min_price: string
  max_price: string
  rera_verified: boolean
  sort: string
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CITIES = ['Chennai', 'Bengaluru', 'Coimbatore', 'Madurai', 'Hyderabad', 'Mumbai', 'Pune']
const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Penthouse', 'Studio', 'Duplex', 'Commercial']
const BHK_OPTIONS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+']
const SORT_OPTIONS = [
  { id: 'relevance', label: 'AI Relevance' },
  { id: 'price_low', label: 'Price ↑' },
  { id: 'price_high', label: 'Price ↓' },
  { id: 'newest', label: 'Newest' },
]
const AI_PROMPTS = [
  '3BHK near metro in Chennai…',
  'Beachfront villa under ₹2Cr…',
  'Gated community in ECR…',
  'Studio apartment for investment…',
  'RERA-verified luxury homes…',
  '2BHK with parking in Bangalore…',
]
const BUDGET_PRESETS = [
  { label: 'Under ₹30L', max: 3000000 },
  { label: '₹30L–₹60L', min: 3000000, max: 6000000 },
  { label: '₹60L–₹1Cr', min: 6000000, max: 10000000 },
  { label: '₹1Cr–₹2Cr', min: 10000000, max: 20000000 },
  { label: 'Above ₹2Cr', min: 20000000 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

// Normalize field names from both the Netlify function format and direct DB format
function norm(property: Property) {
  const p = property as any
  return {
    id: p.id,
    title: p.title || '',
    city: p.city || '',
    locality: p.locality || '',
    // Netlify fn: bhk, DB: bedrooms
    bedrooms: p.bedrooms ?? p.bhk ?? null,
    // Netlify fn: carpetAreaSqft, DB: sqft
    sqft: p.sqft ?? p.carpetAreaSqft ?? null,
    // Netlify fn: priceINR, DB: price_inr
    priceINR: p.priceINR ?? p.price_inr ?? null,
    // Netlify fn: listingStatus = 'Verified', DB: is_verified
    isVerified: p.isVerified ?? p.is_verified ?? (p.listingStatus === 'Verified'),
    // Netlify fn: type, DB: property_type
    type: p.type || p.property_type || '',
    // Image: may be array or single
    image: p.image || (Array.isArray(p.images) ? p.images[0] : null) || null,
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
  }
}

function aiScore(property: Property): number {
  const p = norm(property)
  let s = 60
  if (p.isVerified) s += 15
  if (p.images.length > 2 || p.image) s += 10
  if (p.bedrooms) s += 5
  if (p.sqft && Number(p.sqft) > 800) s += 5
  if (p.priceINR && p.priceINR > 0 && p.priceINR < 8000000) s += 5
  return Math.min(s, 99)
}

const defaultFilters: Filters = {
  q: '', city: '', property_type: [], bhk_type: [],
  min_price: '', max_price: '', rera_verified: false, sort: 'relevance',
}

// ─── Neural Background ────────────────────────────────────────────────────────
function NeuralBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
      {/* Subtle grid */}
      <div className="absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(rgba(251,191,36,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,0.03) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      {/* Radial glow top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.07) 0%,transparent 70%)' }} />
      {/* Ambient orbs */}
      {[
        { x: '15%', y: '20%', size: 320, delay: 0 },
        { x: '80%', y: '15%', size: 280, delay: 1.5 },
        { x: '60%', y: '70%', size: 350, delay: 3 },
        { x: '10%', y: '75%', size: 260, delay: 2 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.x, top: orb.y,
            width: orb.size, height: orb.size,
            background: i % 2 === 0
              ? 'radial-gradient(circle,rgba(251,191,36,0.06) 0%,transparent 70%)'
              : 'radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)',
            transform: 'translate(-50%,-50%)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
        />
      ))}
    </div>
  )
}

// ─── AI Score Ring ────────────────────────────────────────────────────────────
function AIScoreRing({ score }: { score: number }) {
  const r = 14, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="2.5" />
        <motion.circle
          cx="20" cy="20" r={r} fill="none"
          stroke="rgb(251,191,36)" strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <span className="absolute text-[9px] font-black text-amber-400">{score}</span>
    </div>
  )
}

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 400, damping: 40 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 400, damping: 40 })
  const [glowPos, setGlowPos] = useState({ x: '50%', y: '50%' })

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    x.set(nx - 0.5)
    y.set(ny - 0.5)
    setGlowPos({ x: `${Math.round(nx * 100)}%`, y: `${Math.round(ny * 100)}%` })
  }, [x, y])

  const handleLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={cn('relative', className)}
    >
      {/* Dynamic glow follow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(200px circle at ${glowPos.x} ${glowPos.y}, rgba(251,191,36,0.08), transparent 70%)`,
        }}
      />
      {children}
    </motion.div>
  )
}

// ─── Property Card (Grid) ─────────────────────────────────────────────────────
function PropertyCardGrid({ property, index }: { property: Property; index: number }) {
  const [liked, setLiked] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const score = useMemo(() => aiScore(property), [property])
  const n = norm(property)
  const img = n.image
  const priceINR = n.priceINR
  const verified = n.isVerified
  const bedrooms = n.bedrooms
  const sqft = n.sqft
  const locality = n.locality
  const propType = n.type

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <TiltCard className="group">
        <div className="relative rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm hover:border-amber-500/30 transition-colors duration-300 shadow-xl shadow-black/20">
          {/* Image */}
          <div className="relative h-52 overflow-hidden bg-zinc-800">
            {img ? (
              <img
                src={img}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-zinc-700" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />

            {/* Badges row */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                {verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full text-[10px] font-semibold text-emerald-400">
                    <Shield className="w-2.5 h-2.5" /> RERA
                  </span>
                )}
                {propType && (
                  <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-zinc-700/50 rounded-full text-[10px] text-zinc-300 capitalize">
                    {propType}
                  </span>
                )}
              </div>
              <button
                onClick={() => setLiked(l => !l)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-zinc-700/50 transition-colors hover:border-rose-500/40"
              >
                <Heart className={cn('w-3.5 h-3.5 transition-colors', liked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400')} />
              </button>
            </div>

            {/* Bottom info row */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {bedrooms && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-full text-[10px] text-zinc-200">
                    <Bed className="w-2.5 h-2.5" /> {bedrooms} BHK
                  </span>
                )}
                {sqft && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-full text-[10px] text-zinc-200">
                    <Maximize className="w-2.5 h-2.5" /> {Number(sqft).toLocaleString()} sqft
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-100 leading-tight truncate group-hover:text-amber-300 transition-colors">
                  {property.title}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                  <span className="text-xs text-zinc-500 truncate">
                    {locality ? `${locality}, ` : ''}{property.city}
                  </span>
                </div>
              </div>
              <AIScoreRing score={score} />
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/60">
              <div>
                <p className="text-[10px] text-zinc-500 mb-0.5">Price</p>
                <p className="text-base font-bold text-amber-400">
                  {priceINR ? formatINR(priceINR) : 'Contact'}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-lg text-[11px] font-semibold text-amber-400 transition-all"
              >
                <Phone className="w-3 h-3" /> Contact
              </motion.button>
            </div>
          </div>

          {/* Bottom amber accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </TiltCard>
    </motion.div>
  )
}

// ─── Property Card (List) ─────────────────────────────────────────────────────
function PropertyCardList({ property, index }: { property: Property; index: number }) {
  const [liked, setLiked] = useState(false)
  const score = useMemo(() => aiScore(property), [property])
  const n = norm(property)
  const img = n.image
  const priceINR = n.priceINR
  const verified = n.isVerified
  const bedrooms = n.bedrooms
  const sqft = n.sqft
  const locality = n.locality
  const propType = n.type

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      className="group flex gap-4 p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm hover:border-amber-500/25 hover:bg-zinc-900/70 transition-all duration-300"
    >
      {/* Image */}
      <div className="w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800 relative">
        {img ? (
          <img src={img} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-zinc-700" />
          </div>
        )}
        {verified && (
          <div className="absolute top-1.5 left-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400 drop-shadow" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-amber-300 transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-zinc-500 flex-shrink-0" />
              <span className="text-xs text-zinc-500 truncate">
                {locality ? `${locality}, ` : ''}{property.city}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <AIScoreRing score={score} />
            <button onClick={() => setLiked(l => !l)}>
              <Heart className={cn('w-4 h-4 transition-colors', liked ? 'fill-rose-500 text-rose-500' : 'text-zinc-600 hover:text-zinc-400')} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          {bedrooms && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Bed className="w-3 h-3" /> {bedrooms} BHK
            </span>
          )}
          {sqft && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Maximize className="w-3 h-3" /> {Number(sqft).toLocaleString()} sqft
            </span>
          )}
          {propType && (
            <span className="text-[11px] text-zinc-500 capitalize">{propType}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-amber-400">
            {priceINR ? formatINR(priceINR) : 'Contact'}
          </span>
          <button className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            View details <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ mode = 'grid' }: { mode?: 'grid' | 'list' }) {
  if (mode === 'list') {
    return (
      <div className="flex gap-4 p-4 rounded-2xl border border-zinc-800/40 bg-zinc-900/30 animate-pulse">
        <div className="w-32 h-24 rounded-xl bg-zinc-800/60 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-800/60 rounded w-3/4" />
          <div className="h-3 bg-zinc-800/40 rounded w-1/2" />
          <div className="h-3 bg-zinc-800/40 rounded w-1/4 mt-3" />
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-zinc-800/40 bg-zinc-900/30 overflow-hidden animate-pulse">
      <div className="h-52 bg-zinc-800/60" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800/60 rounded w-3/4" />
        <div className="h-3 bg-zinc-800/40 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-zinc-800/60 rounded w-1/4" />
          <div className="h-7 bg-zinc-800/40 rounded w-1/5" />
        </div>
      </div>
    </div>
  )
}

// ─── Filters Drawer ───────────────────────────────────────────────────────────
function FiltersDrawer({
  open, onClose, filters, setFilters, onApply, onClear,
}: {
  open: boolean; onClose: () => void
  filters: Filters; setFilters: (f: Filters) => void
  onApply: () => void; onClear: () => void
}) {
  const toggle = <T,>(arr: T[], val: T) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-zinc-950 border-l border-zinc-800/60 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-zinc-100">Filters</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClear} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Clear all</button>
                <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-7">
              {/* City */}
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">City</label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map(c => (
                    <button key={c}
                      onClick={() => setFilters({ ...filters, city: filters.city === c ? '' : c })}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        filters.city === c
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      )}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button key={pt}
                      onClick={() => setFilters({ ...filters, property_type: toggle(filters.property_type, pt.toLowerCase()) })}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        filters.property_type.includes(pt.toLowerCase())
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      )}>
                      {filters.property_type.includes(pt.toLowerCase()) && <Check className="inline w-3 h-3 mr-1" />}
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* BHK */}
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Configuration</label>
                <div className="flex flex-wrap gap-2">
                  {BHK_OPTIONS.map(b => (
                    <button key={b}
                      onClick={() => setFilters({ ...filters, bhk_type: toggle(filters.bhk_type, b) })}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        filters.bhk_type.includes(b)
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      )}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Budget</label>
                <div className="space-y-2 mb-3">
                  {BUDGET_PRESETS.map(bp => {
                    const active = filters.min_price === String(bp.min || '') && filters.max_price === String(bp.max || '')
                    return (
                      <button key={bp.label}
                        onClick={() => setFilters({ ...filters, min_price: String(bp.min || ''), max_price: String(bp.max || '') })}
                        className={cn('w-full text-left px-3 py-2 rounded-lg text-xs border transition-all',
                          active
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        )}>
                        {bp.label}
                      </button>
                    )
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={filters.min_price}
                    onChange={e => setFilters({ ...filters, min_price: e.target.value })}
                    className="px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                  />
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={filters.max_price}
                    onChange={e => setFilters({ ...filters, max_price: e.target.value })}
                    className="px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>

              {/* RERA */}
              <div>
                <button
                  onClick={() => setFilters({ ...filters, rera_verified: !filters.rera_verified })}
                  className={cn('flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all',
                    filters.rera_verified
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  )}>
                  <div className={cn('w-5 h-5 rounded flex items-center justify-center border transition-all',
                    filters.rera_verified ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700')}>
                    {filters.rera_verified && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">RERA Verified Only</p>
                    <p className="text-xs text-zinc-500">Show only government verified listings</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 p-5 bg-zinc-950/95 backdrop-blur border-t border-zinc-800/50">
              <button
                onClick={() => { onApply(); onClose() }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Animated Count ───────────────────────────────────────────────────────────
function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    let start = 0
    const inc = value / 20
    const t = setInterval(() => {
      start = Math.min(start + inc, value)
      setDisplay(Math.round(start))
      if (start >= value) clearInterval(t)
    }, 40)
    return () => clearInterval(t)
  }, [value])
  return <>{display}</>
}

// ─── City Quick Filter ────────────────────────────────────────────────────────
function CityQuickFilter({ active, onSelect }: { active: string; onSelect: (c: string) => void }) {
  const cities = ['All', ...CITIES]
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
      {cities.map(c => (
        <motion.button
          key={c}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(c === 'All' ? '' : c)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
            (c === 'All' && !active) || active === c
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10'
              : 'bg-zinc-900/60 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
          )}
        >
          {c === 'All' ? '🌐 All Cities' : `📍 ${c}`}
        </motion.button>
      ))}
    </div>
  )
}

// ─── Active Chip ──────────────────────────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={onRemove}
      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-colors"
    >
      {label}
      <X className="w-3 h-3" />
    </motion.button>
  )
}

// ─── Empty & Error States ─────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-20 h-20 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center mb-6"
      >
        <Building2 className="w-9 h-9 text-zinc-700" />
      </motion.div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">
        {hasFilters ? 'No matching properties' : 'No properties yet'}
      </h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        {hasFilters ? 'Try adjusting your filters to see more results' : 'Properties will appear here once listed'}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm font-semibold text-amber-400 hover:bg-amber-500/15 transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <Zap className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-zinc-300 mb-2">Failed to load</h3>
      <p className="text-sm text-zinc-500 mb-5 max-w-xs">{message}</p>
      <button onClick={onRetry} className="px-5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:border-zinc-700 transition-colors">
        Try again
      </button>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 9

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 disabled:opacity-30 hover:border-zinc-700 hover:text-zinc-200 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <motion.button
          key={p}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(p)}
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-xl border text-xs font-semibold transition-all',
            p === page
              ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          )}
        >
          {p}
        </motion.button>
      ))}
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 disabled:opacity-30 hover:border-zinc-700 hover:text-zinc-200 transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function PropertyListingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    sort: searchParams.get('sort') || 'relevance',
  })
  const [searchInput, setSearchInput] = useState(filters.q)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // AI prompt cycling
  const [promptIdx, setPromptIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPromptIdx(i => (i + 1) % AI_PROMPTS.length), 3500)
    return () => clearInterval(t)
  }, [])

  // Fetch all properties once
  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/properties-list', { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      const items: Property[] = (json.properties || json.items || json.data || json || [])
      setAllProperties(Array.isArray(items) ? items : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let list = [...allProperties]
    if (filters.q) {
      const q = filters.q.toLowerCase()
      list = list.filter(p => {
        const n = norm(p)
        return n.title.toLowerCase().includes(q) ||
          n.city.toLowerCase().includes(q) ||
          n.locality.toLowerCase().includes(q)
      })
    }
    if (filters.city) {
      list = list.filter(p => norm(p).city.toLowerCase() === filters.city.toLowerCase())
    }
    if (filters.property_type.length) {
      list = list.filter(p => {
        const t = norm(p).type.toLowerCase()
        return filters.property_type.some(pt => t.includes(pt))
      })
    }
    if (filters.bhk_type.length) {
      list = list.filter(p => filters.bhk_type.some(b => {
        const beds = norm(p).bedrooms
        if (!beds) return false
        if (b.includes('+')) return beds >= parseInt(b)
        if (b.includes('RK')) return beds <= 1
        return beds === parseInt(b)
      }))
    }
    if (filters.min_price) {
      const mn = Number(filters.min_price)
      list = list.filter(p => { const pr = norm(p).priceINR; return pr != null && pr >= mn })
    }
    if (filters.max_price) {
      const mx = Number(filters.max_price)
      list = list.filter(p => { const pr = norm(p).priceINR; return pr != null && pr <= mx })
    }
    if (filters.rera_verified) {
      list = list.filter(p => norm(p).isVerified)
    }
    // Sort
    if (filters.sort === 'price_low') {
      list.sort((a, b) => (norm(a).priceINR ?? 0) - (norm(b).priceINR ?? 0))
    } else if (filters.sort === 'price_high') {
      list.sort((a, b) => (norm(b).priceINR ?? 0) - (norm(a).priceINR ?? 0))
    } else if (filters.sort === 'newest') {
      list.sort((a, b) => {
        const da = new Date(((a as any).listed_at || (a as any).postedAt || 0) as string).getTime()
        const db = new Date(((b as any).listed_at || (b as any).postedAt || 0) as string).getTime()
        return db - da
      })
    } else {
      // AI relevance: verified first, then by price mid-range, then has images
      list.sort((a, b) => aiScore(b) - aiScore(a))
    }
    return list
  }, [allProperties, filters])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.q) n++
    if (filters.city) n++
    if (filters.property_type.length) n++
    if (filters.bhk_type.length) n += filters.bhk_type.length
    if (filters.min_price || filters.max_price) n++
    if (filters.rera_verified) n++
    return n
  }, [filters])

  const handleSearch = useCallback(() => {
    setFilters(f => ({ ...f, q: searchInput }))
    setPage(1)
  }, [searchInput])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setSearchInput('')
    setPage(1)
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen text-zinc-100">
      <NeuralBackground />

      {/* ── Hero ── */}
      <div className="relative pt-16 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
            </motion.div>
            <span className="text-xs font-semibold text-amber-400">AI-Powered Property Intelligence</span>
            <Sparkles className="w-3 h-3 text-amber-400/60" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
          >
            <span className="text-zinc-100">Find Your </span>
            <span className="relative">
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Perfect Home
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base text-zinc-500 mb-8 max-w-lg mx-auto"
          >
            <AnimatedCount value={allProperties.length} /> verified properties across India,
            matched to you by AI in real-time
          </motion.p>

          {/* AI Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative flex items-center gap-3 p-2 pl-5 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 focus-within:border-amber-500/40 transition-colors shadow-2xl shadow-black/40">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Brain className="w-5 h-5 text-amber-400 flex-shrink-0" />
              </motion.div>
              <div className="flex-1 relative overflow-hidden">
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-transparent focus:outline-none"
                  placeholder={AI_PROMPTS[promptIdx]}
                />
                {!searchInput && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={promptIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 flex items-center text-sm text-zinc-600 pointer-events-none select-none"
                    >
                      {AI_PROMPTS[promptIdx]}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setFilters(f => ({ ...f, q: '' })) }} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-amber-500/20"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:block">Search</span>
              </motion.button>
            </div>
            {/* Subtle glow under search bar */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-amber-500/5 blur-2xl rounded-full pointer-events-none" />
          </motion.div>

          {/* Quick stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-8"
          >
            {[
              { icon: TrendingUp, label: 'Live Listings', val: allProperties.length },
              { icon: Shield, label: 'RERA Verified', val: allProperties.filter(p => norm(p).isVerified).length },
              { icon: Star, label: 'Cities', val: new Set(allProperties.map(p => norm(p).city).filter(Boolean)).size },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-zinc-500">
                <Icon className="w-3.5 h-3.5 text-amber-400/60" />
                <span className="font-semibold text-zinc-300">{val}</span>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Sticky Filter Bar ── */}
      <div className="sticky top-0 z-30 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* City quick filter */}
            <div className="flex-1 min-w-0">
              <CityQuickFilter
                active={filters.city}
                onSelect={c => { setFilters(f => ({ ...f, city: c })); setPage(1) }}
              />
            </div>

            {/* Sort + View + Filters */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={filters.sort}
                onChange={e => { setFilters(f => ({ ...f, sort: e.target.value })); setPage(1) }}
                className="px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-400 focus:outline-none focus:border-amber-500/30 cursor-pointer hidden sm:block"
              >
                {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>

              <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5">
                <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(true)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                  activeFilterCount > 0
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-sm shadow-amber-500/10'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <motion.span
                    key={activeFilterCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-500 text-zinc-950 text-[9px] font-black"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-2 pt-2 overflow-x-auto scrollbar-none"
              >
                {filters.q && <ActiveChip label={`"${filters.q}"`} onRemove={() => { setFilters(f => ({ ...f, q: '' })); setSearchInput('') }} />}
                {filters.city && <ActiveChip label={filters.city} onRemove={() => setFilters(f => ({ ...f, city: '' }))} />}
                {filters.bhk_type.map(b => <ActiveChip key={b} label={b} onRemove={() => setFilters(f => ({ ...f, bhk_type: f.bhk_type.filter(v => v !== b) }))} />)}
                {filters.property_type.map(pt => <ActiveChip key={pt} label={pt} onRemove={() => setFilters(f => ({ ...f, property_type: f.property_type.filter(v => v !== pt) }))} />)}
                {(filters.min_price || filters.max_price) && <ActiveChip label="Budget range" onRemove={() => setFilters(f => ({ ...f, min_price: '', max_price: '' }))} />}
                {filters.rera_verified && <ActiveChip label="RERA Verified" onRemove={() => setFilters(f => ({ ...f, rera_verified: false }))} />}
                <button onClick={clearFilters} className="flex-shrink-0 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors px-2">Clear all</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Result count */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">
                <span className="font-semibold text-zinc-300">{filtered.length}</span> properties
                {activeFilterCount > 0 ? ' match your filters' : ' available'}
              </span>
            </div>
            {filtered.length > 0 && (
              <span className="text-xs text-zinc-600">
                Page {page} of {Math.ceil(filtered.length / PAGE_SIZE)}
              </span>
            )}
          </motion.div>
        )}

        {/* Content area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'}
            >
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} mode={viewMode} />)}
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorState message={error} onRetry={fetchProperties} />
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState hasFilters={activeFilterCount > 0} onClear={clearFilters} />
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key={`grid-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {paginated.map((p, i) => <PropertyCardGrid key={p.id} property={p} index={i} />)}
            </motion.div>
          ) : (
            <motion.div
              key={`list-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {paginated.map((p, i) => <PropertyCardList key={p.id} property={p} index={i} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && filtered.length > 0 && (
          <Pagination page={page} total={filtered.length} onChange={handlePageChange} />
        )}

        {/* Bottom CTA strip */}
        {!loading && !error && allProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 p-8 rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/60 to-zinc-950/60 backdrop-blur-sm text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">List Your Property on Tharaga</span>
            </div>
            <p className="text-sm text-zinc-500 mb-5 max-w-md mx-auto">
              Reach verified buyers across India with AI-powered matching and real-time analytics.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="/builders/signup"
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-4 h-4" /> Start Free
              </a>
              <a
                href="/"
                className="px-5 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-sm rounded-xl transition-colors"
              >
                Learn more
              </a>
            </div>
          </motion.div>
        )}
        <div className="h-16" />
      </div>

      {/* Filters Drawer */}
      <FiltersDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => setPage(1)}
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
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Cpu className="w-8 h-8 text-amber-400" />
        </motion.div>
      </div>
    }>
      <PropertyListingContent />
    </Suspense>
  )
}
