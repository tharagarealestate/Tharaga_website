import type { Request, Response, NextFunction } from 'express'
import { query } from '../db'
import { TIERS } from '../pricing'

// Ensure monthly usage row exists; increment counters; enforce gates
export function trackUsage(kind: 'lead' | 'listing', options?: { softLimit?: boolean }) {
  return async function(req: Request, res: Response, next: NextFunction){
    try {
      const orgId = (req.user?.orgId || req.user?.id || 'demo')
      const now = new Date()
      const period = new Date(now.getFullYear(), now.getMonth(), 1)

      // Ensure org exists (avoid FK errors on usage_counters)
      await query('insert into orgs(id, name, tier) values ($1, $2, $3) on conflict (id) do nothing', [orgId, req.user?.email || 'Demo Org', 'free'])

      await query('insert into usage_counters(org_id, period_month) values ($1, $2) on conflict (org_id, period_month) do nothing', [orgId, period])
      const col = kind === 'lead' ? 'leads_count' : 'listings_count'

      // Fetch org tier
      const { rows: orgRows } = await query<{ tier: string | null }>('select tier from orgs where id=$1', [orgId])
      const tierKey = (orgRows[0]?.tier as keyof typeof TIERS) || 'free'
      const ent = TIERS[tierKey]
      const limit = kind === 'lead' ? ent.monthlyLeadLimit : ent.listingLimit

      // Current counts
      const { rows: usageRows } = await query<{ leads_count: number; listings_count: number }>('select leads_count, listings_count from usage_counters where org_id=$1 and period_month=$2', [orgId, period])
      const current = usageRows[0] || { leads_count: 0, listings_count: 0 }
      const nextVal = (kind === 'lead' ? current.leads_count : current.listings_count) + 1

      if (limit !== null && nextVal > limit) {
        if (options?.softLimit) {
          res.setHeader('X-Over-Limit', kind)
          // still increment but mark overage
          await query(`update usage_counters set ${col} = ${col} + 1, updated_at = now() where org_id=$1 and period_month=$2`, [orgId, period])
          res.locals.overLimit = true
          return next()
        }
        return res.status(402).json({ error: 'quota_exceeded', resource: kind, limit, message: 'Upgrade required to continue' })
      }

      await query(`update usage_counters set ${col} = ${col} + 1, updated_at = now() where org_id=$1 and period_month=$2`, [orgId, period])
      next()
    } catch (e) {
      next(e)
    }
  }
}
