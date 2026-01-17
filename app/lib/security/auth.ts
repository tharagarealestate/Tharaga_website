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
 * Checks both user_roles and profiles tables for admin role
 */
export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const supabase = getSupabase()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    // Get user role from both user_roles and profiles tables
    let role: string | undefined
    
    // Check user_roles table first (primary source)
    try {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      
      if (userRoles && userRoles.length > 0) {
        // Prioritize admin role, then builder, then buyer
        if (userRoles.some((r: any) => r.role === 'admin')) {
          role = 'admin'
        } else if (userRoles.some((r: any) => r.role === 'builder')) {
          role = 'builder'
        } else if (userRoles.some((r: any) => r.role === 'buyer')) {
          role = 'buyer'
        } else {
          role = userRoles[0]?.role
        }
      }
    } catch {
      // user_roles table might not exist or have data
    }
    
    // Fallback to profiles table if no role found
    if (!role) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        role = profile?.role
      } catch {
        // User might not have a profile yet
      }
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
 * Checks both user_roles and profiles tables for admin role
 */
export async function withAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Get user role from both user_roles and profiles tables
    let role: string | undefined
    
    // Check user_roles table first (primary source)
    try {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      
      if (userRoles && userRoles.length > 0) {
        // Prioritize admin role, then builder, then buyer
        if (userRoles.some((r: any) => r.role === 'admin')) {
          role = 'admin'
        } else if (userRoles.some((r: any) => r.role === 'builder')) {
          role = 'builder'
        } else if (userRoles.some((r: any) => r.role === 'buyer')) {
          role = 'buyer'
        } else {
          role = userRoles[0]?.role
        }
      }
    } catch {
      // user_roles table might not exist or have data
    }
    
    // Fallback to profiles table if no role found
    if (!role) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        role = profile?.role
      } catch {
        // User might not have a profile yet
      }
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

