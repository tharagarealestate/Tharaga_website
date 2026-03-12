'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

/**
 * Auth callback page — handles BOTH OAuth flows:
 *
 * 1. Implicit grant (Supabase default): tokens arrive in URL hash fragment
 *    e.g. /auth/callback#access_token=...&refresh_token=...
 *    → Supabase JS `detectSessionInUrl` picks this up automatically
 *
 * 2. PKCE flow: code arrives as query parameter
 *    e.g. /auth/callback?code=...
 *    → We call exchangeCodeForSession() explicitly
 *
 * After session is established, redirect to `next` param or /builder by default.
 * Builder-focused: signing in almost always means going to the dashboard.
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    let cancelled = false

    // Helper: getUser with timeout so it NEVER hangs forever
    async function getUserWithTimeout(timeoutMs = 4000) {
      const supabase = getSupabase()
      return Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null }; error: Error }>((resolve) =>
          setTimeout(
            () => resolve({ data: { user: null }, error: new Error('timeout') }),
            timeoutMs
          )
        ),
      ])
    }

    async function handleAuth() {
      try {
        const supabase = getSupabase()

        // Read destination — where to send the user after auth
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next') || '/builder'

        // ── Handle PKCE flow (code in query params) ──
        const code = params.get('code')
        if (code) {
          setStatus('Exchanging auth code...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('[Auth Callback] Code exchange error:', error.message)
            setStatus('Authentication failed. Redirecting...')
            setTimeout(() => { window.location.href = '/' }, 1500)
            return
          }
        }

        // ── For implicit flow, detectSessionInUrl handles hash fragments ──
        // Give Supabase client time to process hash tokens
        await new Promise(resolve => setTimeout(resolve, 500))

        if (cancelled) return

        // ── Get the authenticated user — with guaranteed timeout ──
        setStatus('Loading your profile...')
        const { data: { user }, error: userError } = await getUserWithTimeout(4000)

        if (userError || !user) {
          if (cancelled) return
          // Session might not be ready yet — wait and retry once
          await new Promise(resolve => setTimeout(resolve, 1000))
          if (cancelled) return

          const { data: { user: retryUser } } = await getUserWithTimeout(3000)

          if (!retryUser) {
            console.error('[Auth Callback] No user after retry')
            setStatus('Could not verify session. Redirecting...')
            setTimeout(() => { window.location.href = '/' }, 1500)
            return
          }
        }

        if (cancelled) return

        // ── Success — redirect to builder dashboard (or `next` param) ──
        setStatus('Welcome back! Loading dashboard...')
        // Small pause so the success message is visible
        await new Promise(resolve => setTimeout(resolve, 400))
        if (!cancelled) {
          window.location.href = next
        }
      } catch (err) {
        console.error('[Auth Callback] Exception:', err)
        if (!cancelled) {
          setStatus('Something went wrong. Redirecting...')
          setTimeout(() => { window.location.href = '/' }, 1500)
        }
      }
    }

    handleAuth()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Amber spinner matching AI-world design */}
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
        </div>
        <p className="text-sm text-zinc-400 animate-pulse">{status}</p>
      </div>
    </div>
  )
}
