const Stripe = require('stripe');

exports.handler = async (event) => {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripe = Stripe(stripeSecret)

  let sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  let evt
  try {
    evt = stripe.webhooks.constructEvent(event.body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripeWebhook] signature verification failed', err)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    switch (evt.type) {
      case 'checkout.session.completed': {
        const session = evt.data.object
        await upsertEntitlement({
          email: session.customer_details?.email,
          customer_id: session.customer,
          price_id: session?.line_items?.data?.[0]?.price?.id || null,
          status: 'active',
          tier: deriveTierFromPrice(session)
        })
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = evt.data.object
        await upsertEntitlement({
          email: sub?.metadata?.email || null,
          customer_id: sub.customer,
          price_id: sub.items?.data?.[0]?.price?.id || null,
          status: sub.status,
          tier: deriveTierFromPrice(sub)
        })
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('[stripeWebhook] handler error', e)
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}

function deriveTierFromPrice(obj){
  try {
    const id = obj?.items?.data?.[0]?.price?.id || obj?.line_items?.data?.[0]?.price?.id || ''
    if (!id) return 'growth'
    if (/scale/i.test(id)) return 'scale'
    return 'growth'
  } catch { return 'growth' }
}

async function upsertEntitlement(payload){
  try {
    const { createClient } = require('@supabase/supabase-js')
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) { console.warn('[entitlement] missing supabase env'); return }
    const sb = createClient(url, key)

    const email = payload.email || null
    const tier = payload.tier || 'growth'
    const status = payload.status || 'active'
    const stripe_customer_id = payload.customer_id || null
    const stripe_price_id = payload.price_id || null

    await sb.from('org_subscriptions').upsert({
      email, tier, status, stripe_customer_id, stripe_price_id
    }, { onConflict: 'email' })

    console.log('[entitlement] upserted', email, tier, status)
  } catch (e) {
    console.error('[entitlement] failed', e)
  }
}
