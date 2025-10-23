import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const supabase = getSupabase()
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const { data } = await supabase
    .from('leads')
    .select('score, created_at')
    .gt('created_at', from.toISOString())

  const buckets = [
    { name: 'Hot', key: 'Hot', count: 0, match: (s: number) => s >= 9 },
    { name: 'Warm', key: 'Warm', count: 0, match: (s: number) => s >= 7 && s < 9 },
    { name: 'Developing', key: 'Developing', count: 0, match: (s: number) => s >= 5 && s < 7 },
    { name: 'Cold', key: 'Cold', count: 0, match: (s: number) => s >= 3 && s < 5 },
    { name: 'Low', key: 'Low', count: 0, match: (s: number) => s < 3 },
  ]

  for (const r of data || []) {
    const score = Number((r as any).score || 0)
    for (const b of buckets) if (b.match(score)) { b.count++; break }
  }

  return NextResponse.json(buckets.map(b => ({ category: b.key, count: b.count })))
}
