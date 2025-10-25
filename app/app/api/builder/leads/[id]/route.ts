import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const id = params.id

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const status = String(payload?.status || '').trim()
  const allowedStatuses = new Set(['new', 'contacted', 'site_visit', 'negotiation', 'closed_won'])
  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .select('id, created_at, builder_id, property_id, name, email, phone, message, status, score, source, budget, properties!inner(title, location)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
