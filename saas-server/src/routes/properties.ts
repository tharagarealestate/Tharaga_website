import { Router } from 'express'
import { z } from 'zod'
import { trackUsage } from '../middleware/usage'
import { query } from '../db'
import { generateSeoSummary } from '../services/openai'

export const properties = Router()

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  city: z.string().optional(),
  locality: z.string().optional(),
  property_type: z.string().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  price_inr: z.number().optional(),
  sqft: z.number().int().optional(),
  images: z.array(z.string().url()).optional()
})

properties.post('/properties', trackUsage('listing'), async (req, res, next) => {
  try {
    const orgId = req.user?.orgId || req.user?.id || 'demo'
    const parse = bodySchema.safeParse(req.body || {})
    if (!parse.success) {
      return res.status(400).json({ error: 'invalid_request', details: parse.error.issues })
    }
    const { title, description, city, locality, property_type, bedrooms, bathrooms, price_inr, sqft, images } = parse.data

    const seo_summary = await generateSeoSummary({ title, city, description })

    const { rows } = await query(
      'insert into properties(org_id, title, description, city, locality, property_type, bedrooms, bathrooms, price_inr, sqft, images, listing_status, seo_summary) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13) returning id',
      [orgId, title, description, city, locality, property_type, bedrooms, bathrooms, price_inr, sqft, JSON.stringify(images || []), 'active', seo_summary]
    )

    res.json({ id: rows[0].id, seo_summary })
  } catch (e) { next(e) }
})
