'use client'

/**
 * /auth/signup — Builder signup entry point.
 *
 * Opens the AuthModal pre-positioned on the "Sign up" tab.
 * After successful sign-up, Supabase redirects through /auth/callback → /builder.
 */

import { useEffect } from 'react'
import { openAuthModalSignup } from '@/components/auth/AuthModal'

export default function SignupPage() {
  useEffect(() => {
    // Small delay so the modal (mounted in root layout) is ready
    const t = setTimeout(() => openAuthModalSignup('/builder'), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Neural background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-600/6 blur-[140px]" />
      </div>

      {/* Fallback content visible while modal opens */}
      <div className="relative z-10 text-center space-y-4">
        <div className="w-10 h-10 mx-auto">
          <div className="w-full h-full rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        </div>
        <p className="text-zinc-500 text-sm">Opening sign up…</p>
        <a
          href="/"
          className="block text-xs text-zinc-600 hover:text-zinc-400 underline underline-offset-4 transition-colors"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  )
}
