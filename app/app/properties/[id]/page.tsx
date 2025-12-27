import Image from 'next/image'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, Bed, Maximize, Car, Building2, Compass, Calendar, Star, ShieldCheck } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
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
import { getSupabase } from '@/lib/supabase'

export const revalidate = 300 // ISR: 5 minutes

async function fetchProperty(id: string) {
  // Prefer direct Supabase (server), fall back to public API list if env is missing.
  try {
    const supabase = getSupabase()
    const { data: propData, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle()
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

  // Fallback: use Netlify function list and pick by id (reduced data)
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/properties-list`, { cache: 'no-store' as any })
    const items = await res.json()
    const p = Array.isArray(items) ? items.find((x: any) => String(x.id) === String(id)) : null
    if (!p) return null
    const property = {
      id: p.id,
      title: p.title,
      description: p.summary || '',
      project: p.project || '',
      builderName: p.builder || '',
      bedrooms: p.bhk ?? null,
      bathrooms: p.bathrooms ?? null,
      parking: null,
      floor: null,
      totalFloors: null,
      facing: p.facing || '',
      furnished: p.furnished || '',
      propertyType: p.type || '',
      priceINR: p.priceINR ?? null,
      priceDisplay: p.priceDisplay || '',
      sqft: p.carpetAreaSqft ?? null,
      pricePerSqftINR: p.pricePerSqftINR ?? null,
      city: p.city || '',
      locality: p.locality || '',
      address: '',
      lat: null,
      lng: null,
      reraId: p.rera || '',
      tourUrl: p.tourUrl || '',
      brochureUrl: '',
      images: Array.isArray(p.images) ? p.images : [],
      floorPlans: [],
      amenities: [],
      listedAt: p.postedAt || null,
      isVerified: p.listingStatus === 'Verified',
      listingStatus: p.listingStatus || '',
    }
    return { property, builder: null, similar: [], reviews: [] }
  } catch {
    return null
  }
}

function toNumber(n: any): number | null {
  const x = Number(n)
  return Number.isFinite(x) ? x : null
}

function pricePerSqft(price: number | null, sqft: number | null): number | null {
  if (!price || !sqft || sqft <= 0) return null
  return Math.round(price / sqft)
}

function safeParseArray(s: string): string[] {
  try { const j = JSON.parse(s); return Array.isArray(j) ? (j as string[]) : [] } catch { return [] }
}

function mapProperty(row: any) {
  const images: string[] = Array.isArray(row.images)
    ? row.images
    : typeof row.images === 'string'
      ? safeParseArray(row.images)
      : []

  const floorPlans: string[] = Array.isArray(row.floor_plan_images)
    ? row.floor_plan_images
    : typeof row.floor_plan_images === 'string'
      ? safeParseArray(row.floor_plan_images)
      : []

  const amenities: string[] = Array.isArray(row.amenities)
    ? row.amenities
    : typeof row.amenities === 'string'
      ? safeParseArray(row.amenities)
      : []

  const priceINR = toNumber(row.price_inr)
  const sqft = toNumber(row.sqft)

  return {
    id: row.id as string,
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    project: (row.project as string) || '',
    builderName: (row.builder as string) || '',
    bedrooms: toNumber(row.bedrooms),
    bathrooms: toNumber(row.bathrooms),
    parking: toNumber(row.parking),
    floor: toNumber(row.floor),
    totalFloors: toNumber(row.total_floors),
    facing: (row.facing as string) || '',
    furnished: (row.furnished as string) || '',
    propertyType: (row.property_type as string) || '',
    priceINR,
    priceDisplay: priceINR ? `₹${Math.round(priceINR).toLocaleString('en-IN')}` : 'Price on request',
    sqft,
    pricePerSqftINR: pricePerSqft(priceINR, sqft),
    city: (row.city as string) || '',
    locality: (row.locality as string) || '',
    address: (row.address as string) || '',
    lat: typeof row.lat === 'number' ? (row.lat as number) : null,
    lng: typeof row.lng === 'number' ? (row.lng as number) : null,
    reraId: (row.rera_id as string) || '',
    tourUrl: (row.tour_url as string) || '',
    brochureUrl: (row.brochure_url as string) || '',
    images,
    floorPlans,
    amenities,
    listedAt: row.listed_at || null,
    isVerified: !!row.is_verified,
    listingStatus: row.listing_status || '',
  }
}

async function fetchBuilder(supabase: ReturnType<typeof getSupabase>, property: ReturnType<typeof mapProperty>) {
  try {
    const builderName = property.builderName?.trim()
    if (!builderName) return null
    const { data, error } = await supabase
      .from('builders')
      .select('id,name,logo_url,founded,total_projects,reputation_score,reviews_count')
      .ilike('name', builderName)
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return {
      id: data.id as string,
      name: (data.name as string) || builderName,
      logoUrl: (data.logo_url as string) || '',
      founded: data.founded || null,
      totalProjects: toNumber(data.total_projects),
      reputationScore: typeof data.reputation_score === 'number' ? (data.reputation_score as number) : null,
      reviewsCount: toNumber(data.reviews_count),
    }
  } catch {
    return null
  }
}

async function fetchSimilar(supabase: ReturnType<typeof getSupabase>, property: ReturnType<typeof mapProperty>) {
  try {
    const min = property.priceINR ? Math.floor(property.priceINR * 0.85) : null
    const max = property.priceINR ? Math.ceil(property.priceINR * 1.15) : null
    let query = supabase
      .from('properties')
      .select('id,title,price_inr,sqft,bedrooms,images,locality,city')
      .neq('id', property.id)
      .limit(12)
    if (property.city) query = query.eq('city', property.city)
    if (property.locality) query = query.eq('locality', property.locality)
    if (property.bedrooms != null) query = query.eq('bedrooms', property.bedrooms)
    if (min != null && max != null) query = query.gte('price_inr', min).lte('price_inr', max)
    const { data, error } = await query
    if (error || !data) return []
    return data.slice(0, 6).map((p: any) => {
      const imgs: string[] = Array.isArray(p.images)
        ? p.images
        : typeof p.images === 'string'
          ? safeParseArray(p.images)
          : []
      const price = toNumber(p.price_inr)
      const sqft = toNumber(p.sqft)
      return {
        id: p.id as string,
        title: (p.title as string) || '',
        city: (p.city as string) || '',
        locality: (p.locality as string) || '',
        bedrooms: toNumber(p.bedrooms),
        priceINR: price,
        priceDisplay: price ? `₹${Math.round(price).toLocaleString('en-IN')}` : 'Price on request',
        pricePerSqftINR: pricePerSqft(price, sqft),
        sqft,
        image: imgs[0] || '',
      }
    })
  } catch {
    return []
  }
}

async function fetchReviews(supabase: ReturnType<typeof getSupabase>, propertyId: string) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id,user_name,user_avatar,rating,category_location,category_value,category_quality,category_amenities,text,created_at,verified_buyer')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error || !data) return []
    return data.map((r: any) => ({
      id: r.id,
      name: r.user_name || 'Buyer',
      avatar: r.user_avatar || '',
      rating: toNumber(r.rating) || 0,
      categories: {
        location: toNumber(r.category_location) || null,
        value: toNumber(r.category_value) || null,
        quality: toNumber(r.category_quality) || null,
        amenities: toNumber(r.category_amenities) || null,
      },
      text: r.text || '',
      date: r.created_at || null,
      verified: !!r.verified_buyer,
    }))
  } catch {
    return []
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const data = await fetchProperty(params.id)
  if (!data?.property) return {}
  const p = data.property
  
  // Build rich title and description
  const bedrooms = p.bedrooms ? `${p.bedrooms} BHK` : 'Property'
  const location = p.locality ? `${p.locality}, ${p.city || ''}` : p.city || ''
  const title = `${p.title || 'Property'} - ${bedrooms} in ${location} | Tharaga`
  const description = p.description 
    ? `${p.description.slice(0, 120)}...` 
    : `${bedrooms} in ${location}${p.priceDisplay ? ` - ${p.priceDisplay}` : ''}. ${p.propertyType || 'Property'} with modern amenities.`
  
  // Get primary image (first image or fallback)
  const primaryImage = p.images?.[0] || ''
  const ogImageUrl = primaryImage || 'https://tharaga.co.in/og-default.jpg'
  
  // Build property URL
  const propertyUrl = `https://tharaga.co.in/properties/${params.id}`
  
  // Build rich description with key details
  const richDescription = `${bedrooms} in ${location}${p.priceDisplay ? ` - ${p.priceDisplay}` : ''}${p.sqft ? ` (${p.sqft} sqft)` : ''}. ${p.description ? p.description.slice(0, 100) : 'Premium property with modern amenities'}.`

  return {
    title,
    description: description,
    openGraph: {
      title: p.title || title,
      description: richDescription,
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: p.title || 'Property Image',
      }],
      url: propertyUrl,
      type: 'website',
      siteName: 'Tharaga Real Estate',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: p.title || title,
      description: richDescription,
      images: [ogImageUrl],
      creator: '@tharaga',
      site: '@tharaga',
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: p.title,
        price: p.priceDisplay,
        priceCurrency: 'INR',
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.locality || p.city || '',
          addressRegion: p.city || '',
          addressCountry: 'IN',
        },
        numberOfRooms: p.bedrooms || 3,
        floorSize: p.sqft ? {
          '@type': 'QuantitativeValue',
          value: p.sqft,
          unitCode: 'SQM',
        } : undefined,
        image: p.images || [],
      }),
    },
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const data = await fetchProperty(params.id)
  if (!data?.property) notFound()
  const { property: p, builder, similar, reviews } = data

  return (
    <main className="min-h-screen bg-slate-950">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/property-listing' },
        { label: p.title || 'Property Details' }
      ]} />
      <section className="w-full">
        <ClientGallery images={p.images} tourUrl={p.tourUrl} brochureUrl={p.brochureUrl} propertyId={p.id} />
      </section>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6" style={{ paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}>
        <div className="lg:col-span-7 space-y-6">
          <Overview p={p} />
          <div className="bg-slate-800/95 glow-border rounded-lg p-6">
            <RERAVerification propertyId={p.id} reraId={p.reraId} />
          </div>
          <div className="bg-slate-800/95 glow-border rounded-lg p-6">
            <RiskFlags propertyId={p.id} />
          </div>
          <Description text={p.description} />
          <Amenities items={p.amenities} />
          <FloorPlan images={p.floorPlans} />
          {p.city === 'Chennai' && (
            <div className="bg-slate-800/95 glow-border rounded-lg p-6">
              <ChennaiInsights propertyId={p.id} locality={p.locality || ''} />
            </div>
          )}
          <div className="bg-slate-800/95 glow-border rounded-lg p-6">
            <AppreciationPrediction propertyId={p.id} />
          </div>
          {(p.locality || p.city) && (
            <div>
              <ClientMarketAnalysis area={p.locality || p.city || ''} propertyId={p.id} />
            </div>
          )}
          <LocationInsights propertyId={p.id} lat={p.lat} lng={p.lng} />
          <Financials price={p.priceINR} sqft={p.sqft} />
          <BuilderInfo builder={builder} p={p} />
          <PropertyDocuments propertyId={p.id} />
          <SimilarProperties items={similar} />
          <Reviews items={reviews} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <StickySidebar p={p} />
          <div className="bg-slate-800/95 glow-border rounded-lg p-6">
            <ClientMatchScore propertyId={p.id} />
          </div>
        </div>
      </div>
      <MobileBar p={p} />
      <EngagementTracker propertyId={p.id} />
    </main>
  )
}

