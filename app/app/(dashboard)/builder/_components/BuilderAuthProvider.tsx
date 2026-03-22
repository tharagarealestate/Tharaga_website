'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { getSupabase } from '@/lib/supabase'
import { BuilderAuthGate } from './BuilderAuthGate'
import { BuilderSetupGate } from './BuilderSetupGate'
import { openAuthModal, closeAuthModal } from '@/components/auth/AuthModal'

// ─── Instant sync auth detection ─────────────────────────────────────────────
// Reads Supabase's localStorage token SYNCHRONOUSLY before first render.
// If no valid token exists → start as 'unauthenticated' → AuthModal opens
// instantly with zero spinner. If token exists → start as 'loading' and let
// resolveAuth() confirm with the server in the background.
const SUPABASE_PROJECT_REF = 'wedevtjjmdvngyshqdro'

function getInitialStatus(): AuthStatus {
  if (typeof window === 'undefined') return 'loading'
  try {
    const raw = localStorage.getItem(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
    if (!raw) return 'unauthenticated' // no stored session → modal opens immediately
    const parsed = JSON.parse(raw)
    // Expired token: don't assume unauthenticated — Supabase may have already
    // refreshed the session via HTTP-only cookies. Use 'loading' to trigger a
    // server-side getSession() check instead of opening the modal immediately.
    if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) {
      return 'loading'
    }
    return 'loading' // valid-looking token → verify with server in background
  } catch {
    return 'loading'
  }
}

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
  | 'unauthenticated'  // no session → auto-open login modal
  | 'no-profile'       // logged in but no builder profile → show setup form
  | 'buyer'            // logged in but is a buyer — access denied

const BuilderAuthContext = createContext<BuilderAuthContextType | null>(null)

export function useBuilderAuth(): BuilderAuthContextType {
  const context = useContext(BuilderAuthContext)
  if (!context) {
    return { isAuthenticated: false, isLoading: false, builderId: null, userId: null, builderProfile: null }
  }
  return context
}

// ─── Unauthenticated view — dark backdrop + auto-open AuthModal ───────────────

