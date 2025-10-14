import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'

export type AuthUser = { id: string; email?: string; orgId?: string }

declare global { namespace Express { interface Request { user?: AuthUser } } }

export function authOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ') && config.jwt.supabaseJwtSecret) {
    try {
      const token = header.slice(7)
      const payload: any = jwt.verify(token, config.jwt.supabaseJwtSecret)
      req.user = { id: payload.sub || payload.user_id || 'user', email: payload.email, orgId: payload.org_id }
    } catch (_) {
      // ignore invalid tokens; treated as anonymous
    }
  }
  // Dev/demo support via header
  if (!req.user && typeof req.headers['x-demo-user'] === 'string') {
    const email = String(req.headers['x-demo-user'])
    req.user = { id: email, email }
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'auth_required' })
  }
  next()
}
