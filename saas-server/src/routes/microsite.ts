import { Router } from 'express'
import { query } from '../db'

export const microsite = Router()

microsite.get('/microsite/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const { rows } = await query('select id, title, city, seo_summary, images from properties where id=$1', [id])
    if (!rows[0]) return res.status(404).end()
    res.json(rows[0])
  } catch (e) { next(e) }
})
