'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

/**
 * Auth callback page — handles BOTH OAuth flows:
 *
 * 1. PKCE flow: code arrives as query parameter
 *    e.g. /auth/callback?code=...
 *    → We call exchangeCodeForSession() once (guarded against React Strict Mode double-run)
 *    → Then read session from localStorage via getSession() — instant, no network
 *
 * 2. Implicit grant: tokens in URL hash fragment
 *    → Supabase JS `detectSessionInUrl` picks this up automatically
 *    → onAuthStateChange SIGNED_IN fires → we redirect
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Signing you in...')
  // Prevent React Strict Mode from running the effect twice (which consumes the code)
  const executedRef = useRef(false)

  useEffect(() => {
    if (executedRef.current) return
    executedRef.current = true

    const supabase = getSupabase()
    const params = new URLSearchParams(window.location.search)
    const rawNext = params.get('next') || '/'
    const next = rawNext.startsWith('/') ? rawNext : '/'   // safety: only allow relative paths
    const code = params.get('code')

    // Subscribe to auth state change — fires for PKCE (after exchangeCodeForSession)
    // and implicit flow.
    //
    // IMPORTANT: Handle INITIAL_SESSION in addition to SIGNED_IN.
    // For implicit grant flow, detectSessionInUrl:true processes the hash tokens
    // asynchronously during Supabase client initialization. By the time our useEffect
    // registers this listener, SIGNED_IN has already fired internally. Supabase then
    // emits INITIAL_SESSION ("here is the current state when you subscribed") — which
    // carries the session. Without handling INITIAL_SESSION, we fall into the 3-second
    // safety timeout, causing a visible delay and letting users navigate away before
    // the session is confirmed → login loop.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'INITIAL_SESSION'
      )) {
        subscription.unsubscribe()
        window.location.href = next  // immediate — no setTimeout delay
      }
    })

    async function handleAuth() {
      try {
        if (code) {
          // ── PKCE: exchange the one-time code for a session ──
          setStatus('Exchanging auth code...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('[Auth Callback] Code exchange error:', error.message)
            // onAuthStateChange won't fire if exchange failed — handle manually
            subscription.unsubscribe()
            setStatus('Authentication failed. Redirecting...')
            setTimeout(() => { window.location.href = '/' }, 1500)
            return
          }

          // After exchange, session is written to localStorage.
          // getSession() reads localStorage — instant, no network needed.
          setStatus('Loading your profile...')
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            // Session confirmed — onAuthStateChange may have already fired,
            // but if not, redirect here directly.
            subscription.unsubscribe()
            window.location.href = next  // immediate
            return
          }

          // Session not yet in localStorage (rare edge case) —
          // onAuthStateChange listener above will handle the redirect when it fires.
          setStatus('Finalizing login...')

        } else {
          // ── Implicit grant flow: tokens arrive in the URL hash ──
          // detectSessionInUrl:true processes the hash asynchronously on client init,
          // but timing isn't guaranteed. For maximum speed and reliability we also
          // manually extract access_token + refresh_token from the hash and call
          // setSession() directly. setSession() is instant (localStorage write) and
          // fires SIGNED_IN → our subscription above handles the redirect immediately.
          setStatus('Completing sign in...')

          const hash = window.location.hash.slice(1)   // strip leading '#'
          const hp   = new URLSearchParams(hash)
          const at   = hp.get('access_token')
          const rt   = hp.get('refresh_token')

          if (at && rt) {
            // Manually set the session — fires SIGNED_IN → subscription redirects.
            // This is the fast path: no waiting, no race condition.
            const { error: setErr } = await supabase.auth.setSession({
              access_token:  at,
              refresh_token: rt,
            })
            if (!setErr) {
              // setSession succeeded → SIGNED_IN fired → subscription already
              // redirected (or is about to). Return to let that happen.
              return
            }
            // setSession failed (expired/invalid token) — fall through to safety
          }

          // No hash tokens (or setSession failed) — rely on subscription above
          // (INITIAL_SESSION will arrive) + safety fallback after 4s.
          await new Promise(resolve => setTimeout(resolve, 4000))
          subscription.unsubscribe()
          const { data: { session: fbSession } } = await supabase.auth.getSession()
          if (fbSession?.user) {
            window.location.href = next
          } else {
            window.location.href = '/'
          }
        }
      } catch (err) {
        console.error('[Auth Callback] Exception:', err)
        subscription.unsubscribe()
        setStatus('Something went wrong. Redirecting...')
        setTimeout(() => { window.location.href = '/' }, 1500)
      }
    }

    handleAuth()

    return () => {
      // Cleanup: if component unmounts (e.g. nav away), unsubscribe
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
        </div>
        <p className="text-sm text-zinc-400 animate-pulse">{status}</p>
      </div>
    </div>
  )
}
