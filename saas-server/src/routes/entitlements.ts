import { Router } from 'express'
import { query } from '../db'
import { TIERS } from '../pricing'
import { config } from '../config'

export const entitlements = Router()

entitlements.get('/me/entitlements', async (req, res, next) => {
  try {
    const orgId = (req.user?.orgId || req.user?.id || 'demo')
    // Ensure org exists (demo-friendly)
    await query('insert into orgs(id, name, tier) values ($1, $2, $3) on conflict (id) do nothing', [orgId, req.user?.email || 'Demo Org', 'free'])

    const { rows } = await query('select tier, trial_ends_at, grace_until from orgs where id=$1', [orgId])
    const tier = (rows[0]?.tier as keyof typeof TIERS) || 'free'
    const ent = TIERS[tier]
    const today = new Date()
    const trialActive = rows[0]?.trial_ends_at && new Date(rows[0].trial_ends_at) > today

    res.json({
      orgId,
      tier,
      trialActive: !!trialActive,
      trialEndsAt: rows[0]?.trial_ends_at,
      graceUntil: rows[0]?.grace_until,
      entitlements: ent
    })
  } catch (e) { next(e) }
})

// Admin usage snapshot
entitlements.get('/admin/usage', async (_req, res, next) => {
  try {
    const { rows } = await query('select u.org_id, o.name, o.tier, u.period_month, u.leads_count, u.listings_count from usage_counters u join orgs o on o.id=u.org_id order by u.updated_at desc nulls last limit 200')
    res.json({ rows })
  } catch (e) { next(e) }
})
