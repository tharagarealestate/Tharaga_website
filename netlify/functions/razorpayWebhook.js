const Razorpay = require('razorpay')
const crypto = require('crypto')

exports.handler = async (event) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    const signature = event.headers['x-razorpay-signature']
    const body = event.body || ''

    const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
    if (expected !== signature) {
      return { statusCode: 400, body: 'Invalid signature' }
    }

    const payload = JSON.parse(body || '{}')
    const type = payload?.event

    // Normalize core fields
    let email = null, subscription_id = null, status = null, tier = 'growth'
    try {
      if (type && type.startsWith('subscription.')) {
        const sub = payload.payload?.subscription?.entity
        subscription_id = sub?.id || null
        status = sub?.status || null
      }
      const cust = payload.payload?.customer?.entity || payload.payload?.payment?.entity
      email = cust?.email || null
    } catch(_){ }

    await upsertEntitlement({
      provider: 'razorpay',
      email,
      status,
      tier,
      subscription_id
    })

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (e) {
    console.error('[razorpayWebhook] error', e)
    return { statusCode: 500, body: 'error' }
  }
}

async function upsertEntitlement(payload){
  try {
    const { createClient } = require('@supabase/supabase-js')
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) { console.warn('[entitlement] missing supabase env'); return }
    const sb = createClient(url, key)

    const { email, status, subscription_id, provider, tier } = payload
    if (!email) return

    await sb.from('org_subscriptions').upsert({
      email,
      status: status || 'active',
      stripe_customer_id: null,
      stripe_price_id: null,
      tier: tier || 'growth',
      provider: provider || 'razorpay',
      subscription_id: subscription_id || null
    }, { onConflict: 'email' })
  } catch (e) {
    console.error('[entitlement] failed', e)
  }
}
