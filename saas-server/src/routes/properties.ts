import { Router } from 'express'
import { trackUsage } from '../middleware/usage'
import { query } from '../db'
import { generateSeoSummary } from '../services/openai'

export const properties = Router()

properties.post('/properties', trackUsage('listing'), async (req, res, next) => {
  try {
    const orgId = req.user?.orgId || req.user?.id || 'demo'
    const { title, description, city, locality, property_type, bedrooms, bathrooms, price_inr, sqft, images } = req.body || {}

    const seo_summary = await generateSeoSummary({ title, city, description })

    const { rows } = await query(
      'insert into properties(org_id, title, description, city, locality, property_type, bedrooms, bathrooms, price_inr, sqft, images, listing_status, seo_summary) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id',
      [orgId, title, description, city, locality, property_type, bedrooms, bathrooms, price_inr, sqft, images || [], 'active', seo_summary]
    )

    res.json({ id: rows[0].id, seo_summary })
  } catch (e) { next(e) }
})
