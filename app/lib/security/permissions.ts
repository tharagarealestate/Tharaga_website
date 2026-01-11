// Permission-based authorization system

import { getSupabase } from '../supabase'

export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

export const Permissions = {
  // Property permissions
  PROPERTY_VIEW: 'property:view',
  PROPERTY_CREATE: 'property:create',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',
  PROPERTY_VERIFY: 'property:verify',

  // Lead permissions
  LEAD_VIEW: 'lead:view',
  LEAD_CREATE: 'lead:create',
  LEAD_UPDATE: 'lead:update',
  LEAD_DELETE: 'lead:delete',
  LEAD_ASSIGN: 'lead:assign',

  // User permissions
  USER_VIEW: 'user:view',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // Admin permissions
  ADMIN_ACCESS: 'admin:access',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_AUDIT: 'admin:audit',

  // Webhook permissions
  WEBHOOK_VIEW: 'webhook:view',
  WEBHOOK_MANAGE: 'webhook:manage',

  // Builder permissions
  BUILDER_DASHBOARD: 'builder:dashboard',
  BUILDER_ANALYTICS: 'builder:analytics',
  BUILDER_AUTOMATION: 'builder:automation',

  // Buyer permissions
  BUYER_DASHBOARD: 'buyer:dashboard',
  BUYER_FAVORITES: 'buyer:favorites',
  BUYER_SEARCH: 'buyer:search'
} as const

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const supabase = getSupabase()
    
    // Get user role and permissions
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, permissions')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return false
    }

    // Admin has all permissions
    if (profile.role === 'admin') {
      return true
    }

    // Check explicit permission in permissions JSONB
    if (profile.permissions && typeof profile.permissions === 'object') {
      const permissions = profile.permissions as Record<string, boolean>
      if (permissions[permission] === true) {
        return true
      }
    }

    // Check role-based default permissions
    return checkRolePermission(profile.role, permission)
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

/**
 * Check role-based default permissions
 */
function checkRolePermission(role: string | null, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    builder: [
      Permissions.BUILDER_DASHBOARD,
      Permissions.BUILDER_ANALYTICS,
      Permissions.BUILDER_AUTOMATION,
      Permissions.PROPERTY_CREATE,
      Permissions.PROPERTY_UPDATE,
      Permissions.PROPERTY_VIEW,
      Permissions.LEAD_VIEW,
      Permissions.LEAD_UPDATE,
      Permissions.LEAD_ASSIGN,
      Permissions.WEBHOOK_VIEW,
      Permissions.WEBHOOK_MANAGE
    ],
    buyer: [
      Permissions.BUYER_DASHBOARD,
      Permissions.BUYER_FAVORITES,
      Permissions.BUYER_SEARCH,
      Permissions.PROPERTY_VIEW,
      Permissions.LEAD_CREATE
    ],
    admin: [
      // Admin has all permissions
      ...Object.values(Permissions)
    ]
  }

  const allowed = rolePermissions[role || ''] || []
  return allowed.includes(permission)
}

/**
 * Grant permission to a user
 */
export async function grantPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const supabase = getSupabase()
    
    // Get current permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('permissions')
      .eq('id', userId)
      .single()

    const currentPermissions = (profile?.permissions as Record<string, boolean>) || {}
    currentPermissions[permission] = true

    const { error } = await supabase
      .from('profiles')
      .update({ permissions: currentPermissions })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Grant permission error:', error)
    return false
  }
}

/**
 * Revoke permission from a user
 */
export async function revokePermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const supabase = getSupabase()
    
    // Get current permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('permissions')
      .eq('id', userId)
      .single()

    const currentPermissions = (profile?.permissions as Record<string, boolean>) || {}
    delete currentPermissions[permission]

    const { error } = await supabase
      .from('profiles')
      .update({ permissions: currentPermissions })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Revoke permission error:', error)
    return false
  }
}

/**
 * Check multiple permissions (all must pass)
 */
export async function hasAllPermissions(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(userId, permission))) {
      return false
    }
  }
  return true
}

/**
 * Check multiple permissions (any must pass)
 */
export async function hasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, permission)) {
      return true
    }
  }
  return false
}











