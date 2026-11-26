// Supabase Edge Function for auth rate limiting
// Deploy with: supabase functions deploy auth-rate-limit

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface RateLimitConfig {
  windowMinutes: number
  maxAttempts: number
}

interface AttemptRecord {
  ip_address: string
  email?: string
  endpoint: string
  timestamp: string
}

// Helper to get IP from request
function getIpAddress(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown'
}

// Helper to check rate limits
async function checkRateLimit(
  ipAddress: string,
  email: string | undefined,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000)
  
  // Query attempts in the window
  let query = supabase
    .from('auth_rate_limits')
    .select('*')
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('timestamp', windowStart.toISOString())
  
  if (email) {
    query = query.eq('email', email)
  }
  
  const { data, error } = await query
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Rate limit query error:', error)
    // Fail open in case of DB errors to avoid blocking legitimate users
    return { allowed: true, remaining: config.maxAttempts }
  }
  
  const attempts = data?.length || 0
  const remaining = Math.max(0, config.maxAttempts - attempts)
  
  return {
    allowed: attempts < config.maxAttempts,
    remaining
  }
}

// Helper to record an attempt
async function recordAttempt(
  ipAddress: string,
  email: string | undefined,
  endpoint: string
): Promise<void> {
  await supabase.from('auth_rate_limits').insert({
    ip_address: ipAddress,
    email: email || null,
    endpoint,
    timestamp: new Date().toISOString()
  })
}

// Clean up old attempts (older than 24 hours)
async function cleanupOldAttempts(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  await supabase
    .from('auth_rate_limits')
    .delete()
    .lt('timestamp', oneDayAgo.toISOString())
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }
  
  try {
    const body = await req.json()
    const { action, email } = body
    
    const ipAddress = getIpAddress(req)
    
    // Determine endpoint and config based on action
    let config: RateLimitConfig
    let endpoint: string
    
    switch (action) {
      case 'login':
        endpoint = 'login'
        config = { windowMinutes: 15, maxAttempts: 5 }
        break
      case 'otp':
        endpoint = 'otp'
        config = { windowMinutes: 60, maxAttempts: 3 }
        break
      case 'password_reset':
        endpoint = 'password_reset'
        config = { windowMinutes: 60, maxAttempts: 3 }
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }
    
    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(ipAddress, email, endpoint, config)
    
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          remaining: 0,
          retryAfter: config.windowMinutes * 60
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(config.windowMinutes * 60)
          } 
        }
      )
    }
    
    // Record this attempt
    await recordAttempt(ipAddress, email, endpoint)
    
    // Periodic cleanup (every 100 requests to avoid overhead)
    if (Math.random() < 0.01) {
      cleanupOldAttempts().catch(err => console.error('Cleanup error:', err))
    }
    
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: remaining - 1
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (e) {
    console.error('Rate limit function error:', e)
    // Fail open on errors
    return new Response(
      JSON.stringify({ allowed: true, remaining: 999 }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

