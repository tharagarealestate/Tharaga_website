// Login security utilities - account lockout, failed attempt tracking

import { getSupabase } from '../supabase'
import { logSecurityEvent, AuditActions, AuditResourceTypes } from './audit'
import { NextRequest } from 'next/server'

/**
 * Extract IP address from request
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown'
}

/**
 * Get user agent from request
 */
function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown'
}

/**
 * Check if account is locked due to failed login attempts
 */
export async function checkAccountLockout(email: string): Promise<{
  isLocked: boolean
  attemptsRemaining: number
  lockedUntil?: Date
}> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase.rpc('check_failed_login_attempts', {
    p_email: email,
    p_max_attempts: 5,
    p_lockout_minutes: 15
  })

  if (error || !data || data.length === 0) {
    return { isLocked: false, attemptsRemaining: 5 }
  }

  const result = data[0]
  return {
    isLocked: result.is_locked || false,
    attemptsRemaining: result.attempts_remaining || 0,
    lockedUntil: result.locked_until ? new Date(result.locked_until) : undefined
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(
  email: string,
  reason?: string
): Promise<{
  isLocked: boolean
  attemptsRemaining: number
  lockedUntil?: Date
}> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase.rpc('record_failed_login', {
    p_email: email,
    p_max_attempts: 5,
    p_lockout_minutes: 15
  })

  if (error || !data || data.length === 0) {
    return { isLocked: false, attemptsRemaining: 4 }
  }

  const result = data[0]
  return {
    isLocked: result.is_locked || false,
    attemptsRemaining: result.attempts_remaining || 0,
    lockedUntil: result.locked_until ? new Date(result.locked_until) : undefined
  }
}

/**
 * Reset failed login attempts (on successful login)
 */
export async function resetFailedLoginAttempts(email: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.rpc('reset_failed_login_attempts', { p_email: email })
}

/**
 * Log login attempt to audit log
 */
export async function logLoginAttempt(
  email: string,
  userId: string | null,
  success: boolean,
  req: NextRequest,
  metadata?: {
    required2FA?: boolean
    passed2FA?: boolean
    failureReason?: string
  }
): Promise<void> {
  const supabase = getSupabase()
  const ip = getClientIp(req)
  const userAgent = getUserAgent(req)

  // Log to login_attempts table
  await supabase.from('login_attempts').insert({
    email,
    user_id: userId || null,
    ip_address: ip,
    user_agent: userAgent,
    success,
    failure_reason: metadata?.failureReason || null,
    required_2fa: metadata?.required2FA || false,
    passed_2fa: metadata?.passed2FA || false,
    attempted_at: new Date().toISOString()
  })

  // Log to audit log
  await logSecurityEvent(
    req,
    success ? AuditActions.LOGIN : AuditActions.LOGIN_FAILED,
    AuditResourceTypes.AUTH,
    userId || undefined,
    userId || undefined,
    {
      email,
      ip,
      userAgent,
      ...metadata
    }
  )
}




