// =============================================
// RAZORPAY SUBSCRIPTION CREATION — THARAGA PRO
// Single plan: ₹4,999/month | ₹49,992/year
// Auto-creates Razorpay plan on first call
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Module-level plan ID cache (persists across requests in warm serverless container)
const _planCache: Record<string, string> = {}

function getRazorpay(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

/**
 * Get or create a Razorpay Plan for Tharaga Pro.
 * Priority: env var → module cache → create new plan in Razorpay
 */
async function getOrCreatePlanId(billing_cycle: 'monthly' | 'yearly'): Promise<string> {
  const isYearly = billing_cycle === 'yearly'
  const envKey = isYearly ? 'RZP_PLAN_PRO_ANNUAL' : 'RZP_PLAN_PRO_MONTHLY'

  // 1. Env var (fastest path — set after first run)
  if (process.env[envKey]) return process.env[envKey]!

  // 2. Module-level cache (within same process lifetime)
  if (_planCache[billing_cycle]) return _planCache[billing_cycle]

  // 3. Create plan programmatically in Razorpay
  const rzp = getRazorpay()
  const plan = await (rzp.plans as any).create({
    period: isYearly ? 'yearly' : 'monthly',
    interval: 1,
    item: {
      name: isYearly ? 'Tharaga Pro (Annual)' : 'Tharaga Pro',
      amount: isYearly ? 4999200 : 499900, // paise: ₹49,992 | ₹4,999
      currency: 'INR',
      description: isYearly
        ? 'Tharaga Pro Annual — Everything Unlimited. Save 17%.'
        : 'Tharaga Pro — Everything Unlimited. Chennai\'s #1 Builder Platform.',
    },
    notes: {
      plan_type: 'tharaga_pro',
      billing_cycle,
    },
  })

  _planCache[billing_cycle] = plan.id

  // Log for operator to set in env (avoids recreating on cold starts)
  console.log(
    `✅ Razorpay plan created: ${plan.id}\n` +
    `   Add to .env: ${envKey}=${plan.id}`
  )

  return plan.id
}

export async function POST(req: NextRequest) {
  // Validate Razorpay credentials
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const billing_cycle: 'monthly' | 'yearly' =
      body.billing_cycle === 'yearly' ? 'yearly' : 'monthly'

    const rzp = getRazorpay()

    // ─── Create or reuse Razorpay customer ───────────────────────────────────
    let customer_id: string | undefined
    try {
      const { data: existingSub } = await supabase
        .from('builder_subscriptions')
        .select('razorpay_customer_id')
        .eq('builder_id', user.id)
        .not('razorpay_customer_id', 'is', null)
        .maybeSingle()

      if (existingSub?.razorpay_customer_id) {
        customer_id = existingSub.razorpay_customer_id
      } else {
        const cust = await (rzp.customers as any).create({
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split('@')[0],
          email: user.email!,
          contact: user.user_metadata?.phone || '',
          notes: { builder_id: user.id },
        })
        customer_id = cust.id
      }
    } catch (e) {
      console.warn('[Razorpay] Customer upsert failed (continuing):', e)
    }

    // ─── Get or create plan ───────────────────────────────────────────────────
    const plan_id = await getOrCreatePlanId(billing_cycle)

    // ─── Create subscription ──────────────────────────────────────────────────
    const subscription = await (rzp.subscriptions as any).create({
      plan_id,
      customer_id,
      customer_notify: 1,
      quantity: 1,
      total_count: billing_cycle === 'yearly' ? 10 : 120, // 10 years max
      notes: {
        builder_id: user.id,
        user_id: user.id,
        email: user.email,
        plan: 'tharaga_pro',
        billing_cycle,
      },
    })

    // ─── Persist to builder_subscriptions ────────────────────────────────────
    await supabase
      .from('builder_subscriptions')
      .upsert(
        {
          builder_id: user.id,
          razorpay_subscription_id: subscription.id,
          razorpay_customer_id: customer_id,
          razorpay_plan_id: plan_id,
          tier: 'trial',          // Stays trial until payment is verified
          status: 'created',
          billing_cycle,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'builder_id' }
      )
      .then(({ error }) => {
        if (error) console.warn('[Razorpay] DB upsert failed:', error.message)
      })

    return NextResponse.json({
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        contact: user.user_metadata?.phone || '',
      },
    })
  } catch (error: any) {
    console.error('[Razorpay] create-subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
