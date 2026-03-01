import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('events')
    .select('event_name, user_id, event_data, created_at')
    .in('event_name', ['signup_completed', 'trial_started', 'property_listed', 'lead_created', 'trial_converted'])
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map((r:any) => ({
    event_name: r.event_name,
    user_id: r.user_id,
    event_data: r.event_data,
    created_at: r.created_at,
  })))
}
