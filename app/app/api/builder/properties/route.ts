import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Use nodejs runtime so createRouteHandlerClient can read cookies
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
    // Use cookie-based auth client — works correctly in nodejs runtime
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin email gets full access across all builders
    const isAdmin = user.email === 'tharagarealestate@gmail.com'
    const builderId = user.id

    // Use service role client for the data query to bypass RLS
    const serviceClient = getServiceSupabase()

    let query = serviceClient
      .from('properties')
      .select('id,title,city,locality,price_inr,images,bedrooms,sqft,listed_at,listing_status,builder_id')
      .order('listed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('builder_id', builderId)
    }

    const { data, error } = await query

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
      views: 0,
      inquiries: 0,
    }))

    const res = NextResponse.json({ items })
    res.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60')
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
