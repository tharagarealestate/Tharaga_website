const Stripe = require('stripe');

function json(body, code=200){ return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) return json({ error: 'Stripe env missing' }, 500)

    const stripe = Stripe(stripeSecret)
    const { customer_id, return_url } = JSON.parse(event.body || '{}')
    if (!customer_id) return json({ error: 'customer_id required' }, 400)

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: return_url || process.env.PORTAL_RETURN_URL || 'https://auth.tharaga.co.in/pricing/'
    })
    return json({ url: session.url })
  } catch (e) {
    console.error('[stripePortal] error', e)
    return json({ error: 'stripe_failed' }, 500)
  }
}