// HeroGallery moved to separate client component `Gallery`

function Overview({ p }: { p: any }) {
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6 space-y-4">
      <h1 className="text-3xl font-bold text-white">{p.title}</h1>
      <div className="flex items-center gap-2 text-amber-300">
        <MapPin size={18} />
        <a className="hover:underline text-white hover:text-amber-300 transition-colors" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || `${p.locality||''} ${p.city||''}`)}`} target="_blank" rel="noreferrer">
          {p.address || `${p.locality || ''}, ${p.city || ''}`}
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Spec icon={<Bed size={18}/>} label="BHK" value={p.bedrooms || '-'} />
        <Spec icon={<Maximize size={18}/>} label="Area" value={`${p.sqft || '-'} sqft`} />
        <Spec icon={<Car size={18}/>} label="Parking" value={p.parking || 0} />
        <Spec icon={<Building2 size={18}/>} label="Floor" value={p.floor ? `${p.floor}${p.totalFloors?`/${p.totalFloors}`:''}` : '-'} />
        <Spec icon={<Compass size={18}/>} label="Facing" value={p.facing || '-'} />
        <Spec icon={<Calendar size={18}/>} label="Status" value={p.listingStatus || 'Ready to Move'} />
      </div>
    </div>
  )
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-3 flex items-center gap-2 text-sm">
      <div className="text-amber-300">{icon}</div>
      <div className="text-slate-400 text-xs uppercase font-semibold">{label}</div>
      <div className="ml-auto font-medium text-white">{value}</div>
    </div>
  )
}

function Description({ text }: { text: string }) {
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6 prose max-w-none">
      <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
      <ClientExpandableText text={text} maxWords={300} />
    </div>
  )
}

function Amenities({ items }: { items: string[] }){
  if (!items?.length) return null
  const premium = new Set(['swimming pool','pool','gym','clubhouse','garden'])
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Amenities</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {items.map((a, i)=> {
          const label = String(a || '')
          const isPremium = premium.has(label.toLowerCase())
          return (
            <div key={i} className={isPremium ? 'rounded-lg border-2 border-amber-300 bg-amber-500/20 px-3 py-2 text-sm text-amber-300 font-medium' : 'rounded-lg border border-amber-300/30 bg-slate-700/50 px-3 py-2 text-sm text-white'}>{label}</div>
          )
        })}
      </div>
    </div>
  )
}

function FloorPlan({ images }: { images: string[] }){
  if (!images?.length) return null
  const first = images[0]
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Floor Plan & Layout</h2>
      <div className="relative h-80 bg-slate-700/50 border border-amber-300/30 rounded-lg overflow-hidden">
        <Image src={first} alt="Floor plan" fill className="object-contain" loading="lazy" sizes="100vw" />
      </div>
    </div>
  )
}


function formatINR(n?: number | null){
  if (!n) return '—'
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function Financials({ price }: { price?: number|null; sqft?: number|null }){
  const base = price || 0
  const reg = Math.round(base * 0.05)
  const stamp = Math.round(base * 0.06)
  const total = base + reg + stamp
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Financial Breakdown</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4 space-y-2">
          <Row label="Base Price" value={formatINR(base)} />
          <Row label="Registration (5%)" value={formatINR(reg)} />
          <Row label="Stamp Duty (6%)" value={formatINR(stamp)} />
          <Row label="GST" value="₹0" />
          <hr className="border-amber-300/30" />
          <Row label="Total" value={formatINR(total)} bold />
        </div>
        <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4">
          <ClientEMICalculator defaultPrincipal={Math.min(base, Math.max(0, base - (base*0.2)))} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }){
  return (
    <div className="flex items-center justify-between py-1">
      <div className="text-white text-sm">{label}</div>
      <div className={bold ? 'font-bold text-amber-300 text-lg' : 'font-medium text-white'}>{value}</div>
    </div>
  )
}

// EMI calculator moved to client component

function BuilderInfo({ builder }: { p: any; builder: any }){
  if (!builder) return null
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Builder Information</h2>
      <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4 flex items-center gap-4">
        {builder.logoUrl ? (
          <div className="relative w-24 h-24">
            <Image src={builder.logoUrl} alt={builder.name} fill className="object-contain" />
          </div>
        ) : null}
        <div className="space-y-1">
          <div className="text-xl font-semibold text-white">{builder.name}</div>
          <div className="text-sm text-white">Founded: {builder.founded || '—'}</div>
          <div className="text-sm text-white">Total Projects: {builder.totalProjects || '—'}</div>
          <div className="flex items-center gap-1 text-amber-300"><Star size={16}/> <span className="font-medium">{builder.reputationScore || '4.7'}/5</span> <span className="text-white">({builder.reviewsCount || 120} reviews)</span></div>
          <a href={`/builders?name=${encodeURIComponent(builder.name)}`} className="text-amber-300 text-sm hover:underline">View All Properties by Builder</a>
        </div>
      </div>
    </div>
  )
}


function SimilarProperties({ items }: { items: any[] }){
  if (!items?.length) return null
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">You Might Also Like</h2>
      <ClientCompareChart items={items} />
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {items.slice(0, 6).map((it)=> (
          <div key={it.id} className="bg-slate-700/50 border border-amber-300/30 rounded-lg overflow-hidden hover:border-amber-300 transition-colors">
            <div className="relative h-40">
              {it.image ? <Image src={it.image} alt={it.title} fill className="object-cover" /> : <div className="h-full bg-slate-700"/>}
            </div>
            <div className="p-3">
              <div className="font-bold text-white line-clamp-1">{it.title}</div>
              <div className="text-sm text-white">{it.locality || it.city || ''}</div>
              <div className="text-sm text-amber-300 font-bold mt-1">{formatINR(it.priceINR)} {it.pricePerSqftINR ? <span className="text-white">(₹{it.pricePerSqftINR}/sqft)</span> : null}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Reviews({ items }: { items: any[] }){
  if (!items?.length) return null
  const overall = Math.round((items.reduce((s, r)=> s + (r.rating || 0), 0) / items.length) * 10) / 10
  const locAvg = avg(items.map(i=> i.categories?.location))
  const valAvg = avg(items.map(i=> i.categories?.value))
  const qualAvg = avg(items.map(i=> i.categories?.quality))
  const ameAvg = avg(items.map(i=> i.categories?.amenities))
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Reviews & Ratings</h2>
      <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-300">
          <Star/> <span className="text-xl font-semibold text-white">{overall}/5</span> <span className="text-white">(from {items.length} reviews)</span>
        </div>
        <div className="mt-3 grid md:grid-cols-4 gap-2 text-sm text-white">
          <div>Location: {locAvg || '—'}/5</div>
          <div>Value for Money: {valAvg || '—'}/5</div>
          <div>Builder Quality: {qualAvg || '—'}/5</div>
          <div>Amenities: {ameAvg || '—'}/5</div>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((r)=> (
            <div key={r.id} className="border-t border-amber-300/30 pt-3">
              <div className="flex items-center gap-2">
                {r.avatar ? <Image src={r.avatar} alt={r.name} width={32} height={32} className="rounded-full" /> : <div className="w-8 h-8 rounded-full bg-slate-600"/>}
                <div className="font-medium text-white">{r.name}</div>
                <div className="ml-auto text-sm text-white">{r.date ? new Date(r.date).toLocaleDateString() : ''}</div>
              </div>
              <div className="text-sm text-white mt-1">{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function avg(nums: Array<number|null|undefined>){
  const arr = nums.filter((n): n is number => typeof n === 'number')
  if (!arr.length) return null
  return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10
}

function StickySidebar({ p }: { p: any }){
  return (
    <div className="lg:sticky lg:top-4">
      <div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg p-6 space-y-4">
        <div className="text-3xl font-bold text-amber-300">{formatINR(p.priceINR)}</div>
        {p.pricePerSqftINR ? <div className="text-sm text-white">₹{p.pricePerSqftINR}/sqft</div> : null}
        <div className="flex items-center gap-2 text-emerald-400 text-sm"><ShieldCheck size={16}/> RERA Approved</div>
        <div className="flex items-center gap-1 text-amber-300 text-sm"><Star size={16}/> <span className="text-white">Builder reputation: 5.0 (120 reviews)</span></div>
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-300/50 text-emerald-300 p-3 text-sm">
          <div className="font-bold mb-2">Verified by AI</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>✓ RERA Approved</li>
            <li>✓ Title Clear</li>
            <li>✓ Builder Verified</li>
            <li>✓ Price Fair</li>
          </ul>
        </div>
        <ContactFormClient propertyId={p.id} brochureUrl={p.brochureUrl} />
      </div>
    </div>
  )
}

// Contact form moved to client component

function MobileBar({ p }: { p: any }){
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-800/95 border-t border-amber-300/30 p-3 flex items-center justify-between lg:hidden" style={{ boxShadow: '0 -4px 20px rgba(252, 211, 77, 0.1)' }}>
      <div className="font-bold text-amber-300">{formatINR(p.priceINR)}</div>
      <button className="rounded-lg bg-amber-500 hover:bg-amber-600 border border-amber-300/50 text-slate-900 font-bold px-4 py-2 transition-colors" style={{ boxShadow: '0 0 15px rgba(252, 211, 77, 0.3)' }}>Schedule Visit</button>
      <a href={`https://wa.me/?text=${encodeURIComponent(typeof location !== 'undefined' ? (location.href || '') : '')}`} className="fixed bottom-20 right-4 rounded-full bg-green-500 hover:bg-green-600 text-white w-12 h-12 flex items-center justify-center shadow-lg transition-colors" aria-label="WhatsApp">WA</a>
    </div>
  )
}

