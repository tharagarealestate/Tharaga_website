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
  // Authentication
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGE: 'password_change',
  
  // CRUD Operations
  CREATE: 'create',
  READ: 'read',
  VIEW: 'view',
  UPDATE: 'update',
  DELETE: 'delete',
  BULK_UPDATE: 'bulk_update',
  
  // Lead Operations
  LEAD_CREATE: 'lead_create',
  LEAD_UPDATE: 'lead_update',
  LEAD_DELETE: 'lead_delete',
  LEAD_ASSIGN: 'lead_assign',
  
  // Property Operations
  PROPERTY_CREATE: 'property_create',
  PROPERTY_UPDATE: 'property_update',
  PROPERTY_DELETE: 'property_delete',
  PROPERTY_VERIFY: 'property_verify',
  
  // User Operations
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  ROLE_CHANGE: 'role_change',
  
  // Admin Operations
  ADMIN_ACCESS: 'admin_access',
  SETTINGS_UPDATE: 'settings_update',
  
  // Security Events
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  
  // 2FA Operations
  TWO_FA_ENABLE: 'two_fa_enable',
  TWO_FA_DISABLE: 'two_fa_disable',
  TWO_FA_VERIFY: 'two_fa_verify',
  
  // Payment Operations
  CREATE_PAYMENT: 'create_payment',
  
  // Other
  OTP_SENT: 'otp_sent',
  VIEW_SENSITIVE_DATA: 'view_sensitive_data'
} as const

export const AuditResourceTypes = {
  AUTH: 'auth',
  LEAD: 'lead',
  PROPERTY: 'property',
  PAYMENT: 'payment',
  USER: 'user',
  SETTINGS: 'settings',
  ADMIN: 'admin',
  PROFILE: 'profile',
  ROLE: 'role'
} as const

