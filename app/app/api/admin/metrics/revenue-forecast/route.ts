import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const supabase = getSupabase()

  // Approximate expected value from current pipeline (exclude closed states)
  const { data: leads } = await supabase
    .from('leads')
    .select('status, property_id')
    .not('status', 'in', '("closed_won","closed_lost")')

  const { data: properties } = await supabase
    .from('properties')
    .select('id, price')

  const priceById = new Map<string, number>()
  for (const p of properties || []) {
    const pid = (p as any).id as string
    const price = Number((p as any).price ?? (p as any).price_inr ?? 0)
    priceById.set(pid, price)
  }

  function expectedValue(status: string, price: number): number {
    switch (status) {
      case 'new': return price * 0.1
      case 'contacted': return price * 0.3
      case 'site_visit': return price * 0.5
      case 'negotiation': return price * 0.7
      default: return 0
    }
  }

  const totalExpected = (leads || []).reduce((sum, l: any) => sum + expectedValue(l.status, priceById.get(l.property_id) || 0), 0)

  // Simple 3-month projection with different confidence bands
  const now = new Date()
  const months = [0, 1, 2].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' })
    const realistic = totalExpected / 3
    const pessimistic = realistic * 0.8
    const optimistic = realistic * 1.2
    return { month: label, pessimistic, realistic, optimistic }
  })

  return NextResponse.json(months)
}
