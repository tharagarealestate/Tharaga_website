'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { getSupabase } from '@/lib/supabase'
import { BuilderAuthGate } from './BuilderAuthGate'

// ─── Types ────────────────────────────────────────────────────────────────────

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

type AuthStatus =
  | 'loading'          // initial — checking session
  | 'authenticated'    // builder profile found, all good
  | 'unauthenticated'  // no session / session invalid
  | 'no-profile'       // logged in but no builder profile yet

const BuilderAuthContext = createContext<BuilderAuthContextType | null>(null)

export function useBuilderAuth(): BuilderAuthContextType {
  const context = useContext(BuilderAuthContext)
  if (!context) {
    return { isAuthenticated: false, isLoading: false, builderId: null, userId: null, builderProfile: null }
  }
  return context
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BuilderAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [builderProfile, setBuilderProfile] = useState<BuilderAuthContextType['builderProfile']>(null)
  const mountedRef = useRef(true)
  // Track whether we have done the initial full auth check so we don't run it twice
  const resolvedRef = useRef(false)

  // ── Core auth resolution ─────────────────────────────────────────────────
  const resolveAuth = async (skipSessionCheck = false) => {
    const supabase = getSupabase()

    try {
      // STEP 1 — Fast path: read session from localStorage (no network call)
      // This resolves the loading state immediately so there's never a flash.
      let userId: string | null = null
      let userEmail: string = ''

      if (!skipSessionCheck) {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session

        if (!session?.user) {
          // Definitely not logged in — no session in localStorage at all
          if (!mountedRef.current) return
          setStatus('unauthenticated')
          resolvedRef.current = true
          return
        }

        userId = session.user.id
        userEmail = session.user.email || ''
      } else {
        // Called from onAuthStateChange — session is fresh, get user directly
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          if (!mountedRef.current) return
          setStatus('unauthenticated')
          resolvedRef.current = true
          return
        }
        userId = user.id
        userEmail = user.email || ''
      }

      if (!mountedRef.current) return

      // STEP 2 — Check admin by email
      const isAdminByEmail = userEmail === 'tharagarealestate@gmail.com'

      // STEP 3 — Fetch roles and builder profile in parallel (with 5s guard)
      const timeout = <T,>(p: Promise<T>): Promise<T> =>
        Promise.race([
          p,
          new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
        ])

      const [rolesResult, profileResult] = await Promise.allSettled([
        timeout(supabase.from('user_roles').select('role').eq('user_id', userId)),
        timeout(
          supabase
            .from('builder_profiles')
            .select('id, company_name, user_id')
            .eq('user_id', userId)
            .maybeSingle()
        ),
      ])

      if (!mountedRef.current) return

      const roles: string[] =
        rolesResult.status === 'fulfilled' ? (rolesResult.value.data?.map((r: any) => r.role) ?? []) : []

      const profile =
        profileResult.status === 'fulfilled' ? profileResult.value.data : null

      const isAdminByRole = roles.includes('admin')
      const isAdmin = isAdminByEmail || isAdminByRole

      // STEP 4 — Determine final status
      if (isAdmin) {
        const adminBuilderId = profile?.id ?? userId
        setBuilderId(adminBuilderId)
        setUserId(userId)
        setBuilderProfile({
          id: adminBuilderId,
          company_name: profile?.company_name || 'Admin',
          email: userEmail,
        })
        setStatus('authenticated')
        resolvedRef.current = true
        return
      }

      if (!profile || !profile.company_name?.trim()) {
        // Logged in but no builder profile — show "complete profile" gate variant
        setUserId(userId)
        setBuilderId(null)
        setBuilderProfile(null)
        setStatus('no-profile')
        resolvedRef.current = true
        return
      }

      // Full builder access
      setBuilderId(profile.id)
      setUserId(userId)
      setBuilderProfile({ id: profile.id, company_name: profile.company_name, email: userEmail })
      setStatus('authenticated')
      resolvedRef.current = true
    } catch (err) {
      console.error('[BuilderAuthProvider] resolveAuth error:', err)
      if (!mountedRef.current) return
      // On unexpected error — show gate rather than infinite loading or redirect
      if (!resolvedRef.current) {
        setStatus('unauthenticated')
        resolvedRef.current = true
      }
    }
  }

  // ── Mount effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    resolvedRef.current = false

    // Start auth resolution immediately
    resolveAuth(false)

    // Safety valve: if nothing resolved in 8s, force unauthenticated so user
    // isn't stuck on an infinite spinner
    const safetyTimer = setTimeout(() => {
      if (!mountedRef.current || resolvedRef.current) return
      console.warn('[BuilderAuthProvider] Safety timeout — forcing gate display')
      setStatus('unauthenticated')
      resolvedRef.current = true
    }, 8000)

    // Listen for Supabase auth events
    const supabase = getSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      if (event === 'SIGNED_OUT') {
        setBuilderId(null)
        setUserId(null)
        setBuilderProfile(null)
        setStatus('unauthenticated')
        resolvedRef.current = true
        return
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        // Re-resolve with fresh session — skip session check since we have the session
        resolvedRef.current = false
        resolveAuth(true)
      }

      // INITIAL_SESSION: only act if we're still in loading state
      if (event === 'INITIAL_SESSION') {
        if (!session?.user && !resolvedRef.current) {
          setStatus('unauthenticated')
          resolvedRef.current = true
        }
        // If session exists, resolveAuth() from above is already running — no-op
      }
    })

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Context value ─────────────────────────────────────────────────────────
  const contextValue: BuilderAuthContextType = {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    builderId,
    userId,
    builderProfile,
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Still resolving — minimal skeleton so there's no flash
  if (status === 'loading') {
    return (
      <BuilderAuthContext.Provider value={contextValue}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
          <div className="flex flex-col items-center gap-4">
            {/* Pulsing amber ring */}
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
            </div>
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading dashboard…</p>
          </div>
        </div>
      </BuilderAuthContext.Provider>
    )
  }

  // Not logged in — show beautiful auth gate (no redirect)
  if (status === 'unauthenticated') {
    return (
      <BuilderAuthContext.Provider value={contextValue}>
        <BuilderAuthGate variant="unauthenticated" />
      </BuilderAuthContext.Provider>
    )
  }

  // Logged in but no builder profile — show completion gate
  if (status === 'no-profile') {
    return (
      <BuilderAuthContext.Provider value={contextValue}>
        <BuilderAuthGate variant="no-profile" />
      </BuilderAuthContext.Provider>
    )
  }

  // Fully authenticated builder — render dashboard
  return (
    <BuilderAuthContext.Provider value={contextValue}>
      {children}
    </BuilderAuthContext.Provider>
  )
}
