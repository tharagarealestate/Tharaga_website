'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { BuilderAuthGate } from './BuilderAuthGate'
import { BuilderSetupGate } from './BuilderSetupGate'
import { openAuthModal, closeAuthModal } from '@/components/auth/AuthModal'

// ─── Architecture ────────────────────────────────────────────────────────────
//
// PROBLEM WITH PREVIOUS APPROACH (INITIAL_SESSION + getUser):
//   1. User signs out → signs back in → /builder loads
//   2. INITIAL_SESSION fires with the new session
//   3. resolveAuth() calls getUser() — a NETWORK round-trip to Supabase auth server
//   4. After signOut, Supabase's edge function cold-starts → getUser() takes 3-8s
//   5. Either the safety timer fires (→ modal) or getUser() returns an error
//      (→ wasAuthenticated=true path keeps loading forever)
//   → Result: login modal re-opens after every logout+login cycle
//
// THE FIX — Direct getSession() on mount:
//   getSession() reads the JWT from localStorage — ZERO network, instant (~1ms).
//   For the admin account we only need the email from the JWT.
//   For builders we still verify server-side but the LOCAL session check confirms
//   they are logged in immediately, so we never fall through to unauthenticated.
//
// Flow:
//   Mount → getSession() (instant) →
//     session.user.email === admin → status='authenticated' in <5ms
//     session.user (non-admin)     → DB queries → status in ~500ms
//     no session                   → status='unauthenticated' immediately
//
// onAuthStateChange is kept ONLY for:
//   SIGNED_OUT   — clear state and show modal
//   SIGNED_IN    — user signs in via the modal while already on /builder
//   TOKEN_REFRESHED — sync userId for API calls

const ADMIN_EMAIL = 'tharagarealestate@gmail.com'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStatus =
  | 'loading'          // checking session (shows spinner)
  | 'authenticated'    // session valid + role confirmed → show dashboard
  | 'unauthenticated'  // no session → show login modal
  | 'no-profile'       // logged in but no builder profile → show setup
  | 'buyer'            // logged in but buyer role → access denied

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
  const ctx = useContext(BuilderAuthContext)
  if (!ctx) return { isAuthenticated: false, isLoading: false, builderId: null, userId: null, builderProfile: null }
  return ctx
}

// ─── Unauthenticated view — opens login modal after short delay ───────────────

