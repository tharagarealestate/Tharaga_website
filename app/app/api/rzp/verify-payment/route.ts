// =============================================
// RAZORPAY PAYMENT VERIFICATION
// Verifies HMAC signature from Razorpay checkout
// Upgrades builder tier to 'pro' on success
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body

    // All three are required for subscription payment verification
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      )
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
    }

    // ─── HMAC Signature Verification ─────────────────────────────────────────
    // Formula: HMAC-SHA256(payment_id + '|' + subscription_id, key_secret)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('[Razorpay] Signature mismatch', {
        expected: expectedSignature.substring(0, 8) + '...',
        received: razorpay_signature?.substring(0, 8) + '...',
      })
      return NextResponse.json(
        { error: 'Invalid payment signature. Payment cannot be verified.' },
        { status: 400 }
      )
    }

    // ─── Signature valid — upgrade builder to Pro ─────────────────────────────
    // Use service role to bypass RLS
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()
    const periodEnd = new Date(now)

    // Detect billing cycle from existing subscription record
    const { data: existingSub } = await svc
      .from('builder_subscriptions')
      .select('billing_cycle')
      .eq('builder_id', user.id)
      .maybeSingle()

    const isYearly = existingSub?.billing_cycle === 'yearly'
    if (isYearly) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Update subscription to active Pro
    const { error: updateError } = await svc
      .from('builder_subscriptions')
      .upsert(
        {
          builder_id: user.id,
          razorpay_subscription_id,
          tier: 'pro',
          status: 'active',
          trial_ends_at: now.toISOString(),       // End trial immediately on paid activation
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          activated_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'builder_id' }
      )

    if (updateError) {
      console.error('[Razorpay] DB update failed:', updateError.message)
      // Don't fail — payment was already captured. Log it.
    }

    // ─── Log payment in payment_history ───────────────────────────────────────
    await svc
      .from('payment_history')
      .insert({
        builder_id: user.id,
        razorpay_payment_id,
        razorpay_subscription_id,
        amount: isYearly ? 4999200 : 499900,
        currency: 'INR',
        status: 'captured',
        payment_method: 'razorpay_subscription',
        razorpay_response: body,
        paid_at: now.toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn('[Razorpay] Payment history log failed:', error.message)
      })

    // ─── Log subscription event ───────────────────────────────────────────────
    await svc
      .from('subscription_events')
      .insert({
        builder_id: user.id,
        event_type: 'subscription_activated',
        triggered_by: 'frontend_checkout',
        event_data: {
          razorpay_payment_id,
          razorpay_subscription_id,
          billing_cycle: existingSub?.billing_cycle || 'monthly',
        },
      })
      .then(({ error }) => {
        if (error) console.warn('[Razorpay] Event log failed:', error.message)
      })

    return NextResponse.json({
      success: true,
      tier: 'pro',
      message: 'Welcome to Tharaga Pro! Your subscription is now active.',
    })
  } catch (error: any) {
    console.error('[Razorpay] verify-payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
