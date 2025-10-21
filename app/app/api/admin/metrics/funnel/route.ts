import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const supabase = getSupabase()
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: events }, { data: pageViews }] = await Promise.all([
    supabase.from('events').select('event_name, user_id, created_at').gt('created_at', from),
    supabase.from('page_views').select('user_id, created_at').gt('created_at', from),
  ])

  const visitors = new Set<string>()
  for (const pv of pageViews || []) if ((pv as any).user_id) visitors.add((pv as any).user_id)

  function distinctCount(name: string) {
    const set = new Set<string>()
    for (const e of events || []) if ((e as any).event_name === name && (e as any).user_id) set.add((e as any).user_id)
    return set.size
  }

  const stages = [
    { stage: 'Visitor', count: visitors.size },
    { stage: 'Signup', count: distinctCount('signup_completed') },
    { stage: 'Trial', count: distinctCount('trial_started') },
    { stage: 'Property Listed', count: distinctCount('property_listed') },
    { stage: 'Lead Received', count: distinctCount('lead_received') },
    { stage: 'Converted', count: distinctCount('trial_converted') },
  ]

  return NextResponse.json(stages)
}
