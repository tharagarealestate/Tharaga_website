// In-memory rate limiter for API endpoints
// For production, consider using Redis or a database-backed solution

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RequestRecord {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map()
  public config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  private getKey(identifier: string): string {
    return identifier
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const key = this.getKey(identifier)
    const now = Date.now()
    
    let record = this.requests.get(key)
    
    // If no record or window expired, create new record
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      this.requests.set(key, record)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: record.resetTime
      }
    }
    
    // Increment count
    record.count++
    
    const allowed = record.count <= this.config.maxRequests
    const remaining = Math.max(0, this.config.maxRequests - record.count)
    
    return {
      allowed,
      remaining,
      resetAt: record.resetTime
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
})

export const strictApiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20 // 20 requests per minute
})

export const leadSubmissionRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10 // 10 submissions per hour
})

/**
 * Rate limit helper for Next.js API routes
 */
export function withRateLimit(rateLimiter: RateLimiter) {
  return async (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.socket?.remoteAddress || 
               'unknown'
    
    const result = rateLimiter.check(ip)
    
    if (!result.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      })
      return
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimiter.config.maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString())
    
    if (next) next()
  }
}

