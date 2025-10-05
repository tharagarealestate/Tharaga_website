const Razorpay = require('razorpay')

function json(body, code=200){ return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    const plan_growth_monthly = process.env.RZP_PLAN_GROWTH
    const plan_scale_monthly = process.env.RZP_PLAN_SCALE
    const plan_growth_annual = process.env.RZP_PLAN_GROWTH_ANNUAL
    const plan_scale_annual = process.env.RZP_PLAN_SCALE_ANNUAL
    if (!key_id || !key_secret || !plan_growth_monthly || !plan_scale_monthly) return json({ error: 'Razorpay env missing' }, 500)

    const rzp = new Razorpay({ key_id, key_secret })
    const body = JSON.parse(event.body || '{}')
    const { plan = 'growth', annual = false, email = null, phone = null, customer = {}, notes = {} } = body

    const plan_id = (function(){
      if (plan === 'scale') return annual ? (plan_scale_annual || plan_scale_monthly) : plan_scale_monthly
      return annual ? (plan_growth_annual || plan_growth_monthly) : plan_growth_monthly
    })()

    // Create or get customer
    let customer_id = customer.id || null
    if (!customer_id) {
      const cust = await rzp.customers.create({ name: customer.name || '', email: email || customer.email || '', contact: phone || customer.contact || '', notes })
      customer_id = cust.id
    }

    // Create subscription
    const subscription = await rzp.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: annual ? 12 : 1, // For monthly plans, total_count=1 (auto-renew); for annual, set appropriate count
      customer_id,
      notes
    })

    return json({ id: subscription.id, short_url: subscription.short_url, status: subscription.status, customer_id })
  } catch (e) {
    console.error('[razorpayCreateSubscription] error', e)
    return json({ error: 'rzp_failed' }, 500)
  }
}
