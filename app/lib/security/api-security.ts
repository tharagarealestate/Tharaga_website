// API security utilities and middleware wrappers

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { verifyAuthToken, withAuth, getClientIp, getUserAgent } from './auth'
import { withRateLimitWrapper, rateLimiters } from './rate-limit-enhanced'
import { validateInput } from './validation'
import { logSecurityEvent, AuditActions, AuditResourceTypes } from './audit'
import { hasPermission } from './permissions'
import { z } from 'zod'

/**
 * Secure API route wrapper with authentication, rate limiting, and validation
 */
export function secureApiRoute<T extends z.ZodSchema>(
  handler: (req: NextRequest, user: { id: string; email?: string; role?: string }) => Promise<Response>,
  options: {
    requireAuth?: boolean
    requireRole?: string[]
    requirePermission?: string
    rateLimit?: keyof typeof rateLimiters
    validateSchema?: T
    auditAction?: string
    auditResourceType?: string
  } = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // 1. Rate limiting
      const rateLimitConfig = options.rateLimit
        ? rateLimiters[options.rateLimit]
        : rateLimiters.api

      const rateLimitedHandler = async () => {
        // 2. Authentication - Support both Bearer token and cookie-based auth
        let user: { id: string; email?: string; role?: string } | null = null

        if (options.requireAuth !== false) {
          const authHeader = req.headers.get('authorization')
          
          // Try Bearer token first
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            user = await verifyAuthToken(token)
          } else {
            // Fall back to cookie-based auth (Supabase default for Next.js)
            try {
              user = await withAuth(req)
            } catch (error) {
              // Auth failed
              user = null
            }
          }

          if (!user) {
            // Log failed auth attempt
            await logSecurityEvent(
              req,
              AuditActions.LOGIN_FAILED,
              AuditResourceTypes.AUTH,
              undefined,
              undefined,
              { reason: 'Invalid token or session', ip: getClientIp(req) }
            )

            return NextResponse.json(
              { error: 'Unauthorized', message: 'Invalid or expired authentication' },
              { status: 401 }
            )
          }
        }

        // 3. Role check
        if (options.requireRole && user) {
          const userRoles = user.role ? [user.role] : []
          const hasRequiredRole = options.requireRole.some(role => userRoles.includes(role))

          if (!hasRequiredRole) {
            await logSecurityEvent(
              req,
              'unauthorized_role_access',
              AuditResourceTypes.AUTH,
              undefined,
              user.id,
              { requiredRoles: options.requireRole, userRole: user.role }
            )

            return NextResponse.json(
              { error: 'Forbidden', message: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        // 4. Permission check
        if (options.requirePermission && user) {
          const hasPerm = await hasPermission(user.id, options.requirePermission)
          if (!hasPerm) {
            await logSecurityEvent(
              req,
              'unauthorized_permission_access',
              AuditResourceTypes.AUTH,
              undefined,
              user.id,
              { requiredPermission: options.requirePermission }
            )

            return NextResponse.json(
              { error: 'Forbidden', message: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        // 5. Input validation
        if (options.validateSchema) {
          const body = await req.json().catch(() => ({}))
          const validation = await validateInput(options.validateSchema, body)

          if (!validation.success) {
            return NextResponse.json(
              { error: 'Validation failed', details: validation.error },
              { status: 400 }
            )
          }
        }

        // 6. Execute handler
        const response = await handler(req, user || { id: 'anonymous' })

        // 7. Audit logging
        if (options.auditAction && user) {
          await logSecurityEvent(
            req,
            options.auditAction,
            options.auditResourceType || AuditResourceTypes.AUTH,
            undefined,
            user.id
          )
        }

        return response
      }

      return await withRateLimitWrapper(
        req,
        rateLimitedHandler,
        {
          windowMs: rateLimitConfig.windowMs,
          maxRequests: rateLimitConfig.maxRequests,
          endpoint: new URL(req.url).pathname
        }
      )
    } catch (error: any) {
      console.error('API route error:', error)
      return NextResponse.json(
        { error: 'Internal server error', message: error.message || 'An unexpected error occurred' },
        { status: 500 }
      )
    }
  }
}

/**
 * CORS configuration for API routes
 */
export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'https://tharaga.co.in',
    'https://www.tharaga.co.in',
    'https://app.tharaga.co.in',
    'http://localhost:3000',
    'http://localhost:3001'
  ]

  const requestOrigin = origin || ''
  const isAllowed = allowedOrigins.includes(requestOrigin) || requestOrigin.includes('localhost')

  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export function handleCORS(req: NextRequest): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || ''
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin)
    })
  }
  return null
}




