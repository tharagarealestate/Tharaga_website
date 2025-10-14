import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { logger } from './logger'
import { authOptional } from './middleware/auth'
import { entitlements } from './routes/entitlements'
import { properties } from './routes/properties'
import { leads } from './routes/leads'
import { billing } from './routes/billing'
import { microsite } from './routes/microsite'
import pinoHttp from 'pino-http'

const app = express()
app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use(pinoHttp({ logger }))
app.use(authOptional)

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', entitlements)
app.use('/api', properties)
app.use('/api', leads)
app.use('/api', billing)
app.use('/api', microsite)

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error(err)
  res.status(500).json({ error: 'server_error' })
})

app.listen(config.port, () => logger.info({ port: config.port }, 'saas-server started'))
