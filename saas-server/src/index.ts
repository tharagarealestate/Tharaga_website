import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import pino from 'pino'
import { Pool } from 'pg'

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })

const app = express()
app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }))

const port = Number(process.env.PORT || 4000)
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tharaga'

const pool = new Pool({ connectionString: databaseUrl })

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1')
    res.json({ ok: true })
  } catch (e) {
    logger.error({ err: e }, 'db health failed')
    res.status(500).json({ ok: false })
  }
})

// Pricing and gates: simple placeholder; expand later
export type Tier = 'free' | 'growth' | 'pro'
const entitlementsByOrg: Record<string, Tier> = {
  '00000000-0000-0000-0000-000000000001': 'free',
  '00000000-0000-0000-0000-000000000002': 'growth',
  '00000000-0000-0000-0000-000000000003': 'pro',
}

app.get('/api/me/entitlements', (req, res) => {
  const demoOrg = String(req.header('x-demo-org') || '')
  const tier: Tier = (demoOrg && entitlementsByOrg[demoOrg]) || 'free'
  res.json({ org: demoOrg || null, tier, features: tier === 'pro' ? ['workflows'] : tier === 'growth' ? [] : [] })
})

// Properties
app.post('/api/properties', async (req, res) => {
  const { title, description, city } = req.body || {}
  if (!title || !city) return res.status(400).json({ error: 'missing title/city' })
  try {
    const result = await pool.query(
      `insert into properties (title, description, city) values ($1,$2,$3) returning id, title, description, city`,
      [title, description || null, city]
    )
    return res.status(201).json(result.rows[0])
  } catch (e) {
    logger.error({ err: e }, 'create property failed')
    return res.status(500).json({ error: 'db error' })
  }
})

app.get('/api/properties/:id', async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      `select id, title, description, city, images, created_at from properties where id = $1`,
      [id]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'not found' })
    return res.json(result.rows[0])
  } catch (e) {
    logger.error({ err: e }, 'get property failed')
    return res.status(500).json({ error: 'db error' })
  }
})

// Leads
app.post('/api/leads', async (req, res) => {
  const { property_id, name, email, message } = req.body || {}
  if (!property_id || !name || !email) return res.status(400).json({ error: 'missing fields' })
  try {
    const result = await pool.query(
      `insert into leads (property_id, name, email, message) values ($1,$2,$3,$4) returning id`,
      [property_id, name, email, message || null]
    )
    res.json({ id: result.rows[0].id })
  } catch (e) {
    logger.error({ err: e }, 'create lead failed')
    res.status(500).json({ error: 'db error' })
  }
})

// ICS
app.post('/api/calendar/ics', (req, res) => {
  const { title = 'Event', startISO, location = 'TBD' } = req.body || {}
  if (!startISO) return res.status(400).json({ error: 'startISO required' })
  const dt = new Date(startISO)
  const start = dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const uid = `evt-${Date.now()}@tharaga.local`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tharaga//SaaS//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="visit.ics"')
  res.send(ics)
})

app.listen(port, () => {
  logger.info({ port }, 'saas-server listening')
})
