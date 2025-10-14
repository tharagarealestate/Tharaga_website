import { Router } from 'express'
import { query } from '../db'

export const analytics = Router()

analytics.get('/analytics/conversion', async (_req, res, next) => {
  try {
    const { rows } = await query(`
      with base as (
        select o.id as org_id, o.name, o.tier,
               sum(case when l.intent_label = 'high' then 1 else 0 end) as high_intent,
               count(l.id) as leads
        from orgs o
        left join leads l on l.org_id = o.id
        group by 1,2,3
      )
      select *, case when leads > 0 then round(high_intent::numeric / leads, 3) else 0 end as high_intent_rate from base order by high_intent desc nulls last limit 50
    `)
    res.json({ rows })
  } catch (e) { next(e) }
})