function UnauthenticatedView() {
  useEffect(() => {
    // Delay gives INITIAL_SESSION time to arrive (~50-150ms) and upgrade the
    // status — if it does, UnauthenticatedView unmounts and this timer is cleared.
    const t = setTimeout(() => openAuthModal(), 350)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 bg-zinc-950 z-40">
      {/* Subtle amber glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-600/6 blur-[140px]" />
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BuilderAuthProvider({ children }: { children: ReactNode }) {
  // getInitialStatus() runs synchronously — no spinner for unauthenticated users
  const [status, setStatus] = useState<AuthStatus>(getInitialStatus)
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [builderProfile, setBuilderProfile] = useState<BuilderAuthContextType['builderProfile']>(null)
  const mountedRef = useRef(true)
  const resolvedRef = useRef(false)

  // ── Core auth resolution ─────────────────────────────────────────────────
  // wasAuthenticated: when true, don't downgrade to 'unauthenticated' on
  // transient errors (e.g. TOKEN_REFRESHED with a slow network). Only kick
  // the user out if the session is genuinely gone.
  const resolveAuth = async (skipSessionCheck = false, wasAuthenticated = false) => {
    const supabase = getSupabase()

    try {
      let resolvedUserId: string | null = null
      let resolvedEmail: string = ''

      if (!skipSessionCheck) {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session

        if (!session?.user) {
          if (!mountedRef.current) return
          setStatus('unauthenticated')
          resolvedRef.current = true
          return
        }

        resolvedUserId = session.user.id
        resolvedEmail = session.user.email || ''
      } else {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          if (!mountedRef.current) return
          // Only kick out if user was not already authenticated (avoids logout on token refresh network blip)
          if (!wasAuthenticated) {
            setStatus('unauthenticated')
            resolvedRef.current = true
          }
          return
        }
        resolvedUserId = user.id
        resolvedEmail = user.email || ''
      }

      if (!mountedRef.current) return

      // Admin email bypass
      const isAdminByEmail = resolvedEmail === 'tharagarealestate@gmail.com'

      // Single parallel fetch for roles + profile — both fire simultaneously.
      // 6s guard (up from 5s) accounts for cold DB connections on free Supabase tier.
      const timeout = <T,>(p: Promise<T>): Promise<T> =>
        Promise.race([
          p,
          new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
        ])

      const [rolesResult, profileResult] = await Promise.allSettled([
        timeout(supabase.from('user_roles').select('role').eq('user_id', resolvedUserId)),
        timeout(
          supabase
            .from('builder_profiles')
            .select('id, company_name, user_id')
            .eq('user_id', resolvedUserId)
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

      // Store email for setup gate
      setUserEmail(resolvedEmail)
      setUserId(resolvedUserId)

      if (isAdmin) {
        // Admin uses auth.uid() as builderId so leads.builder_id filter works correctly
        setBuilderId(resolvedUserId)
        setBuilderProfile({
          id: resolvedUserId,
          company_name: profile?.company_name || 'Admin',
          email: resolvedEmail,
        })
        closeAuthModal() // close if it opened prematurely before this resolved
        setStatus('authenticated')
        resolvedRef.current = true
        return
      }

      // Buyer role → deny access
      const isBuyer = roles.includes('buyer') && !roles.includes('builder')
      if (isBuyer) {
        setBuilderId(null)
        setBuilderProfile(null)
        setStatus('buyer')
        resolvedRef.current = true
        return
      }

      // No builder profile → show setup form (not auto-redirect)
      if (!profile || !profile.company_name?.trim()) {
        setBuilderId(null)
        setBuilderProfile(null)
        setStatus('no-profile')
        resolvedRef.current = true
        return
      }

      // Full builder access — use auth.uid() (resolvedUserId) as builderId so that
      // leads.builder_id = eq(builderId) matches correctly (leads reference auth.users.id)
      setBuilderId(resolvedUserId)
      setBuilderProfile({ id: profile.id, company_name: profile.company_name, email: resolvedEmail })
      closeAuthModal() // close if it opened prematurely before this resolved
      setStatus('authenticated')
      resolvedRef.current = true
    } catch (err) {
      console.error('[BuilderAuthProvider] resolveAuth error:', err)
      if (!mountedRef.current) return
      if (!resolvedRef.current) {
        // Don't kick out an already-authenticated user on a transient error
        if (!wasAuthenticated) {
          setStatus('unauthenticated')
          resolvedRef.current = true
        }
      }
    }
  }

  // ── Mount effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    // Always start unresolved. If localStorage had no token (status='unauthenticated')
    // we still wait for the INITIAL_SESSION event to confirm no server session exists
    // before opening the modal — prevents false-positive modal on token refresh/page nav.
    resolvedRef.current = false
    if (status !== 'unauthenticated') {
      resolveAuth(false)
    }
    // For 'unauthenticated' (empty localStorage): rely on INITIAL_SESSION below.
    // resolveAuth() is called there if Supabase finds an active server session.

    // Safety valve — 10s timeout to prevent infinite spinner on initial load only
    const safetyTimer = setTimeout(() => {
      if (!mountedRef.current || resolvedRef.current) return
      // Only force unauthenticated if this is truly the initial check (not a token refresh)
      console.warn('[BuilderAuthProvider] Safety timeout — forcing unauthenticated')
      setStatus('unauthenticated')
      resolvedRef.current = true
    }, 10000)

    const supabase = getSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      if (event === 'SIGNED_OUT') {
        setBuilderId(null)
        setUserId(null)
        setUserEmail('')
        setBuilderProfile(null)
        setStatus('unauthenticated')
        resolvedRef.current = true
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Fresh sign-in: full re-resolve (may change roles/profile)
        resolvedRef.current = false
        resolveAuth(true, false)
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refresh just means JWT was renewed — the profile/roles haven't changed.
        // Don't re-query the DB, just update the userId if it somehow changed.
        // This eliminates the 500-800ms jank that happened every 60 minutes.
        if (!mountedRef.current) return
        setUserId(session.user.id)
        // No status change, no DB queries — session stays authenticated.
      }

      if (event === 'INITIAL_SESSION') {
        if (session?.user && !resolvedRef.current) {
          // Server has an active session — even if localStorage was empty/expired.
          // Upgrade to loading and do a full resolve (roles + builder profile).
          setStatus('loading')
          resolvedRef.current = false
          resolveAuth(true, false)
        } else if (!session?.user && !resolvedRef.current) {
          // Confirmed: no server session either → truly unauthenticated → open modal.
          setStatus('unauthenticated')
          resolvedRef.current = true
        }
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

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <BuilderAuthContext.Provider value={contextValue}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
          <div className="flex flex-col items-center gap-4">
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

  // ── Not logged in → dark bg + auto-open AuthModal ────────────────────────
  if (status === 'unauthenticated') {
    return (
      <BuilderAuthContext.Provider value={contextValue}>
        <UnauthenticatedView />
      </BuilderAuthContext.Provider>
    )
  }

  // ── Buyer — access denied ────────────────────────────────────────────────
  if (status === 'buyer') {
    return (
      <BuilderAuthContext.Provider value={contextValue}>
        <BuilderAuthGate variant="buyer" />
      </BuilderAuthContext.Provider>
    )
  }

  // ── Logged in but no builder profile → inline setup form ─────────────────
  if (status === 'no-profile') {
    return (
      <BuilderAuthContext.Provider value={contextValue}>
        <BuilderSetupGate
          userId={userId!}
          userEmail={userEmail}
          onSuccess={() => {
            // Re-resolve auth after profile creation
            resolvedRef.current = false
            setStatus('loading')
            resolveAuth(false)
          }}
        />
      </BuilderAuthContext.Provider>
    )
  }

  // ── Fully authenticated builder → render dashboard ────────────────────────
  return (
    <BuilderAuthContext.Provider value={contextValue}>
      {children}
    </BuilderAuthContext.Provider>
  )
}