function EngagementTracker({ propertyId }: { propertyId: string }){
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function(){
        try{
          // Immediate view event
          try { window.thgTrack && window.thgTrack('view', { property_id: '${propertyId}', value: 1 }); } catch(_){ }
          var start = Date.now();
          var firedScroll50 = false; var firedScroll90 = false;
          function tick(){
            var t = ((Date.now()-start)/1000)|0;
            if (t === 30) window.thgTrack && window.thgTrack('time_on_page_30s', { property_id: '${propertyId}' });
            if (t === 60) window.thgTrack && window.thgTrack('time_on_page_60s', { property_id: '${propertyId}' });
          }
          setInterval(tick, 1000);
          window.addEventListener('scroll', function(){
            try{
              var scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
              if (!firedScroll50 && scrolled >= 0.5) { firedScroll50 = true; window.thgTrack && window.thgTrack('scroll_50', { property_id: '${propertyId}' }); }
              if (!firedScroll90 && scrolled >= 0.9) { firedScroll90 = true; window.thgTrack && window.thgTrack('scroll_90', { property_id: '${propertyId}' }); }
            }catch(_){ }
          }, { passive: true });
          // Basic interaction hooks
          document.addEventListener('click', function(e){
            var el = e.target as HTMLElement;
            if (!el) return;
            var id = el.getAttribute('data-track-id') || '';
            if (id) window.thgTrack && window.thgTrack('interaction', { property_id: '${propertyId}', id: id });
          }, true);
        }catch(_){ }
      })();
    `}} />
  )
}
