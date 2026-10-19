'use client'

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Property } from '@/types/property'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Search, MapPin, Bed, Maximize2, Heart, SlidersHorizontal,
  LayoutGrid, List, X, Shield, Building2, ChevronLeft,
  ChevronRight, Check, Phone, ArrowRight, Star,
  TrendingUp, Eye, ChevronDown, Filter, Home,
  LogIn, LogOut, LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { openAuthModal } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'

// ─── Types & Constants ────────────────────────────────────────────────────────
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

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Penthouse', 'Studio', 'Duplex', 'Commercial']
const BHK_OPTIONS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+']
const SORT_OPTIONS = [
  { id: 'relevance', label: 'Best Match' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest First' },
]
const BUDGET_PRESETS = [
  { label: 'Under ₹30L', max: 3000000 },
  { label: '₹30L–₹60L', min: 3000000, max: 6000000 },
  { label: '₹60L–₹1Cr', min: 6000000, max: 10000000 },
  { label: '₹1Cr–₹2Cr', min: 10000000, max: 20000000 },
  { label: 'Above ₹2Cr', min: 20000000 },
]

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

function norm(property: Property) {
  const p = property as any
  return {
    id: p.id,
    title: p.title || '',
    city: p.city || '',
    locality: p.locality || '',
    bedrooms: p.bedrooms ?? p.bhk ?? null,
    sqft: p.sqft ?? p.carpetAreaSqft ?? null,
    priceINR: p.priceINR ?? p.price_inr ?? null,
    isVerified: p.isVerified ?? p.is_verified ?? (p.listingStatus === 'Verified'),
    type: p.type || p.property_type || '',
    image: p.image || (Array.isArray(p.images) ? p.images[0] : null) || null,
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
  }
}

const defaultFilters: Filters = {
  q: '', city: '', property_type: [], bhk_type: [],
  min_price: '', max_price: '', rera_verified: false, sort: 'relevance',
}

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ property, index, view }: { property: Property; index: number; view: 'grid' | 'list' }) {
  const [liked, setLiked] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const n = norm(property)

  if (view === 'list') {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
        className="bg-white rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all overflow-hidden flex gap-0"
      >
        {/* Image */}
        <div className="relative w-64 shrink-0 bg-gray-100">
          {n.image ? (
            <img src={n.image} alt={n.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full min-h-[180px] flex items-center justify-center">
              <Building2 className="w-10 h-10 text-gray-300" />
            </div>
          )}
          <button
            onClick={e => { e.preventDefault(); setLiked(l => !l) }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart className={cn('w-4 h-4 transition-colors', liked ? 'fill-rose-500 text-rose-500' : 'text-gray-400')} />
          </button>
          {n.isVerified && (
            <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-lg">
              <Shield className="w-3 h-3" /> RERA
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between">
            <div>
              {n.type && (
                <span className="inline-block text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 mb-2 capitalize">
                  {n.type}
                </span>
              )}
              <h3 className="font-bold text-[#0B1C34] text-lg mb-1 hover:text-amber-700 transition-colors">
                <Link href={`/properties/${n.id}`}>{n.title}</Link>
              </h3>
              {n.locality && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  {n.locality}{n.city ? `, ${n.city}` : ''}
                </p>
              )}
            </div>
            {n.priceINR && (
              <div className="text-right">
                <div className="text-xl font-bold text-[#0B1C34]">{formatINR(n.priceINR)}</div>
                {n.sqft && n.priceINR && (
                  <div className="text-xs text-gray-400">₹{Math.round(n.priceINR / Number(n.sqft)).toLocaleString()} / sqft</div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-50">
            {n.bedrooms && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <Bed className="w-4 h-4 text-amber-500" /> {n.bedrooms} BHK
              </span>
            )}
            {n.sqft && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <Maximize2 className="w-4 h-4 text-amber-500" /> {Number(n.sqft).toLocaleString()} sqft
              </span>
            )}
            <Link
              href={`/properties/${n.id}`}
              className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              View Details <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.4) }}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {n.image ? (
          <img
            src={n.image}
            alt={n.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex gap-2">
            {n.isVerified && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-lg">
                <Shield className="w-3 h-3" /> RERA
              </span>
            )}
          </div>
          <button
            onClick={e => { e.preventDefault(); setLiked(l => !l) }}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart className={cn('w-4 h-4 transition-colors', liked ? 'fill-rose-500 text-rose-500' : 'text-gray-400')} />
          </button>
        </div>
        {n.type && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium rounded-lg capitalize">
              {n.type}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-[#0B1C34] mb-1.5 group-hover:text-amber-700 transition-colors leading-tight">
          <Link href={`/properties/${n.id}`}>{n.title}</Link>
        </h3>
        {n.locality && (
          <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {n.locality}{n.city ? `, ${n.city}` : ''}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          {n.bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-amber-500" /> {n.bedrooms} BHK
            </span>
          )}
          {n.sqft && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-amber-500" /> {Number(n.sqft).toLocaleString()} sqft
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          {n.priceINR ? (
            <div>
              <div className="text-lg font-bold text-[#0B1C34]">{formatINR(n.priceINR)}</div>
              {n.sqft && (
                <div className="text-xs text-gray-400">₹{Math.round(n.priceINR / Number(n.sqft)).toLocaleString()}/sqft</div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">Price on request</span>
          )}
          <Link
            href={`/properties/${n.id}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white text-xs font-bold rounded-xl transition-all border border-amber-100 hover:border-amber-500"
          >
            View <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCTA }: { onCTA: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6">
        <Building2 className="w-9 h-9 text-amber-400" />
      </div>
      <h3 className="text-xl font-bold text-[#0B1C34] mb-2">New Properties Coming Soon</h3>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
        We're verifying and onboarding fresh properties daily. Leave your requirement and we'll notify you the moment a match is available.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onCTA}
          className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
        >
          <Phone className="w-4 h-4" />
          Leave My Requirement
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-7 py-3.5 border-2 border-gray-200 hover:border-amber-200 text-gray-700 hover:text-amber-700 font-semibold rounded-xl transition-all"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
        <div className="flex gap-4">
          <div className="h-4 bg-gray-100 rounded-lg w-16" />
          <div className="h-4 bg-gray-100 rounded-lg w-20" />
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-gray-100 rounded-lg w-24" />
          <div className="h-8 bg-amber-50 rounded-xl w-20" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Listing Page ────────────────────────────────────────────────────────
function ListingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    rera_verified: searchParams.get('rera_verified') === 'true',
    sort: searchParams.get('sort') || 'relevance',
    property_type: searchParams.getAll('type').filter(Boolean),
  }))

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.q)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [initials, setInitials] = useState('U')

  const PER_PAGE = 12

  // Auth
  useEffect(() => {
    let mounted = true
    try {
      const raw = localStorage.getItem('sb-wedevtjjmdvngyshqdro-auth-token')
      if (raw) {
        const parsed = JSON.parse(raw)
        const notExpired = !parsed?.expires_at || parsed.expires_at * 1000 > Date.now()
        if (notExpired && parsed?.user) {
          const u = parsed.user
          const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User'
          if (mounted) { setUser(u); setDisplayName(name); setInitials(name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U') }
        }
      }
    } catch {}
    return () => { mounted = false }
  }, [])

  // Fetch
  const fetchProperties = useCallback(async (f: Filters, pg: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.q) params.set('q', f.q)
      if (f.city) params.set('city', f.city)
      f.property_type.forEach(t => params.append('type', t))
      f.bhk_type.forEach(b => params.append('bhk', b))
      if (f.min_price) params.set('min_price', f.min_price)
      if (f.max_price) params.set('max_price', f.max_price)
      if (f.rera_verified) params.set('rera_verified', 'true')
      params.set('sort', f.sort)
      params.set('page', String(pg))
      params.set('limit', String(PER_PAGE))

      const res = await fetch(`/api/properties?${params}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setProperties(data.properties || data.data || [])
      setTotal(data.total || data.count || 0)
    } catch {
      setProperties([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProperties(filters, page) }, [filters, page, fetchProperties])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(f => ({ ...f, q: searchInput }))
    setPage(1)
  }

  const toggleType = (t: string) => {
    setFilters(f => ({
      ...f,
      property_type: f.property_type.includes(t) ? f.property_type.filter(x => x !== t) : [...f.property_type, t],
    }))
    setPage(1)
  }

  const toggleBhk = (b: string) => {
    setFilters(f => ({
      ...f,
      bhk_type: f.bhk_type.includes(b) ? f.bhk_type.filter(x => x !== b) : [...f.bhk_type, b],
    }))
    setPage(1)
  }

  const applyBudget = (preset: typeof BUDGET_PRESETS[0]) => {
    setFilters(f => ({ ...f, min_price: preset.min ? String(preset.min) : '', max_price: preset.max ? String(preset.max) : '' }))
    setPage(1)
  }

  const resetFilters = () => { setFilters(defaultFilters); setSearchInput(''); setPage(1) }

  const totalPages = Math.ceil(total / PER_PAGE)
  const activeFilterCount = [
    filters.q, filters.property_type.length > 0 ? 'x' : '',
    filters.bhk_type.length > 0 ? 'x' : '',
    filters.min_price, filters.max_price,
    filters.rera_verified ? 'x' : '',
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-[#0B1C34] text-lg leading-none hidden sm:block">Tharaga</span>
          </Link>

          {/* Search bar in nav */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="flex w-full gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus-within:border-amber-300 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search locality, project, builder…"
                className="flex-1 bg-transparent text-sm text-[#0B1C34] placeholder-gray-400 outline-none"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setFilters(f => ({ ...f, q: '' })) }}>
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-2 text-sm text-gray-600 hover:text-[#0B1C34] hover:bg-gray-50 rounded-lg transition-colors">Home</Link>
              <Link href="/tools" className="px-3 py-2 text-sm text-gray-600 hover:text-[#0B1C34] hover:bg-gray-50 rounded-lg transition-colors">Tools</Link>
            </div>
            {user ? (
              <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <Link href="/builder" className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Breadcrumb + Title ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Properties</span>
              {filters.q && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-gray-600">"{filters.q}"</span>
                </>
              )}
            </nav>
            <h1 className="text-2xl font-bold text-[#0B1C34]">
              {filters.q ? `Properties for "${filters.q}"` : 'Properties in Chennai'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Searching…' : `${total.toLocaleString()} verified ${total === 1 ? 'property' : 'properties'} found`}
            </p>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="md:hidden flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent text-sm outline-none text-[#0B1C34] placeholder-gray-400"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl">Go</button>
          </form>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Property type */}
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all',
                    filters.property_type.includes(t)
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

            {/* BHK */}
            <div className="flex flex-wrap gap-1.5">
              {BHK_OPTIONS.map(b => (
                <button
                  key={b}
                  onClick={() => toggleBhk(b)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-full border transition-all',
                    filters.bhk_type.includes(b)
                      ? 'bg-[#0B1C34] text-white border-[#0B1C34]'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-slate-400 hover:text-slate-700',
                  )}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

            {/* Budget presets */}
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_PRESETS.map((p, i) => {
                const active = filters.min_price === (p.min ? String(p.min) : '') && filters.max_price === (p.max ? String(p.max) : '')
                return (
                  <button
                    key={i}
                    onClick={() => applyBudget(p)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-full border transition-all',
                      active
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700',
                    )}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* RERA toggle */}
              <button
                onClick={() => { setFilters(f => ({ ...f, rera_verified: !f.rera_verified })); setPage(1) }}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all',
                  filters.rera_verified
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300',
                )}
              >
                <Shield className="w-3 h-3" /> RERA Only
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full hover:bg-red-100 transition-colors"
                >
                  <X className="w-3 h-3" /> Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Results header ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500 font-medium">
            {loading ? 'Loading…' : `${total} propert${total === 1 ? 'y' : 'ies'}`}
          </p>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-amber-300 transition-colors"
              >
                {SORT_OPTIONS.find(s => s.id === filters.sort)?.label}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-30"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setFilters(f => ({ ...f, sort: opt.id })); setSortOpen(false); setPage(1) }}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-50',
                          filters.sort === opt.id ? 'text-amber-600 font-semibold' : 'text-gray-700',
                        )}
                      >
                        {opt.label}
                        {filters.sort === opt.id && <Check className="w-4 h-4 text-amber-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl">
              <button
                onClick={() => setView('grid')}
                className={cn('p-1.5 rounded-lg transition-colors', view === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-600')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn('p-1.5 rounded-lg transition-colors', view === 'list' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-600')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Results grid / list ─────────────────────────────── */}
        {loading ? (
          <div className={cn(
            'grid gap-5',
            view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
          )}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState onCTA={() => setShowLeadModal(true)} />
        ) : (
          <div className={cn(
            'grid gap-5',
            view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
          )}>
            {properties.map((p, i) => (
              <PropertyCard key={p.id || i} property={p} index={i} view={view} />
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-300 hover:text-amber-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const pg = i + 1
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={cn(
                      'w-9 h-9 text-sm font-semibold rounded-xl transition-all',
                      page === pg ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700',
                    )}
                  >
                    {pg}
                  </button>
                )
              })}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-300 hover:text-amber-700 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── CTA Banner ─────────────────────────────────────── */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-14 bg-gradient-to-r from-[#0B1C34] to-[#0D2B52] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Can't find what you're looking for?</h3>
              <p className="text-white/60 max-w-md text-sm">
                Share your exact requirements — location, budget, size — and we'll personally match you with verified properties from our builder network.
              </p>
            </div>
            <button
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/25 whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              Leave Your Requirement
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Lead Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowLeadModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
            >
              {/* Inline lead form — imported dynamically only on homepage; inline here for simplicity */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1C34] mb-2">Share Your Requirement</h3>
                <p className="text-sm text-gray-500">Our team will reach out with matching verified properties.</p>
              </div>
              <form
                onSubmit={async e => {
                  e.preventDefault()
                  const fd = new FormData(e.target as HTMLFormElement)
                  try {
                    await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'), requirement: fd.get('requirement'), source: 'property-listing' }) })
                    setShowLeadModal(false)
                  } catch {}
                }}
                className="space-y-4"
              >
                <input name="name" required placeholder="Your name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0B1C34] placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-all" />
                <input name="phone" required placeholder="Phone number" type="tel" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0B1C34] placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-all" />
                <input name="email" placeholder="Email (optional)" type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0B1C34] placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-all" />
                <textarea name="requirement" rows={3} placeholder="What are you looking for? (e.g. 3BHK in Anna Nagar under 1Cr)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0B1C34] placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-all resize-none" />
                <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25">
                  Submit Requirement
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PropertyListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    }>
      <ListingPageContent />
    </Suspense>
  )
}
