import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { getSupabase } from '@/lib/supabase'

type Leader = {
  name: string
  company_name: string | null
  properties_listed: number
  total_leads: number
  deals_closed: number
  total_revenue: number | null
}

export async function GET(_req: NextRequest) {
  const supabase = getSupabase()

  const [{ data: profiles }, { data: properties }, { data: leads }] = await Promise.all([
    supabase.from('profiles').select('id, name, company_name, role').eq('role', 'builder'),
    supabase.from('properties').select('id, builder_id, price, price_inr'),
    supabase.from('leads').select('id, property_id, status'),
  ])

  const propsByBuilder = new Map<string, Array<{ id: string; price: number }>>()
  for (const p of properties || []) {
    const pid = (p as any).id as string
    const bid = (p as any).builder_id as string
    const price = Number((p as any).price ?? (p as any).price_inr ?? 0)
    if (!propsByBuilder.has(bid)) propsByBuilder.set(bid, [])
    propsByBuilder.get(bid)!.push({ id: pid, price })
  }

  const leadsByProp = new Map<string, Array<{ id: string; status: string }>>()
  for (const l of leads || []) {
    const pid = (l as any).property_id as string
    if (!leadsByProp.has(pid)) leadsByProp.set(pid, [])
    leadsByProp.get(pid)!.push({ id: (l as any).id as string, status: (l as any).status as string })
  }

  const rows: Leader[] = []
  for (const pr of profiles || []) {
    const bid = (pr as any).id as string
    const props = propsByBuilder.get(bid) || []
    let totalLeads = 0
    let dealsClosed = 0
    let revenue = 0
    for (const prop of props) {
      const ls = leadsByProp.get(prop.id) || []
      totalLeads += ls.length
      const closed = ls.filter((x) => x.status === 'closed_won').length
      dealsClosed += closed
      if (closed > 0) revenue += prop.price
    }
    rows.push({
      name: (pr as any).name as string,
      company_name: ((pr as any).company_name as string) ?? null,
      properties_listed: props.length,
      total_leads: totalLeads,
      deals_closed: dealsClosed,
      total_revenue: revenue || null,
    })
  }

  rows.sort((a, b) => b.deals_closed - a.deals_closed)
  return NextResponse.json(rows.slice(0, 10))
}
