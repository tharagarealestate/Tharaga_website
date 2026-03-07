import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  MapPin, Bed, Maximize, Car, Building2, Compass, Calendar,
  Star, ShieldCheck, ArrowLeft, CheckCircle2, Zap, ExternalLink,
} from 'lucide-react'
import ClientGallery from '@/components/property/ClientGallery'
import ClientEMICalculator from '@/components/property/ClientEMICalculator'
import ClientExpandableText from '@/components/property/ClientExpandableText'
import ClientCompareChart from '@/components/property/ClientCompareChart'
import ClientMatchScore from '@/components/property/ClientMatchScore'
import { ContactForm as ContactFormClient } from '@/components/property/ContactForm'
import RERAVerification from '@/components/property/RERAVerification'
import RiskFlags from '@/components/property/RiskFlags'
import ChennaiInsights from '@/components/property/ChennaiInsights'
import AppreciationPrediction from '@/components/property/AppreciationPrediction'
import ClientMarketAnalysis from '@/components/property/ClientMarketAnalysis'
import PropertyDocuments from '@/components/property/PropertyDocuments'
import LocationInsights from '@/components/property/LocationInsights'
import PriceComparison from '@/components/property/PriceComparison'
import ShareProperty from '@/components/property/ShareProperty'
import PropertySectionNav from '@/components/property/PropertySectionNav'
import MobileContactBar from '@/components/property/MobileContactBar'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const revalidate = 300

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchProperty(id: string) {
  try {
    const supabase = getSupabase()
    const { data: propData, error: propErr } = await supabase
      .from('properties').select('*').eq('id', id).limit(1).maybeSingle()
    if (!propErr && propData) {
      const property = mapProperty(propData)
      const [builder, similar, reviews] = await Promise.all([
        fetchBuilder(supabase, property),
        fetchSimilar(supabase, property),
        fetchReviews(supabase, property.id),
      ])
      return { property, builder, similar, reviews }
    }
  } catch {}

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/properties-list`, { cache: 'no-store' as any })
    const items = await res.json()
    const p = Array.isArray(items) ? items.find((x: any) => String(x.id) === String(id)) : null
    if (!p) return null
    const property = {
      id: p.id, title: p.title, description: p.summary || '',
      project: p.project || '', builderName: p.builder || '',
      bedrooms: p.bhk ?? null, bathrooms: p.bathrooms ?? null,
      parking: null, floor: null, totalFloors: null,
      facing: p.facing || '', furnished: p.furnished || '', propertyType: p.type || '',
      priceINR: p.priceINR ?? null, priceDisplay: p.priceDisplay || '',
      sqft: p.carpetAreaSqft ?? null, pricePerSqftINR: p.pricePerSqftINR ?? null,
      city: p.city || '', locality: p.locality || '', address: '',
      lat: null, lng: null, reraId: p.rera || '',
      tourUrl: p.tourUrl || '', brochureUrl: '',
      images: Array.isArray(p.images) ? p.images : [],
      floorPlans: [], amenities: [],
      listedAt: p.postedAt || null, isVerified: p.listingStatus === 'Verified',
      listingStatus: p.listingStatus || '',
    }
    return { property, builder: null, similar: [], reviews: [] }
  } catch { return null }
}

function toNumber(n: any): number | null {
  const x = Number(n); return Number.isFinite(x) ? x : null
}
function pricePerSqftFn(price: number | null, sqft: number | null): number | null {
  if (!price || !sqft || sqft <= 0) return null
  return Math.round(price / sqft)
}
function safeParseArray(s: string): string[] {
  try { const j = JSON.parse(s); return Array.isArray(j) ? (j as string[]) : [] } catch { return [] }
}

function mapProperty(row: any) {
  const images: string[] = Array.isArray(row.images) ? row.images
    : typeof row.images === 'string' ? safeParseArray(row.images) : []
  const floorPlans: string[] = Array.isArray(row.floor_plan_images) ? row.floor_plan_images
    : typeof row.floor_plan_images === 'string' ? safeParseArray(row.floor_plan_images) : []
  const amenities: string[] = Array.isArray(row.amenities) ? row.amenities
    : typeof row.amenities === 'string' ? safeParseArray(row.amenities) : []
  const priceINR = toNumber(row.price_inr)
  const sqft = toNumber(row.sqft)
  return {
    id: row.id as string, title: (row.title as string) || '',
    description: (row.description as string) || '',
    project: (row.project as string) || '', builderName: (row.builder as string) || '',
    bedrooms: toNumber(row.bedrooms), bathrooms: toNumber(row.bathrooms),
    parking: toNumber(row.parking), floor: toNumber(row.floor),
    totalFloors: toNumber(row.total_floors), facing: (row.facing as string) || '',
    furnished: (row.furnished as string) || '', propertyType: (row.property_type as string) || '',
    priceINR, priceDisplay: priceINR ? `₹${Math.round(priceINR).toLocaleString('en-IN')}` : 'Price on request',
    sqft, pricePerSqftINR: pricePerSqftFn(priceINR, sqft),
    city: (row.city as string) || '', locality: (row.locality as string) || '',
    address: (row.address as string) || '',
    lat: typeof row.lat === 'number' ? (row.lat as number) : null,
    lng: typeof row.lng === 'number' ? (row.lng as number) : null,
    reraId: (row.rera_id as string) || '', tourUrl: (row.tour_url as string) || '',
    brochureUrl: (row.brochure_url as string) || '',
    images, floorPlans, amenities,
    listedAt: row.listed_at || null, isVerified: !!row.is_verified,
    listingStatus: row.listing_status || '',
  }
}

async function fetchBuilder(supabase: ReturnType<typeof getSupabase>, property: ReturnType<typeof mapProperty>) {
  try {
    const name = property.builderName?.trim()
    if (!name) return null
    const { data, error } = await supabase.from('builders')
      .select('id,name,logo_url,founded,total_projects,reputation_score,reviews_count')
      .ilike('name', name).limit(1).maybeSingle()
    if (error || !data) return null
    return {
      id: data.id as string, name: (data.name as string) || name,
      logoUrl: (data.logo_url as string) || '', founded: data.founded || null,
      totalProjects: toNumber(data.total_projects),
      reputationScore: typeof data.reputation_score === 'number' ? (data.reputation_score as number) : null,
      reviewsCount: toNumber(data.reviews_count),
    }
  } catch { return null }
}

async function fetchSimilar(supabase: ReturnType<typeof getSupabase>, property: ReturnType<typeof mapProperty>) {
  try {
    const min = property.priceINR ? Math.floor(property.priceINR * 0.85) : null
    const max = property.priceINR ? Math.ceil(property.priceINR * 1.15) : null
    let q = supabase.from('properties')
      .select('id,title,price_inr,sqft,bedrooms,images,locality,city')
      .neq('id', property.id).limit(12)
    if (property.city) q = q.eq('city', property.city)
    if (property.locality) q = q.eq('locality', property.locality)
    if (property.bedrooms != null) q = q.eq('bedrooms', property.bedrooms)
    if (min != null && max != null) q = q.gte('price_inr', min).lte('price_inr', max)
    const { data, error } = await q
    if (error || !data) return []
    return data.slice(0, 6).map((p: any) => {
      const imgs: string[] = Array.isArray(p.images) ? p.images
        : typeof p.images === 'string' ? safeParseArray(p.images) : []
      const price = toNumber(p.price_inr); const s = toNumber(p.sqft)
      return {
        id: p.id as string, title: (p.title as string) || '',
        city: (p.city as string) || '', locality: (p.locality as string) || '',
        bedrooms: toNumber(p.bedrooms), priceINR: price,
        priceDisplay: price ? `₹${Math.round(price).toLocaleString('en-IN')}` : 'Price on request',
        pricePerSqftINR: pricePerSqftFn(price, s), sqft: s, image: imgs[0] || '',
      }
    })
  } catch { return [] }
}

async function fetchReviews(supabase: ReturnType<typeof getSupabase>, propertyId: string) {
  try {
    const { data, error } = await supabase.from('reviews')
      .select('id,user_name,user_avatar,rating,category_location,category_value,category_quality,category_amenities,text,created_at,verified_buyer')
      .eq('property_id', propertyId).order('created_at', { ascending: false }).limit(20)
    if (error || !data) return []
    return data.map((r: any) => ({
      id: r.id, name: r.user_name || 'Buyer', avatar: r.user_avatar || '',
      rating: toNumber(r.rating) || 0,
      categories: {
        location: toNumber(r.category_location) || null, value: toNumber(r.category_value) || null,
        quality: toNumber(r.category_quality) || null, amenities: toNumber(r.category_amenities) || null,
      },
      text: r.text || '', date: r.created_at || null, verified: !!r.verified_buyer,
    }))
  } catch { return [] }
}

// ── Metadata ───────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await fetchProperty(params.id)
  if (!data?.property) return {}
  const p = data.property
  const bedrooms = p.bedrooms ? `${p.bedrooms} BHK` : 'Property'
  const location = p.locality ? `${p.locality}, ${p.city || ''}` : p.city || ''
  const title = `${p.title || 'Property'} - ${bedrooms} in ${location} | Tharaga`
  const description = p.description ? `${p.description.slice(0, 120)}...`
    : `${bedrooms} in ${location}${p.priceDisplay ? ` - ${p.priceDisplay}` : ''}.`
  const ogImageUrl = p.images?.[0] || 'https://tharaga.co.in/og-default.jpg'
  const propertyUrl = `https://tharaga.co.in/properties/${params.id}`
  const richDescription = `${bedrooms} in ${location}${p.priceDisplay ? ` - ${p.priceDisplay}` : ''}${p.sqft ? ` (${p.sqft} sqft)` : ''}.`
  return {
    title, description,
    openGraph: { title: p.title || title, description: richDescription, images: [{ url: ogImageUrl, width: 1200, height: 630, alt: p.title || 'Property' }], url: propertyUrl, type: 'website', siteName: 'Tharaga Real Estate', locale: 'en_IN' },
    twitter: { card: 'summary_large_image', title: p.title || title, description: richDescription, images: [ogImageUrl] },
    other: { 'script:ld+json': JSON.stringify({ '@context': 'https://schema.org', '@type': 'RealEstateListing', name: p.title, price: p.priceDisplay, priceCurrency: 'INR', address: { '@type': 'PostalAddress', addressLocality: p.locality || p.city || '', addressRegion: p.city || '', addressCountry: 'IN' }, numberOfRooms: p.bedrooms || 3, image: p.images || [] }) },
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatINR(n?: number | null) {
  if (!n) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}
function avg(nums: Array<number | null | undefined>) {
  const arr = nums.filter((x): x is number => typeof x === 'number')
  if (!arr.length) return null
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

// ── Design tokens ─────────────────────────────────────────────────────────────
/** Left amber accent bar + small uppercase label — Supabase signature pattern */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-7">
      <div className="h-4 w-[3px] rounded-full bg-amber-500/60 flex-shrink-0" />
      <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{children}</h2>
    </div>
  )
}

/** Single horizontal spec chip */
function SpecChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  if (!value || value === '-' || value === 0) return null
  return (
    <div className="inline-flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5">
      <span className="text-amber-400/80 flex-shrink-0">{icon}</span>
      <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-zinc-200">{value}</span>
    </div>
  )
}

