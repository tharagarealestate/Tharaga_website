// =============================================
// ENHANCED API AUTHENTICATION HELPER
// Provides better error handling and diagnostics
// =============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface AuthResult {
  user: { id: string; email?: string; role?: string } | null
  error: {
    type: 'UNAUTHORIZED' | 'SESSION_EXPIRED' | 'CONFIG_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN'
    message: string
    details?: any
    retryable: boolean
  } | null
  supabase: Awaited<ReturnType<typeof createClient>>
}

/**
 * Enhanced authentication helper with detailed error handling
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Step 1: Create Supabase client with proper async cookie handling
    let supabase: Awaited<ReturnType<typeof createClient>>
    try {
      // Use the server client which handles async cookies correctly
      supabase = await createClient()
    } catch (clientError: any) {
      console.error('[API Auth] Failed to create Supabase client:', clientError)
      return {
        user: null,
        supabase: null as any,
        error: {
          type: 'CONFIG_ERROR',
          message: 'Authentication service unavailable. Please try again later.',
          details: { error: clientError.message },
          retryable: true,
        },
      }
    }

    // Step 2: Get user with detailed error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Step 3: Analyze error type
    if (authError) {
      console.error('[API Auth] Auth error:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      })

      // Determine error type
      let errorType: AuthResult['error']['type'] = 'UNKNOWN'
      let retryable = false
      let message = 'Authentication failed'

      if (authError.message?.includes('JWT') || authError.message?.includes('token')) {
        errorType = 'SESSION_EXPIRED'
        message = 'Your session has expired. Please log in again.'
        retryable = false
      } else if (authError.message?.includes('network') || authError.message?.includes('fetch')) {
        errorType = 'NETWORK_ERROR'
        message = 'Network error. Please check your connection and try again.'
        retryable = true
      } else if (authError.status === 401) {
        errorType = 'UNAUTHORIZED'
        message = 'Please log in to access this feature.'
        retryable = false
      } else {
        errorType = 'UNKNOWN'
        message = authError.message || 'Authentication failed. Please try again.'
        retryable = true
      }

      return {
        user: null,
        supabase,
        error: {
          type: errorType,
          message,
          details: {
            status: authError.status,
            name: authError.name,
            message: authError.message,
          },
          retryable,
        },
      }
    }

    // Step 4: Check if user exists
    if (!user) {
      return {
        user: null,
        supabase,
        error: {
          type: 'UNAUTHORIZED',
          message: 'Please log in to access this feature.',
          retryable: false,
        },
      }
    }

    // CRITICAL FIX: Admin owner email gets full admin role immediately (bypasses ALL database checks)
    // This ensures the admin owner (tharagarealestate@gmail.com) can access ALL features
    if (user.email === 'tharagarealestate@gmail.com') {
      return {
        user: {
          id: user.id,
          email: user.email,
          role: 'admin',
        },
        supabase,
        error: null,
      }
    }

    // Step 5: Get user role from profile
    let role: string | undefined
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      role = profile?.role
    } catch (profileError) {
      // Profile might not exist yet - not a critical error
      console.warn('[API Auth] Could not fetch user profile:', profileError)
    }

    // Step 6: Success
    return {
      user: {
        id: user.id,
        email: user.email,
        role,
      },
      supabase,
      error: null,
    }
  } catch (error: any) {
    console.error('[API Auth] Unexpected error:', error)
    return {
      user: null,
      supabase: null as any,
      error: {
        type: 'UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
        details: { error: error.message },
        retryable: true,
      },
    }
  }
}

/**
 * Verify user is a builder
 */
export async function requireBuilder(request: NextRequest): Promise<{
  user: { id: string; email?: string } | null
  builder: { id: string } | null
  supabase: Awaited<ReturnType<typeof createClient>> | null
  error: AuthResult['error'] | { type: 'NOT_BUILDER'; message: string; retryable: false } | null
}> {
  const authResult = await getAuthenticatedUser(request)

  if (authResult.error || !authResult.user) {
    return {
      user: null,
      builder: null,
      supabase: authResult.supabase,
      error: authResult.error,
    }
  }

  // CRITICAL FIX: Check if user is admin owner - they get FULL access to builder features
  const isAdminOwner = authResult.user.email === 'tharagarealestate@gmail.com'
  const isAdmin = authResult.user.role === 'admin' || isAdminOwner

  // Check if user is a builder OR admin (admins can access builder features)
  if (authResult.user.role !== 'builder' && !isAdmin) {
    return {
      user: authResult.user,
      builder: null,
      supabase: authResult.supabase,
      error: {
        type: 'NOT_BUILDER' as any,
        message: 'This feature is only available for builders.',
        retryable: false,
      },
    }
  }

  // Get builder profile
  try {
    const { data: builder, error: builderError } = await authResult.supabase
      .from('builders')
      .select('id')
      .eq('user_id', authResult.user.id)
      .single()

    // CRITICAL FIX: Admin users get access even without builder profile
    // They get a virtual builder profile using their user ID
    if (isAdmin) {
      return {
        user: { ...authResult.user, role: 'admin' },
        builder: builder || { id: authResult.user.id }, // Use user ID if no builder profile
        supabase: authResult.supabase,
        error: null,
      }
    }

    if (builderError || !builder) {
      return {
        user: authResult.user,
        builder: null,
        supabase: authResult.supabase,
        error: {
          type: 'CONFIG_ERROR' as any,
          message: 'Builder profile not found. Please complete your builder profile setup.',
          retryable: false,
        },
      }
    }

    return {
      user: authResult.user,
      builder,
      supabase: authResult.supabase,
      error: null,
    }
  } catch (error: any) {
    console.error('[API Auth] Error fetching builder profile:', error)

    // CRITICAL FIX: Admin users should still have access even if builder query fails
    if (isAdmin) {
      return {
        user: { ...authResult.user, role: 'admin' },
        builder: { id: authResult.user.id },
        supabase: authResult.supabase,
        error: null,
      }
    }

    return {
      user: authResult.user,
      builder: null,
      supabase: authResult.supabase,
      error: {
        type: 'UNKNOWN' as any,
        message: 'Failed to fetch builder profile. Please try again.',
        details: { error: error.message },
        retryable: true,
      },
    }
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: AuthResult['error'],
  statusCode: number = 401
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: error.message,
      errorType: error.type,
      retryable: error.retryable,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    },
    { status: statusCode }
  )
}

