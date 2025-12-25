// Authentication middleware and utilities

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getSupabase } from '../supabase'

export interface AuthUser {
  id: string
  email?: string
  role?: string
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const supabase = getSupabase()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    // Get user role from profiles
    let role: string | undefined
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      role = profile?.role
    } catch {
      // User might not have a profile yet
    }
    
    return {
      id: user.id,
      email: user.email,
      role
    }
  } catch {
    return null
  }
}

/**
 * Get authenticated user from request (uses cookies in Next.js)
 * Returns null if not authenticated (doesn't throw)
 */
export async function withAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Get user role
    let role: string | undefined
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      role = profile?.role
    } catch {
      // User might not have a profile yet
    }
    
    return {
      id: user.id,
      email: user.email,
      role
    }
  } catch {
    return null
  }
}

/**
 * Check if user has required role
 */
export function requireRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role || '')
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return requireRole(user, ['admin'])
}

/**
 * Extract IP address from request
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown'
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown'
}

