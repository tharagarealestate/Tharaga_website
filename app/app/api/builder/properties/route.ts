import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
import { getSupabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'tharagarealestate@gmail.com'

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user.email || ''
    const isAdmin = userEmail === ADMIN_EMAIL

    // Admin sees ALL properties; builder sees only their own
    let query = supabase
      .from('properties')
      .select('id,title,city,locality,price_inr,images,bedrooms,sqft,listed_at,listing_status,builder_id,is_verified,property_type')
      .order('listed_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('builder_id', user.id)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const items = (data || []).map((p: any) => {
      let firstImage: string | null = null
      if (Array.isArray(p.images)) {
        firstImage = p.images[0] || null
      } else if (typeof p.images === 'string') {
        try { const a = JSON.parse(p.images); firstImage = Array.isArray(a) ? (a[0] || null) : null } catch { firstImage = null }
      }

      return {
        id: p.id,
        title: p.title,
        city: p.city,
        locality: p.locality,
        priceINR: typeof p.price_inr === 'number' ? p.price_inr : (p.price_inr ? Number(p.price_inr) : null),
        image: firstImage,
        bedrooms: typeof p.bedrooms === 'number' ? p.bedrooms : null,
        sqft: typeof p.sqft === 'number' ? p.sqft : null,
        listed_at: p.listed_at || null,
        status: p.listing_status || 'active',
        isVerified: Boolean(p.is_verified),
        type: p.property_type || '',
        views: 0,
        inquiries: 0,
      }
    })

    const res = NextResponse.json({ items })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
