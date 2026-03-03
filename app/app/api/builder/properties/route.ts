import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// nodejs runtime so createRouteHandlerClient can read cookies
export const runtime = 'nodejs'

const ADMIN_EMAIL = 'tharagarealestate@gmail.com'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(req: NextRequest) {
  try {
    // Cookie-based auth client for user identity
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = (user.email || '') === ADMIN_EMAIL

    // Use service role client to bypass RLS for the data query
    const serviceClient = getServiceSupabase()

    let query = serviceClient
      .from('properties')
      .select('id,title,city,locality,price_inr,images,bedrooms,sqft,listed_at,listing_status,builder_id,is_verified,property_type')
      .order('listed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Admin sees all properties; builder sees only their own
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
    res.headers.set('Cache-Control', 'private, no-store')
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
