const Stripe = require('stripe');

function json(body, code=200){ return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const priceGrowth = process.env.STRIPE_PRICE_GROWTH
    const priceScale  = process.env.STRIPE_PRICE_SCALE
    if (!stripeSecret || !priceGrowth || !priceScale) return json({ error: 'Stripe env missing' }, 500)

    const stripe = Stripe(stripeSecret)
    const body = JSON.parse(event.body || '{}')

    const { plan = 'growth', email = null, annual = false, success_url, cancel_url, metadata = {} } = body

    const priceId = plan === 'scale' ? priceScale : priceGrowth

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'upi'],
      line_items: [{ price: priceId, quantity: 1, ...(annual ? { price_data: undefined } : {}) }],
      customer_email: email || undefined,
      allow_promotion_codes: true,
      success_url: (success_url || process.env.CHECKOUT_SUCCESS_URL || 'https://auth.tharaga.co.in/pricing/?success=1') + '&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancel_url || process.env.CHECKOUT_CANCEL_URL || 'https://auth.tharaga.co.in/pricing/?canceled=1',
      subscription_data: { metadata },
      metadata,
    })

    return json({ url: session.url })
  } catch (e) {
    console.error('[stripeCheckout] error', e)
    return json({ error: 'stripe_failed' }, 500)
  }
}
