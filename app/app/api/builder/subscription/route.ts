import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ tier: 'trial', trial_leads_used: 0, days_remaining: 14, builder_name: null }, { status: 200 })

    // Fetch builder profile for unique dashboard name
    let builder_name = null
    try {
      const { data: builderProfile } = await supabase
        .from('builder_profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .maybeSingle()
      builder_name = builderProfile?.company_name || null
    } catch {}

    // Fallback to user profile name if builder profile not found
    if (!builder_name) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, company_name, full_name')
          .eq('id', user.id)
          .maybeSingle()
        builder_name = profile?.company_name || profile?.name || profile?.full_name || user.email?.split('@')[0] || 'Builder'
      } catch {}
    }

    // Read the subscription row
    const { data: sub } = await supabase
      .from('builder_subscriptions')
      .select('tier, status, trial_started_at, trial_expires_at')
      .eq('builder_id', user.id)
      .maybeSingle()

    // Derive days remaining
    let days_remaining = 0
    let is_trial_expired = false
    if (sub?.trial_expires_at) {
      const now = Date.now()
      const exp = new Date(sub.trial_expires_at).getTime()
      days_remaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)))
      is_trial_expired = days_remaining === 0 && (sub?.tier === 'trial' || !sub?.tier)
    }

    // Optionally compute trial leads used from leads table
    let trial_leads_used = 0
    try {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', user.id)
        .gte('created_at', sub?.trial_started_at || new Date(0).toISOString())
      trial_leads_used = count || 0
    } catch {}

    // Determine final tier and status
    const final_tier = (sub?.tier && sub.tier !== 'trial') ? sub.tier : (is_trial_expired ? 'trial_expired' : 'trial')
    const final_status = is_trial_expired ? 'expired' : (sub?.status || 'active')

    return NextResponse.json({
      tier: final_tier,
      status: final_status,
      days_remaining,
      trial_leads_used,
      builder_name, // Unique builder name for dashboard personalization
      is_trial_expired, // Flag for frontend to show upgrade prompts
    })
  } catch {
    return NextResponse.json({ tier: 'trial', trial_leads_used: 0, days_remaining: 14, builder_name: null }, { status: 200 })
  }
}

