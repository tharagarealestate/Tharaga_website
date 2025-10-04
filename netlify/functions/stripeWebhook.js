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
        // TODO: map to Supabase user/org by email or metadata
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        // TODO: update entitlements in Supabase (tier/active_until)
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
