"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

/** Wrap any promise with a timeout so DB queries never hang forever */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timed out after ${ms}ms`)), ms)
    ),
  ])
}

/**
 * Builder Auth Provider - Authenticated Builders Only
 * 
 * This provider ensures only authenticated users with valid builder profiles
 * can access the builder dashboard. Users without builder profiles are redirected.
 */

interface BuilderAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  builderId: string | null
  userId: string | null
  builderProfile: {
    id: string
    company_name: string
    email: string | null
  } | null
}

const BuilderAuthContext = createContext<BuilderAuthContextType | null>(null)

export function useBuilderAuth(): BuilderAuthContextType {
  const context = useContext(BuilderAuthContext)
  
  // Provide safe defaults if context is not available
  if (!context) {
    console.warn('[useBuilderAuth] BuilderAuthProvider context not found, using defaults')
    return {
      isAuthenticated: false,
      isLoading: false,
      builderId: null,
      userId: null,
      builderProfile: null,
    }
  }
  
  return context
}

interface BuilderAuthProviderProps {
  children: ReactNode
}

export function BuilderAuthProvider({ children }: BuilderAuthProviderProps) {
  const router = useRouter()
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean
    isLoading: boolean
    builderId: string | null
    userId: string | null
    builderProfile: {
      id: string
      company_name: string
      email: string | null
    } | null
  }>({
    isAuthenticated: false,
    isLoading: true,
    builderId: null,
    userId: null,
    builderProfile: null,
  })

  useEffect(() => {
    let mounted = true

    // Hard safety net: if auth hasn't resolved within 10 seconds, force-resolve as unauthenticated
    safetyTimerRef.current = setTimeout(() => {
      if (mounted) {
        setAuthState(prev => {
          if (prev.isLoading) {
            console.warn('[BuilderAuthProvider] Auth timed out after 10s — forcing unauthenticated state')
            return { isAuthenticated: false, isLoading: false, builderId: null, userId: null, builderProfile: null }
          }
          return prev
        })
      }
    }, 10000)

    async function checkAuth() {
      try {
        const supabase = getSupabase()
        // 8-second timeout on getUser to prevent network hang
        const { data: { user }, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          8000
        )

        if (!mounted) return

        // No user = not authenticated
        if (userError || !user) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            builderId: null,
            userId: null,
            builderProfile: null,
          })
          // Redirect to home or login page
          router.push('/?login=true')
          return
        }

        // Check admin role — both queries race with 5s timeout each
        const [userRolesResult, profileResult] = await withTimeout(
          Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', user.id),
            supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
          ]),
          5000
        )

        // Admin check: email match OR role match in database
        const userEmail = user.email || ''
        const isAdminByEmail = userEmail === 'tharagarealestate@gmail.com'
        const isAdminByRole =
          userRolesResult.data?.some((r: any) => r.role === 'admin') ||
          profileResult.data?.role === 'admin' ||
          false

        const isAdmin = isAdminByEmail || isAdminByRole

        // Fetch builder profile — 5s timeout
        const { data: builderProfile, error: profileError } = await withTimeout(
          supabase
            .from('builder_profiles')
            .select('id, company_name, user_id')
            .eq('user_id', user.id)
            .maybeSingle(),
          5000
        )

        if (!mounted) return

        // Admin users bypass builder profile requirement
        if (isAdmin) {
          // For admin users, use builderProfile.id if exists, otherwise use user.id as builderId
          // This ensures admin users can access all builder features even without a builder profile
          const adminBuilderId = builderProfile?.id || user.id
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            builderId: adminBuilderId, // Use profile ID if exists, otherwise use user.id for admin
            userId: user.id,
            builderProfile: builderProfile ? {
              id: builderProfile.id,
              company_name: builderProfile.company_name || 'Admin',
              email: userEmail,
            } : {
              id: adminBuilderId, // Use user ID as builderId for admin without profile
              company_name: 'Admin',
              email: userEmail,
            },
          })
          return
        }

        // Non-admin users: No builder profile = not authorized
        if (profileError || !builderProfile) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            builderId: null,
            userId: user.id,
            builderProfile: null,
          })
          // Redirect to builder onboarding or home
          router.push('/?builder-onboarding=true')
          return
        }

        // Check if company_name is filled (required field for non-admin builders)
        if (!builderProfile.company_name || builderProfile.company_name.trim() === '') {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            builderId: null,
            userId: user.id,
            builderProfile: null,
          })
          // Redirect to complete profile
          router.push('/?complete-builder-profile=true')
          return
        }

        // Fully authenticated builder with complete profile
        // (userEmail already declared above)
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          builderId: builderProfile.id,
          userId: user.id,
          builderProfile: {
            id: builderProfile.id,
            company_name: builderProfile.company_name,
            email: userEmail,
          },
        })
      } catch (err) {
        console.error('[BuilderAuthProvider] Auth check error:', err)
        if (mounted) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            builderId: null,
            userId: null,
            builderProfile: null,
          })
          router.push('/?error=auth-failed')
        }
      }
    }

    checkAuth()

    // Re-check auth periodically (every 30 seconds) to catch logout events
    const interval = setInterval(checkAuth, 30000)

    // Listen for auth state changes
    const supabase = getSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      if (event === 'SIGNED_OUT' || !session) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          builderId: null,
          userId: null,
          builderProfile: null,
        })
        router.push('/?login=true')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Re-check auth when user signs in or token refreshes
        checkAuth()
      }
    })

    return () => {
      mounted = false
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <BuilderAuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        builderId: authState.builderId,
        userId: authState.userId,
        builderProfile: authState.builderProfile,
      }}
    >
      {children}
    </BuilderAuthContext.Provider>
  )
}