/** Financial table row */
function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={cn(bold ? 'text-amber-400 font-black text-base' : 'text-zinc-200 font-medium')}>{value}</span>
    </div>
  )
}

/** Sidebar verify row */
function VerifyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
      <span className="text-xs text-emerald-400/90">{children}</span>
    </div>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────
function PropertyHeader({ p }: { p: any }) {
  const locationStr = [p.locality, p.city].filter(Boolean).join(', ')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || locationStr)}`

  return (
    <div className="pt-8 pb-7 border-b border-white/[0.04]">
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {p.isVerified && (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            <ShieldCheck size={11} /> RERA Verified
          </span>
        )}
        {p.propertyType && (
          <span className="bg-white/[0.06] border border-white/[0.08] text-zinc-300 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize">
            {p.propertyType}
          </span>
        )}
        {p.listingStatus && (
          <span className="bg-white/[0.04] border border-white/[0.06] text-zinc-500 text-[11px] px-2.5 py-1 rounded-full capitalize">
            {p.listingStatus}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 leading-tight mb-3">
        {p.title}
      </h1>

      {/* Location */}
      {locationStr && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors text-sm mb-6 group"
        >
          <MapPin size={14} className="flex-shrink-0" />
          {locationStr}
          <ExternalLink size={11} className="opacity-0 group-hover:opacity-50 transition-opacity" />
        </a>
      )}

      {/* Spec chips */}
      <div className="flex flex-wrap gap-2">
        {p.bedrooms     && <SpecChip icon={<Bed size={11} />}      label="BHK"     value={p.bedrooms} />}
        {p.sqft         && <SpecChip icon={<Maximize size={11} />}  label="sqft"    value={Number(p.sqft).toLocaleString()} />}
        {p.floor        && <SpecChip icon={<Building2 size={11} />} label="Floor"   value={p.totalFloors ? `${p.floor}/${p.totalFloors}` : p.floor} />}
        {p.parking > 0  && <SpecChip icon={<Car size={11} />}       label="Parking" value={p.parking} />}
        {p.facing       && <SpecChip icon={<Compass size={11} />}   label="Facing"  value={p.facing} />}
        {p.listingStatus && <SpecChip icon={<Calendar size={11} />} label="Status"  value={p.listingStatus} />}
      </div>

      {/* Mobile-only price */}
      {p.priceINR && (
        <div className="mt-6 lg:hidden">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Asking Price</p>
          <p className="text-3xl font-black text-amber-400">{formatINR(p.priceINR)}</p>
          {p.pricePerSqftINR && (
            <p className="text-xs text-zinc-500 mt-0.5">₹{Number(p.pricePerSqftINR).toLocaleString()}/sqft</p>
          )}
        </div>
      )}
    </div>
  )
}

function Description({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">About this property</h3>
      <div className="text-sm text-zinc-400 leading-relaxed">
        <ClientExpandableText text={text} maxWords={300} />
      </div>
    </div>
  )
}

function Amenities({ items }: { items: string[] }) {
  if (!items?.length) return null
  const premium = new Set(['swimming pool', 'pool', 'gym', 'clubhouse', 'garden', 'rooftop'])
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Amenities</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((a, i) => {
          const label = String(a || '')
          const isPremium = premium.has(label.toLowerCase())
          return (
            <span key={i} className={cn(
              'px-3 py-1.5 rounded-lg border text-xs font-medium',
              isPremium
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-white/[0.04] border-white/[0.06] text-zinc-400',
            )}>
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function FloorPlan({ images }: { images: string[] }) {
  if (!images?.length) return null
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Floor Plan</h3>
      <div className="relative h-72 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <Image src={images[0]} alt="Floor plan" fill className="object-contain" loading="lazy" sizes="(max-width: 1024px) 100vw, 65vw" />
      </div>
    </div>
  )
}

function Financials({ price, sqft }: { price?: number | null; sqft?: number | null }) {
  const base = price || 0
  const reg = Math.round(base * 0.05)
  const stamp = Math.round(base * 0.06)
  const total = base + reg + stamp
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Cost Breakdown</h3>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5">
          <Row label="Base Price" value={formatINR(base)} />
          <Row label="Registration Fee (5%)" value={formatINR(reg)} />
          <Row label="Stamp Duty (6%)" value={formatINR(stamp)} />
          <Row label="GST" value="Nil (resale)" />
          <Row label="Total Acquisition Cost" value={formatINR(total)} bold />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">EMI Estimate</h3>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5">
          <ClientEMICalculator defaultPrincipal={Math.max(0, base - base * 0.2)} />
        </div>
      </div>
    </div>
  )
}

function BuilderInfo({ builder, p }: { builder: any; p: any }) {
  if (!builder && !p.builderName) return null
  if (!builder) {
    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Developer</h3>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
          <p className="text-zinc-200 font-medium">{p.builderName}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Developer</h3>
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 flex items-start gap-4">
        {builder.logoUrl && (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/[0.06] flex-shrink-0 border border-white/[0.08]">
            <Image src={builder.logoUrl} alt={builder.name} fill className="object-contain" />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-base font-semibold text-zinc-100">{builder.name}</p>
          {builder.founded && <p className="text-xs text-zinc-500">Founded {builder.founded}</p>}
          {builder.totalProjects && <p className="text-xs text-zinc-500">{builder.totalProjects} total projects</p>}
          {builder.reputationScore && (
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">{builder.reputationScore}/5</span>
              {builder.reviewsCount && <span className="text-zinc-500 text-xs">({builder.reviewsCount} reviews)</span>}
            </div>
          )}
          {builder.name && (
            <a href={`/builders?name=${encodeURIComponent(builder.name)}`} className="text-xs text-amber-400 hover:underline mt-1 inline-block">
              View all projects →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function SimilarProperties({ items }: { items: any[] }) {
  if (!items?.length) return null
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Similar Properties</h3>
      <ClientCompareChart items={items} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {items.slice(0, 6).map((it) => (
          <a
            key={it.id}
            href={`/properties/${it.id}`}
            className="group bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-amber-500/25 hover:bg-white/[0.05] transition-all block"
          >
            <div className="relative h-36 bg-zinc-800/40">
              {it.image
                ? <Image src={it.image} alt={it.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                : <div className="h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-zinc-700" /></div>}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-zinc-200 line-clamp-1 group-hover:text-amber-300 transition-colors">{it.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{it.locality || it.city || ''}</p>
              <p className="text-sm font-bold text-amber-400 mt-2">
                {formatINR(it.priceINR)}
                {it.pricePerSqftINR && <span className="text-zinc-500 font-normal text-xs ml-1.5">₹{it.pricePerSqftINR}/sqft</span>}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function Reviews({ items }: { items: any[] }) {
  if (!items?.length) return null
  const overall = Math.round((items.reduce((s, r) => s + (r.rating || 0), 0) / items.length) * 10) / 10
  const locAvg   = avg(items.map(i => i.categories?.location))
  const valAvg   = avg(items.map(i => i.categories?.value))
  const qualAvg  = avg(items.map(i => i.categories?.quality))
  const ameAvg   = avg(items.map(i => i.categories?.amenities))
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Reviews &amp; Ratings</h3>
      {/* Summary */}
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl font-black text-amber-400">{overall}</span>
          <div>
            <div className="flex gap-0.5 mb-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={12} className={cn(i <= Math.round(overall) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700')} />
              ))}
            </div>
            <p className="text-xs text-zinc-500">{items.length} review{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([['Location', locAvg], ['Value', valAvg], ['Quality', qualAvg], ['Amenities', ameAvg]] as [string, number|null][]).map(([label, val]) => (
            <div key={label} className="bg-white/[0.03] rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-zinc-600 mb-1">{label}</p>
              <p className="text-sm font-bold text-zinc-300">{val ? `${val}/5` : '—'}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Individual */}
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {r.avatar
                  ? <Image src={r.avatar} alt={r.name} width={26} height={26} className="rounded-full" />
                  : <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-bold">{(r.name || 'B')[0]}</div>}
                <span className="text-sm font-medium text-zinc-200">{r.name}</span>
                {r.verified && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Verified</span>
                )}
              </div>
              <span className="text-xs text-zinc-600">{r.date ? new Date(r.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}</span>
            </div>
            {r.text && <p className="text-sm text-zinc-400 leading-relaxed">{r.text}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Right sticky sidebar */
function StickySidebar({ p, builder }: { p: any; builder: any }) {
  return (
    <div className="space-y-4">
      {/* Price card */}
      <div className="bg-white/[0.05] backdrop-blur-2xl border border-amber-500/20 rounded-2xl p-5 shadow-xl shadow-amber-500/[0.05]">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">Asking Price</p>
        <div className="text-3xl font-black text-amber-400 leading-none">{formatINR(p.priceINR)}</div>
        {p.pricePerSqftINR && (
          <p className="text-xs text-zinc-500 mt-1">₹{Number(p.pricePerSqftINR).toLocaleString()}/sqft</p>
        )}

        {/* Verification */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5">
          <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-widest mb-2.5">AI Verification</p>
          {p.isVerified && <VerifyRow>RERA Approved</VerifyRow>}
          {p.reraId     && <VerifyRow>RERA ID recorded</VerifyRow>}
          <VerifyRow>Price analysis complete</VerifyRow>
          <VerifyRow>AI intelligence active</VerifyRow>
        </div>

        {/* Live dot */}
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-zinc-600">Listing active</span>
        </div>
      </div>

      {/* Contact card */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={12} className="text-amber-400" />
          <p className="text-sm font-semibold text-zinc-200">Schedule a Visit</p>
        </div>
        <ContactFormClient propertyId={p.id} brochureUrl={p.brochureUrl} />
      </div>

      {/* Match score */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-5">
        <ClientMatchScore propertyId={p.id} />
      </div>

      {/* Share */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-4">
        <ShareProperty propertyId={p.id} title={p.title} />
      </div>
    </div>
  )
}

function EngagementTracker({ propertyId }: { propertyId: string }) {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function(){try{
        try{window.thgTrack&&window.thgTrack('view',{property_id:'${propertyId}',value:1})}catch(_){}
        var s=Date.now(),f50=false,f90=false;
        function tick(){var t=((Date.now()-s)/1000)|0;
          if(t===30)window.thgTrack&&window.thgTrack('time_on_page_30s',{property_id:'${propertyId}'});
          if(t===60)window.thgTrack&&window.thgTrack('time_on_page_60s',{property_id:'${propertyId}'});}
        setInterval(tick,1000);
        window.addEventListener('scroll',function(){try{
          var r=(window.scrollY+window.innerHeight)/document.documentElement.scrollHeight;
          if(!f50&&r>=.5){f50=true;window.thgTrack&&window.thgTrack('scroll_50',{property_id:'${propertyId}'});}
          if(!f90&&r>=.9){f90=true;window.thgTrack&&window.thgTrack('scroll_90',{property_id:'${propertyId}'});}
        }catch(_){}},{passive:true});
      }catch(_){}})()`}} />
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default async function PropertyPage({ params }: { params: { id: string } }) {
  const data = await fetchProperty(params.id)
  if (!data?.property) notFound()
  const { property: p, builder, similar, reviews } = data

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-100">
      {/* CSS-only Neural Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
        <div className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage: 'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px]"
          style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.04) 0%,transparent 68%)' }} />
        <div className="absolute w-80 h-80 rounded-full blur-3xl bg-amber-500/[0.04]"
          style={{ top: '10%', left: '4%', animation: 'tool-orb-1 20s ease-in-out infinite' }} />
        <div className="absolute w-64 h-64 rounded-full blur-3xl bg-purple-500/[0.03]"
          style={{ bottom: '15%', right: '6%', animation: 'tool-orb-2 24s ease-in-out infinite' }} />
      </div>

      {/* ── Gallery (full width) ── */}
      <section className="relative">
        {/* Back nav overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 sm:px-6 pt-[72px] pointer-events-none">
          <Link
            href="/property-listing"
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-amber-400 hover:border-amber-500/30 text-xs font-medium transition-all"
          >
            <ArrowLeft size={12} />
            Properties
          </Link>
        </div>
        <ClientGallery images={p.images} tourUrl={p.tourUrl} brochureUrl={p.brochureUrl} propertyId={p.id} />
      </section>

      {/* ── Sticky Section Nav ── */}
      <PropertySectionNav />

      {/* ── Two-column content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 lg:pb-12">
        <div className="lg:grid lg:grid-cols-[1fr_316px] lg:gap-10 lg:items-start">

          {/* LEFT: scrollable content */}
          <div>
            <PropertyHeader p={p} />

            {/* ── Details ── */}
            <section id="details" className="py-10 border-b border-white/[0.04] scroll-mt-[104px]">
              <SectionLabel>Details</SectionLabel>
              <Description text={p.description} />
              <Amenities items={p.amenities} />
              <FloorPlan images={p.floorPlans} />
              <div className="mt-2">
                <PropertyDocuments propertyId={p.id} />
              </div>
            </section>

            {/* ── AI Intelligence ── */}
            <section id="intelligence" className="py-10 border-b border-white/[0.04] scroll-mt-[104px]">
              <SectionLabel>AI Intelligence</SectionLabel>

              {/* RERA + Risk grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-5">
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5">
                  <RERAVerification propertyId={p.id} reraId={p.reraId} />
                </div>
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5">
                  <RiskFlags propertyId={p.id} priceINR={p.priceINR} sqft={p.sqft} reraId={p.reraId} />
                </div>
              </div>

              {/* Appreciation prediction — self-contained card, returns null when no data */}
              <div className="mb-4">
                <AppreciationPrediction propertyId={p.id} />
              </div>

              {/* Market analysis */}
              {(p.locality || p.city) && (
                <div className="mb-4">
                  <ClientMarketAnalysis area={p.locality || p.city || ''} propertyId={p.id} />
                </div>
              )}

              {/* Chennai insights */}
              {p.city === 'Chennai' && (
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5">
                  <ChennaiInsights propertyId={p.id} locality={p.locality || ''} />
                </div>
              )}
            </section>

            {/* ── Finance ── */}
            <section id="finance" className="py-10 border-b border-white/[0.04] scroll-mt-[104px]">
              <SectionLabel>Finance</SectionLabel>
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 mb-6">
                <PriceComparison
                  propertyId={p.id}
                  pricePerSqft={p.pricePerSqftINR}
                  locality={p.locality}
                  city={p.city}
                />
              </div>
              <Financials price={p.priceINR} sqft={p.sqft} />
            </section>

            {/* ── Location ── */}
            <section id="location" className="py-10 border-b border-white/[0.04] scroll-mt-[104px]">
              <SectionLabel>Location</SectionLabel>
              <LocationInsights propertyId={p.id} lat={p.lat} lng={p.lng} />
            </section>

            {/* ── Builder & Reviews ── */}
            <section id="reviews" className="py-10 scroll-mt-[104px]">
              <SectionLabel>Builder &amp; Reviews</SectionLabel>
              <BuilderInfo builder={builder} p={p} />
              <SimilarProperties items={similar} />
              <Reviews items={reviews} />

              {/* Global legal footnote */}
              <div className="mt-8 pt-6 border-t border-white/[0.04]">
                <p className="text-[10px] text-zinc-700 leading-relaxed italic max-w-2xl">
                  Legal notice: AI-generated scores, RERA snapshots, risk flags, and appreciation forecasts on this page are
                  automated informational snapshots as of the date shown. They do not constitute legal advice, title insurance,
                  or a guarantee of property ownership. For formal legal confirmation consult a licensed property lawyer or
                  the appropriate government registry.
                </p>
                <a href="/how-verification-works" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors mt-1.5 inline-block">
                  How verification works →
                </a>
              </div>
            </section>
          </div>

          {/* RIGHT: sticky sidebar */}
          <div className="hidden lg:block pt-6">
            <div className="sticky top-[104px]">
              <StickySidebar p={p} builder={builder} />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile contact bar (client component — safe use of window) */}
      <MobileContactBar
        propertyId={p.id}
        priceDisplay={p.priceDisplay || formatINR(p.priceINR)}
        brochureUrl={p.brochureUrl}
      />

      {/* Engagement tracking */}
      <EngagementTracker propertyId={p.id} />
    </main>
  )
}
