import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser } from '../_lib/auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const authed = await getBuilderUser(req)

    // Subscription data is best-effort — return trial defaults if auth fails
    if (!authed) {
      return NextResponse.json({ tier: 'trial', trial_leads_used: 0, days_remaining: 14, builder_name: null })
    }

    const { user, serviceClient: svc } = authed

    // Fetch builder profile for dashboard name
    let builder_name: string | null = null
    try {
      const { data: bp } = await svc.from('builder_profiles').select('company_name').eq('user_id', user.id).maybeSingle()
      builder_name = bp?.company_name || null
    } catch {}

    if (!builder_name) {
      try {
        const { data: profile } = await svc.from('profiles').select('name, company_name, full_name').eq('id', user.id).maybeSingle()
        builder_name = profile?.company_name || profile?.name || profile?.full_name || user.email?.split('@')[0] || 'Builder'
      } catch {}
    }

    // Column is trial_ends_at (NOT trial_expires_at — that column doesn't exist)
    const { data: sub } = await svc.from('builder_subscriptions').select('tier, status, trial_started_at, trial_ends_at').eq('builder_id', user.id).maybeSingle()

    let days_remaining = 14
    let is_trial_expired = false
    const trial_expiry = sub?.trial_ends_at
    if (trial_expiry) {
      const exp = new Date(trial_expiry).getTime()
      days_remaining = Math.max(0, Math.ceil((exp - Date.now()) / 86400000))
      is_trial_expired = days_remaining === 0 && (!sub?.tier || sub.tier === 'trial')
    }

    let trial_leads_used = 0
    try {
      const { count } = await svc.from('leads').select('*', { count: 'exact', head: true })
        .eq('builder_id', user.id)
        .gte('created_at', sub?.trial_started_at || new Date(0).toISOString())
      trial_leads_used = count || 0
    } catch {}

    const final_tier = (sub?.tier && sub.tier !== 'trial') ? sub.tier : (is_trial_expired ? 'trial_expired' : 'trial')
    const final_status = is_trial_expired ? 'expired' : (sub?.status || 'active')

    return NextResponse.json({ tier: final_tier, status: final_status, days_remaining, trial_leads_used, builder_name, is_trial_expired })
  } catch {
    return NextResponse.json({ tier: 'trial', trial_leads_used: 0, days_remaining: 14, builder_name: null })
  }
}
