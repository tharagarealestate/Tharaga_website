import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const supabase = getSupabase()

  // Try join via analytics table if present
  const { data, error } = await supabase
    .from('property_analytics')
    .select('property_id, total_views, total_inquiries, conversion_rate, properties!inner(title, location, price, price_inr)')
    .order('conversion_rate', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = (data || []).map((r: any) => ({
    title: r.properties?.title,
    area: r.properties?.location?.area ?? r.properties?.location?.area ?? null,
    total_views: r.total_views ?? 0,
    total_inquiries: r.total_inquiries ?? 0,
    conversion_rate: Number(r.conversion_rate ?? 0),
    price: r.properties?.price ?? r.properties?.price_inr ?? null,
  }))

  return NextResponse.json(items)
}
