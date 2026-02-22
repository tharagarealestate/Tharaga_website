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
 * After session is established, we fetch user roles and redirect.
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    let cancelled = false

    async function handleAuth() {
      try {
        const supabase = getSupabase()

        // ── Handle PKCE flow (code in query params) ──
        const params = new URLSearchParams(window.location.search)
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
        // Give Supabase client a moment to process the hash tokens
        // The client auto-detects #access_token=...&refresh_token=... on init
        await new Promise(resolve => setTimeout(resolve, 500))

        // ── Get the authenticated user ──
        setStatus('Loading your profile...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          // Session might not be ready yet — wait and retry once
          await new Promise(resolve => setTimeout(resolve, 1000))
          const { data: { user: retryUser } } = await supabase.auth.getUser()

          if (!retryUser) {
            console.error('[Auth Callback] No user after retry')
            setStatus('Could not verify session. Redirecting...')
            setTimeout(() => { window.location.href = '/' }, 1500)
            return
          }

          if (cancelled) return
          await redirectByRole(supabase, retryUser, setStatus)
          return
        }

        if (cancelled) return
        await redirectByRole(supabase, user, setStatus)
      } catch (err) {
        console.error('[Auth Callback] Exception:', err)
        setStatus('Something went wrong. Redirecting...')
        setTimeout(() => { window.location.href = '/' }, 1500)
      }
    }

    handleAuth()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">{status}</p>
      </div>
    </div>
  )
}

async function redirectByRole(
  supabase: any,
  user: any,
  setStatus: (s: string) => void
) {
  setStatus('Checking your account...')

  try {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const roleList = (roles || []).map((r: any) => r.role)

    if (roleList.includes('admin') || roleList.includes('builder')) {
      setStatus('Welcome back! Opening dashboard...')
      window.location.href = '/builder'
    } else if (roleList.includes('buyer')) {
      setStatus('Welcome back! Opening dashboard...')
      window.location.href = '/my-dashboard'
    } else {
      setStatus('Welcome! Setting up your account...')
      window.location.href = '/builder'
    }
  } catch {
    // Role fetch failed — default redirect
    window.location.href = '/builder'
  }
}
