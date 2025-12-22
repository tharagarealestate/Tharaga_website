// Enhanced rate limiting with database backing for production
// Falls back to in-memory for development

import { getSupabase } from '../supabase'
import { getClientIp } from './auth'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  identifier: string // IP, email, user_id, etc.
  endpoint?: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Database-backed rate limiting
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = getSupabase()
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  try {
    // Check existing records
    const { data: records, error } = await supabase
      .from('rate_limit_records')
      .select('*')
      .eq('identifier', config.identifier)
      .eq('endpoint', config.endpoint || 'default')
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Rate limit check error:', error)
      // Fail open - allow request if DB error
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: now.getTime() + config.windowMs
      }
    }

    const requestCount = records?.length || 0

    if (requestCount >= config.maxRequests) {
      // Rate limit exceeded
      const oldestRecord = records?.[records.length - 1]
      const resetAt = oldestRecord
        ? new Date(new Date(oldestRecord.created_at).getTime() + config.windowMs).getTime()
        : now.getTime() + config.windowMs

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now.getTime()) / 1000)
      }
    }

    // Record this request
    await supabase.from('rate_limit_records').insert({
      identifier: config.identifier,
      endpoint: config.endpoint || 'default',
      created_at: now.toISOString()
    })

    // Cleanup old records (async, don't wait)
    cleanupOldRecords(supabase).catch(console.error)

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount - 1,
      resetAt: now.getTime() + config.windowMs
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now.getTime() + config.windowMs
    }
  }
}

/**
 * Cleanup old rate limit records
 */
async function cleanupOldRecords(supabase: any): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
  await supabase
    .from('rate_limit_records')
    .delete()
    .lt('created_at', cutoff.toISOString())
}

/**
 * Rate limit wrapper for Next.js API routes
 */
export async function withRateLimitWrapper(
  request: Request,
  handler: () => Promise<Response>,
  config: {
    windowMs?: number
    maxRequests?: number
    identifier?: string
    endpoint?: string
  } = {}
): Promise<Response> {
  const ip = getClientIp(request as any)
  const identifier = config.identifier || ip
  const endpoint = config.endpoint || new URL(request.url).pathname

  const rateLimitConfig: RateLimitConfig = {
    windowMs: config.windowMs || 60000, // 1 minute default
    maxRequests: config.maxRequests || 100,
    identifier,
    endpoint
  }

  const result = await checkRateLimit(rateLimitConfig)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter || 60),
          'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
        }
      }
    )
  }

  const response = await handler()

  // Add rate limit headers to response
  response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.maxRequests))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString())

  return response
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // General API rate limiting
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  // Strict rate limiting for sensitive endpoints
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20
  },
  // Lead submission rate limiting
  leadSubmission: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10
  },
  // Authentication rate limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },
  // OTP rate limiting
  otp: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3
  },
  // Password reset rate limiting
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3
  }
}

