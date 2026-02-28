import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const { searchParams } = new URL(req.url)

    const q = searchParams.get('q') || ''
    const city = searchParams.get('city') || ''
    const sortBy = searchParams.get('sort') || 'relevance'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '18', 10))
    const offset = (page - 1) * limit

    const propertyTypes = searchParams.getAll('property_type')
    const bhkTypes = searchParams.getAll('bhk_type')
    const possessionStatuses = searchParams.getAll('possession_status')
    const amenities = searchParams.getAll('amenities')
    const minPrice = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!, 10) : null
    const maxPrice = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!, 10) : null
    const minArea = searchParams.get('min_area') ? parseInt(searchParams.get('min_area')!, 10) : null
    const maxArea = searchParams.get('max_area') ? parseInt(searchParams.get('max_area')!, 10) : null
    const reraVerified = searchParams.get('rera_verified') === 'true'
    const approvedByBank = searchParams.get('approved_by_bank') === 'true'

    // Base query — all publicly active properties
    let query = supabase
      .from('properties')
      .select(
        `
        id, title, description, property_type, bhk_type,
        city, locality, state, address, pincode, lat, lng,
        price_inr, price_per_sqft, negotiable, base_price,
        carpet_area, sqft, builtup_area, plot_area,
        bedrooms, bathrooms, floor, total_floors, facing,
        furnishing_status, possession_status,
        amenities, images, videos, virtual_tour_url, thumbnail_url,
        rera_id, rera_verified, rera_certificate_url,
        listing_status, listing_type, availability_status,
        view_count, inquiry_count, favorite_count,
        ai_insights, ai_price_estimate, ai_appreciation_band, ai_rental_yield,
        verification_status, slug,
        created_at, listed_at, updated_at,
        builder_id
        `,
        { count: 'exact' }
      )
      .eq('listing_status', 'active')

    // Text search
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%,locality.ilike.%${q}%,address.ilike.%${q}%`
      )
    }

    // City filter
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    // Property type filter
    if (propertyTypes.length > 0) {
      query = query.in('property_type', propertyTypes)
    }

    // BHK type filter
    if (bhkTypes.length > 0) {
      query = query.in('bhk_type', bhkTypes)
    }

    // Price filters
    if (minPrice !== null) {
      query = query.gte('price_inr', minPrice)
    }
    if (maxPrice !== null && maxPrice > 0) {
      query = query.lte('price_inr', maxPrice)
    }

    // Area filters
    if (minArea !== null) {
      query = query.or(`sqft.gte.${minArea},carpet_area.gte.${minArea}`)
    }
    if (maxArea !== null && maxArea > 0) {
      query = query.or(`sqft.lte.${maxArea},carpet_area.lte.${maxArea}`)
    }

    // Possession status
    if (possessionStatuses.length > 0) {
      query = query.in('possession_status', possessionStatuses)
    }

    // RERA verified
    if (reraVerified) {
      query = query.eq('rera_verified', true)
    }

    // Sorting
    switch (sortBy) {
      case 'price_low':
        query = query.order('price_inr', { ascending: true, nullsFirst: false })
        break
      case 'price_high':
        query = query.order('price_inr', { ascending: false, nullsFirst: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('view_count', { ascending: false, nullsFirst: false })
        break
      default:
        // relevance: verified first, then newest
        query = query
          .order('rera_verified', { ascending: false })
          .order('view_count', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: properties, error, count } = await query

    if (error) {
      console.error('[properties-list] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    // Filter by amenities client-side (Supabase array containment)
    let result = properties || []
    if (amenities.length > 0) {
      result = result.filter((p: any) =>
        amenities.every((a) => Array.isArray(p.amenities) && p.amenities.includes(a))
      )
    }

    // Normalise fields for the listing page
    const normalised = result.map((p: any) => ({
      ...p,
      // Map to Property interface expected fields
      base_price: p.base_price || p.price_inr || 0,
      priceINR: p.price_inr || p.base_price || 0,
      carpet_area: p.carpet_area || p.sqft,
      images: Array.isArray(p.images) ? p.images : [],
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      view_count: p.view_count || 0,
      inquiry_count: p.inquiry_count || 0,
      favorite_count: p.favorite_count || 0,
      rera_verified: p.rera_verified || false,
      availability_status: p.availability_status || 'available',
      slug: p.slug || p.id,
    }))

    const res = NextResponse.json({
      properties: normalised,
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    })

    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return res
  } catch (e: any) {
    console.error('[properties-list] Unexpected error:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
