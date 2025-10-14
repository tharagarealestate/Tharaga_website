import { Router } from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { config } from '../config'
import { query } from '../db'

export const billing = Router()

const rz = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })

billing.post('/billing/subscribe', async (req, res, next) => {
  try {
    const orgId = req.user?.orgId || req.user?.id || 'demo'
    const { tier, cycle } = req.body as { tier: 'growth'|'pro'; cycle?: 'monthly'|'yearly' }
    if (!['growth','pro'].includes(tier)) return res.status(400).json({ error:'invalid_tier' })
    const planId = tier === 'growth'
      ? (cycle === 'yearly' ? config.razorpay.plan.growthYearly : config.razorpay.plan.growthMonthly)
      : (cycle === 'yearly' ? config.razorpay.plan.proYearly : config.razorpay.plan.proMonthly)

    const sub = await rz.subscriptions.create({ plan_id: planId, total_count: cycle === 'yearly' ? 12 : 12, notes: { orgId } })
    await query('update orgs set billing_status=$2, raz_sub_id=$3 where id=$1', [orgId, 'pending', sub.id])
    res.json({ subscriptionId: sub.id, short_url: sub.short_url })
  } catch (e) { next(e) }
})

billing.post('/billing/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string
    if (!signature) return res.status(400).end()
    const body = JSON.stringify(req.body)
    const expected = crypto.createHmac('sha256', config.razorpay.webhookSecret).update(body).digest('hex')
    if (expected !== signature) return res.status(401).end()

    const event = req.body?.event as string
    const subId = req.body?.payload?.subscription?.entity?.id || req.body?.payload?.payment?.entity?.subscription_id
    const status = req.body?.payload?.subscription?.entity?.status

    if (event && subId) {
      const { rows } = await query<{ id: string }>('select id from orgs where raz_sub_id=$1', [subId])
      const orgId = rows[0]?.id
      if (orgId) {
        if (event === 'subscription.charged' || event === 'invoice.paid') {
          // Infer tier from plan id
          const planId = req.body?.payload?.subscription?.entity?.plan_id
          const tier = /growth/i.test(planId||'') ? 'growth' : 'pro'
          await query('update orgs set tier=$2, billing_status=$3 where id=$1', [orgId, tier, 'active'])
        }
        if (event === 'payment.failed' || status === 'halted' || status === 'cancelled') {
          // start grace period
          await query('update orgs set billing_status=$2, grace_until = now() + interval \'30 days\' where id=$1', [orgId, 'past_due'])
        }
      }
    }

    // store raw event
    await query('insert into webhook_events(source, payload) values ($1,$2)', ['razorpay', req.body])

    res.json({ ok: true })
  } catch (e) { next(e) }
})
