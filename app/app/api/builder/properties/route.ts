import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    // TODO: derive from auth/session; use demo for now
    const builderId = url.searchParams.get('builder_id') || 'demo-builder'

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('properties')
      .select('id,title,city,locality,price_inr,images,bedrooms,sqft,listed_at,listing_status')
      .eq('builder_id', builderId)
      .order('listed_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const items = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      city: p.city,
      locality: p.locality,
      priceINR: typeof p.price_inr === 'number' ? p.price_inr : null,
      image: Array.isArray(p.images) ? (p.images[0] || null) : null,
      bedrooms: typeof p.bedrooms === 'number' ? p.bedrooms : null,
      sqft: typeof p.sqft === 'number' ? p.sqft : null,
      listed_at: p.listed_at || null,
      status: p.listing_status || 'active',
      views: 0, // TODO: Fetch from analytics
      inquiries: 0, // TODO: Fetch from leads
    }))

    const res = NextResponse.json({ items })
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60')
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
