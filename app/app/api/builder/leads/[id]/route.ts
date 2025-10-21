import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const id = params.id

  const { data, error } = await supabase
    .from('leads')
    .select('id, created_at, builder_id, property_id, name, email, phone, message, status, score, source, budget, properties!inner(title, location)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const item = {
    id: data.id,
    created_at: data.created_at,
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    status: data.status,
    score: data.score,
    source: data.source,
    budget: data.budget,
    property: { title: (data as any).properties?.title, location: (data as any).properties?.location },
  }

  return NextResponse.json({ item })
}
