"use client"

import { useEffect, useState, ReactNode } from 'react'
import { getSupabase } from '@/lib/supabase'

interface DashboardAuthWrapperProps {
  children: ReactNode
  requiredRole?: 'builder' | 'buyer' | 'admin'
}

/**
 * Dashboard Auth Wrapper - Non-blocking auth check
 * 
 * Renders children immediately, checks auth in background
 * Shows appropriate UI based on auth state without blocking
 */
export function DashboardAuthWrapper({ children, requiredRole }: DashboardAuthWrapperProps) {
  const [authState, setAuthState] = useState<{
    user: any | null
    loading: boolean
    hasRole: boolean | null
  }>({
    user: null,
    loading: true,
    hasRole: null,
  })

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const supabase = getSupabase()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (!mounted) return

        if (userError || !user) {
          setAuthState({ user: null, loading: false, hasRole: false })
          return
        }

        // Check role if required
        if (requiredRole) {
          try {
            // Check via role manager if available
            if (window.thgRoleManager) {
              const roleState = window.thgRoleManager.getState()
              const hasRole = roleState.roles?.includes(requiredRole) || false
              setAuthState({ user, loading: false, hasRole })
            } else {
              // Fallback: check via API
              const res = await fetch('/api/user/roles')
              if (res.ok) {
                const data = await res.json()
                const hasRole = data.roles?.includes(requiredRole) || false
                setAuthState({ user, loading: false, hasRole })
              } else {
                setAuthState({ user, loading: false, hasRole: null })
              }
            }
          } catch (err) {
            console.warn('[DashboardAuthWrapper] Role check failed:', err)
            setAuthState({ user, loading: false, hasRole: null })
          }
        } else {
          setAuthState({ user, loading: false, hasRole: true })
        }
      } catch (err) {
        console.error('[DashboardAuthWrapper] Auth check failed:', err)
        if (mounted) {
          setAuthState({ user: null, loading: false, hasRole: false })
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [requiredRole])

  // Always render children - auth check is non-blocking
  // Children can use authState to show appropriate UI
  return <>{children}</>
}