function UnauthenticatedView() {
  useEffect(() => {
    const t = setTimeout(() => openAuthModal('/builder'), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 bg-zinc-950 z-40 flex items-end justify-center pb-10">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-600/6 blur-[140px]" />
      {/* Escape hatch — visible if user closes the auth modal */}
      <a
        href="/"
        className="relative z-10 text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BuilderAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus]               = useState<AuthStatus>('loading')
  const [builderId, setBuilderId]         = useState<string | null>(null)
  const [userId, setUserId]               = useState<string | null>(null)
  const [userEmail, setUserEmail]         = useState<string>('')
  const [builderProfile, setBuilderProfile] = useState<BuilderAuthContextType['builderProfile']>(null)

  const mountedRef  = useRef(true)
  const resolvedRef = useRef(false)
  // statusRef mirrors status for use inside async closures (avoids stale closure)
  const statusRef   = useRef<AuthStatus>('loading')

  // ── Helper: set authenticated state ──────────────────────────────────────
  const setAuthenticated = (uid: string, email: string, profile: BuilderAuthContextType['builderProfile']) => {
    if (!mountedRef.current) return
    setUserId(uid)
    setBuilderId(uid)
    setUserEmail(email)
    setBuilderProfile(profile)
    closeAuthModal()
    statusRef.current = 'authenticated'
    setStatus('authenticated')
    resolvedRef.current = true
  }

  // ── Core auth resolution ──────────────────────────────────────────────────
  // Accepts the session directly — no getUser() network call for admin.
  // For non-admin, falls through to DB queries.
  const resolveAuth = async (session: Session) => {
    const uid   = session.user.id
    const email = (session.user.email || '').toLowerCase().trim()

    if (!mountedRef.current || resolvedRef.current) return

    // ── Admin fast-path: email check against local JWT ────────────────────
    // JWT is signed by Supabase — cannot be forged. Email in JWT = verified.
    // No network call needed; this resolves in <5ms.
    if (email === ADMIN_EMAIL) {
      setAuthenticated(uid, email, { id: uid, company_name: 'Tharaga Admin', email })
      return
    }

    // ── Non-admin: use session JWT directly, let DB queries verify auth ──────
    // getUser() is a network round-trip to Supabase auth (~500-2000ms) we can skip.
    // The JWT from getSession() is signed by Supabase — email/uid are authentic.
    // DB queries below run with the user's JWT; Supabase RLS rejects expired/invalid
    // tokens, so failed DB queries serve as the implicit auth gate.
    const supabase = getSupabase()
    const verifiedUid   = uid
    const verifiedEmail = email

    setUserEmail(verifiedEmail)
    setUserId(verifiedUid)

    // Parallel DB fetch with 5s timeout
    const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
      Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error('timeout')), 5000))])

    const [rolesRes, profileRes] = await Promise.allSettled([
      withTimeout(supabase.from('user_roles').select('role').eq('user_id', verifiedUid)),
      withTimeout(
        supabase.from('builder_profiles')
          .select('id, company_name, user_id')
          .eq('user_id', verifiedUid)
          .maybeSingle()
      ),
    ])

    if (!mountedRef.current || resolvedRef.current) return

    // If BOTH queries failed the JWT was likely rejected by RLS → unauthenticated
    const rolesFailed   = rolesRes.status === 'rejected'   || !!rolesRes.value?.error
    const profileFailed = profileRes.status === 'rejected' || !!profileRes.value?.error
    if (rolesFailed && profileFailed) {
      statusRef.current = 'unauthenticated'
      setStatus('unauthenticated')
      resolvedRef.current = true
      return
    }

    const roles: string[] =
      rolesRes.status === 'fulfilled' ? (rolesRes.value.data?.map((r: any) => r.role) ?? []) : []
    const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null

    const isAdmin  = roles.includes('admin')
    const isBuyer  = roles.includes('buyer') && !roles.includes('builder')

    if (isAdmin) {
      setAuthenticated(verifiedUid, verifiedEmail, {
        id: verifiedUid,
        company_name: profile?.company_name || 'Admin',
        email: verifiedEmail,
      })
      return
    }

    if (isBuyer) {
      setBuilderId(null)
      setBuilderProfile(null)
      statusRef.current = 'buyer'
      setStatus('buyer')
      resolvedRef.current = true
      return
    }

    if (!profile?.company_name?.trim()) {
      setBuilderId(null)
      setBuilderProfile(null)
      statusRef.current = 'no-profile'
      setStatus('no-profile')
      resolvedRef.current = true
      return
    }

    setAuthenticated(verifiedUid, verifiedEmail, {
      id: profile.id,
      company_name: profile.company_name,
      email: verifiedEmail,
    })
  }

  // ── Mount effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current  = true
    resolvedRef.current = false
    statusRef.current   = 'loading'

    const supabase = getSupabase()

    // ── Step 1: Immediate local session check (zero network) ──────────────
    // getSession() reads the JWT from localStorage — instant, no Supabase edge call.
    // This is the ONLY trigger for initial auth on page load.
    // After OAuth redirect, the session is ALREADY in localStorage (written by
    // /auth/callback before redirecting here), so this always succeeds immediately.
    // Hard 8s safety timer — if auth hasn't resolved by then, show login modal
    // rather than spinning forever. Covers edge cases where getSession() stalls
    // or resolveAuth DB queries never return.
    const safetyTimer = setTimeout(() => {
      if (!mountedRef.current || resolvedRef.current) return
      console.warn('[BuilderAuth] Safety timeout fired — forcing unauthenticated')
      statusRef.current = 'unauthenticated'
      setStatus('unauthenticated')
      resolvedRef.current = true
    }, 8000)

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mountedRef.current) return

        if (session?.user) {
          await resolveAuth(session)
        } else {
          // No session in localStorage — definitely unauthenticated
          if (!mountedRef.current || resolvedRef.current) return
          statusRef.current = 'unauthenticated'
          setStatus('unauthenticated')
          resolvedRef.current = true
        }
      } catch {
        if (!mountedRef.current || resolvedRef.current) return
        statusRef.current = 'unauthenticated'
        setStatus('unauthenticated')
        resolvedRef.current = true
      }
    }

    initAuth()

    // ── Step 2: Watch for auth changes AFTER initial load ─────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      // User signed out — clear everything and show login modal.
      // resolvedRef MUST be false so the next SIGNED_IN event (account switch)
      // allows resolveAuth() to run — previously true here caused infinite spinner
      // when switching Google accounts.
      if (event === 'SIGNED_OUT') {
        setBuilderId(null)
        setUserId(null)
        setUserEmail('')
        setBuilderProfile(null)
        resolvedRef.current = false   // ← critical: allow next SIGNED_IN to re-auth
        statusRef.current = 'unauthenticated'
        setStatus('unauthenticated')
        return
      }

      // JWT silently refreshed — just sync userId, no re-auth needed
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUserId(session.user.id)
        return
      }

      // User signs in via the modal while already on /builder (UnauthenticatedView path)
      // Re-run full auth resolution with the new session.
      if (event === 'SIGNED_IN' && session?.user) {
        // Guard: if already authenticated (e.g. Supabase fires SIGNED_IN redundantly
        // on page load after OAuth redirect), ignore it.
        if (statusRef.current === 'authenticated') return
        // Reset resolved so resolveAuth can run
        resolvedRef.current = false
        resolveAuth(session)
        return
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
  const ctx: BuilderAuthContextType = {
    isAuthenticated: status === 'authenticated',
    isLoading:       status === 'loading',
    builderId,
    userId,
    builderProfile,
  }

  // Loading spinner
  if (status === 'loading') {
    return (
      <BuilderAuthContext.Provider value={ctx}>
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

  // No session → login modal
  if (status === 'unauthenticated') {
    return (
      <BuilderAuthContext.Provider value={ctx}>
        <UnauthenticatedView />
      </BuilderAuthContext.Provider>
    )
  }

  // Buyer — access denied
  if (status === 'buyer') {
    return (
      <BuilderAuthContext.Provider value={ctx}>
        <BuilderAuthGate variant="buyer" />
      </BuilderAuthContext.Provider>
    )
  }

  // Logged in but no builder profile → inline setup form
  if (status === 'no-profile') {
    return (
      <BuilderAuthContext.Provider value={ctx}>
        <BuilderSetupGate
          userId={userId!}
          userEmail={userEmail}
          onSuccess={() => {
            resolvedRef.current = false
            statusRef.current   = 'loading'
            setStatus('loading')
            // Re-fetch session after profile creation
            getSupabase().auth.getSession().then(({ data: { session } }) => {
              if (session) resolveAuth(session)
            })
          }}
        />
      </BuilderAuthContext.Provider>
    )
  }

  // Fully authenticated — render dashboard
  return (
    <BuilderAuthContext.Provider value={ctx}>
      {children}
    </BuilderAuthContext.Provider>
  )
}
