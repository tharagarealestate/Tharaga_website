const Stripe = require('stripe');

function json(body, code=200){ return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) return json({ error: 'Stripe env missing' }, 500)

    const stripe = Stripe(stripeSecret)
    const { customer_id, email, return_url } = JSON.parse(event.body || '{}')
    let customerId = customer_id
    if (!customerId && email) {
      const list = await stripe.customers.list({ email, limit: 1 })
      customerId = list?.data?.[0]?.id || null
    }
    if (!customerId) return json({ error: 'customer not found' }, 400)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || process.env.PORTAL_RETURN_URL || 'https://auth.tharaga.co.in/pricing/'
    })
    return json({ url: session.url })
  } catch (e) {
    console.error('[stripePortal] error', e)
    return json({ error: 'stripe_failed' }, 500)
  }
}
