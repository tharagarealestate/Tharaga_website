import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const runtime = 'edge'

function json(data: any, init?: number | ResponseInit) {
  const res = NextResponse.json(data, init as any)
  // Cache for 5 minutes on the edge/CDN, allow 1 minute stale while revalidating
  res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  return res
}

type PropertyRow = any

type BuilderRow = any

type ReviewRow = any

function toNumber(n: any): number | null {
  const x = Number(n)
  return Number.isFinite(x) ? x : null
}

function pricePerSqft(price: number | null, sqft: number | null): number | null {
  if (!price || !sqft || sqft <= 0) return null
  return Math.round(price / sqft)
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id
    if (!id) return json({ error: 'Missing id' }, { status: 400 })

    const supabase = getSupabase()

    // Fetch the property first
    const { data: propData, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle()

    if (propErr) return json({ error: propErr.message }, { status: 500 })
    if (!propData) return json({ error: 'Not found' }, { status: 404 })

    const property = mapProperty(propData)

    // Parallel dependent queries using the property data
    const builderPromise = fetchBuilder(supabase, property)
    const similarPromise = fetchSimilar(supabase, property)
    const reviewsPromise = fetchReviews(supabase, property.id)

    const [builder, similar, reviews] = await Promise.all([
      builderPromise,
      similarPromise,
      reviewsPromise,
    ])

    return json({ property, builder, similar, reviews })
  } catch (e: any) {
    return json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

function mapProperty(row: PropertyRow) {
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
    // Try to find a builder by exact name match first
    const builderName = property.builderName?.trim()
    if (!builderName) return null

    const { data, error } = await supabase
      .from('builders')
      .select('id,name,logo_url,founded,total_projects,reputation_score,reviews_count')
      .ilike('name', builderName)
      .limit(1)
      .maybeSingle()

    if (error) return null
    if (!data) return null
    const b = data as BuilderRow
    return {
      id: b.id as string,
      name: (b.name as string) || builderName,
      logoUrl: (b.logo_url as string) || '',
      founded: b.founded || null,
      totalProjects: toNumber(b.total_projects),
      reputationScore: typeof b.reputation_score === 'number' ? (b.reputation_score as number) : null,
      reviewsCount: toNumber(b.reviews_count),
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
    return data.map((r: ReviewRow) => ({
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

function safeParseArray(s: string): string[] {
  try {
    const j = JSON.parse(s)
    return Array.isArray(j) ? (j as string[]) : []
  } catch {
    return []
  }
}
