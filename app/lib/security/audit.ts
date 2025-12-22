// Audit logging utilities

import { NextRequest } from 'next/server'
import { getSupabase } from '../supabase'

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

export interface AuditLogEntry {
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getSupabase()
    await supabase.from('audit_logs').insert({
      user_id: entry.user_id || null,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      metadata: entry.metadata || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Don't throw - audit logging should never break the app
    console.error('Failed to write audit log:', error)
  }
}

/**
 * Log sensitive actions with request context
 */
export async function logSecurityEvent(
  req: NextRequest,
  action: string,
  resourceType: string,
  resourceId?: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
    metadata
  })
}

/**
 * Predefined audit events
 */
export const AuditActions = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  UPDATE_LEAD: 'update_lead',
  DELETE_LEAD: 'delete_lead',
  UPDATE_PROPERTY: 'update_property',
  DELETE_PROPERTY: 'delete_property',
  CREATE_PAYMENT: 'create_payment',
  UPDATE_SETTINGS: 'update_settings',
  VIEW_SENSITIVE_DATA: 'view_sensitive_data',
  PASSWORD_CHANGE: 'password_change',
  OTP_SENT: 'otp_sent',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
} as const

export const AuditResourceTypes = {
  AUTH: 'auth',
  LEAD: 'lead',
  PROPERTY: 'property',
  PAYMENT: 'payment',
  USER: 'user',
  SETTINGS: 'settings'
} as const

