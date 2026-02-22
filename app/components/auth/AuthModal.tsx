'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

// ─── Global open/close API ───────────────────────────────
let _openModal: (() => void) | null = null
let _closeModal: (() => void) | null = null

export function openAuthModal() {
  _openModal?.()
}

export function closeAuthModal() {
  _closeModal?.()
}

// ─── Component ───────────────────────────────────────────
export function AuthModal() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showSignupPw, setShowSignupPw] = useState(false)
  const [showSignupConfirm, setShowSignupConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Register global open/close
  useEffect(() => {
    _openModal = () => setOpen(true)
    _closeModal = () => setOpen(false)
    setMounted(true)

    // Expose globally so non-React code (microsites, snippets) can trigger the modal
    ;(window as any).__thgOpenAuthModal = () => setOpen(true)
    ;(window as any).openAuthModal = () => setOpen(true)

    // Prefill last email
    try {
      const last = localStorage.getItem('__tharaga_last_email')
      if (last) setEmail(last)
    } catch {}

    return () => {
      _openModal = null
      _closeModal = null
      delete (window as any).__thgOpenAuthModal
      delete (window as any).openAuthModal
    }
  }, [])

  // Focus email on open, lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => emailRef.current?.focus(), 100)
      setMsg(null)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const mapAuthError = (err: any): string => {
    const raw = (err?.message || '').toLowerCase()
    if (raw.includes('invalid login credentials')) return 'Wrong email or password'
    if (raw.includes('email not confirmed')) return 'Email not verified. Check your inbox.'
    if (raw.includes('over quota') || raw.includes('rate limit')) return 'Too many attempts. Try again later.'
    if (raw.includes('network') || raw.includes('fetch')) return 'Network error. Check your connection.'
    return err?.message || 'Authentication failed'
  }

  // ─── Sign In ─────────────────────────────────
  const handleSignIn = useCallback(async () => {
    const e = email.trim().toLowerCase()
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setMsg({ text: 'Enter a valid email', ok: false })
      return
    }
    if (!password) {
      setMsg({ text: 'Enter your password', ok: false })
      return
    }
    setLoading(true)
    setMsg({ text: 'Signing in...', ok: true })
    try {
      localStorage.setItem('__tharaga_last_email', e)
    } catch {}
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password })
      if (error) {
        setMsg({ text: mapAuthError(error), ok: false })
        if ((error.message || '').toLowerCase().includes('email not confirmed')) {
          try { await supabase.auth.resend({ type: 'signup', email: e }) } catch {}
        }
        setLoading(false)
        return
      }
      setMsg({ text: 'Signed in!', ok: true })
      setLoading(false)

      // Role-based redirect
      const user = data?.user
      if (user) {
        try {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
          const roleList = (roles || []).map((r: any) => r.role)
          setTimeout(() => {
            setOpen(false)
            if (roleList.includes('admin') || roleList.includes('builder')) {
              window.location.href = '/builder'
            } else if (roleList.includes('buyer')) {
              window.location.href = '/my-dashboard'
            } else {
              window.location.href = '/builder'
            }
          }, 600)
        } catch {
          setTimeout(() => {
            setOpen(false)
            window.location.href = '/builder'
          }, 600)
        }
      }
    } catch (err: any) {
      setMsg({ text: mapAuthError(err), ok: false })
      setLoading(false)
    }
  }, [email, password])

  // ─── Sign Up ─────────────────────────────────
  const handleSignUp = useCallback(async () => {
    const e = signupEmail.trim().toLowerCase()
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setMsg({ text: 'Enter a valid email', ok: false })
      return
    }
    if (!signupPassword || signupPassword.length < 8) {
      setMsg({ text: 'Password must be at least 8 characters', ok: false })
      return
    }
    if (signupPassword !== signupConfirm) {
      setMsg({ text: 'Passwords do not match', ok: false })
      return
    }
    setLoading(true)
    setMsg({ text: 'Creating account...', ok: true })
    try {
      localStorage.setItem('__tharaga_last_email', e)
    } catch {}
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signUp({ email: e, password: signupPassword })
      if (error) {
        setMsg({ text: error.message, ok: false })
        setLoading(false)
        return
      }
      setMsg({ text: 'Account created! Check your email to verify.', ok: true })
      setLoading(false)
      // Switch to sign-in tab
      setEmail(e)
      setTimeout(() => setTab('signin'), 2000)
    } catch (err: any) {
      setMsg({ text: err?.message || 'Signup failed', ok: false })
      setLoading(false)
    }
  }, [signupEmail, signupPassword, signupConfirm])

  // ─── Google OAuth ────────────────────────────
  const handleGoogle = useCallback(async () => {
    setLoading(true)
    setMsg({ text: 'Redirecting to Google...', ok: true })
    try {
      const supabase = getSupabase()
      const redirectTo = `${window.location.origin}/login_signup_glassdrop/?post_auth=1&parent_origin=${encodeURIComponent(window.location.origin)}`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
      })
      if (error || !data?.url) {
        setMsg({ text: 'Could not start Google sign in', ok: false })
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setMsg({ text: 'Could not start Google sign in', ok: false })
      setLoading(false)
    }
  }, [])

  // Enter key on forms
  const onKeySignIn = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSignIn() }
  const onKeySignUp = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSignUp() }

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483646] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-[420px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pt-8">
          {/* Title */}
          <h2 className="text-xl font-bold text-zinc-100 mb-1">Sign in</h2>
          <p className="text-sm text-zinc-500 mb-5">
            Browse only approved builder projects — safe, transparent, and verified
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => { setTab('signin'); setMsg(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setMsg(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* ──── Sign In Form ──── */}
          {tab === 'signin' && (
            <div className="space-y-4" onKeyDown={onKeySignIn}>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Password
                  <span className="text-zinc-600 ml-1 font-normal">(optional — use Magic Link for fastest login)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <a href="/Reset_password/" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign in
              </button>
            </div>
          )}

          {/* ──── Sign Up Form ──── */}
          {tab === 'signup' && (
            <div className="space-y-4" onKeyDown={onKeySignUp}>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showSignupPw ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPw(!showSignupPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showSignupConfirm ? 'text' : 'password'}
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirm(!showSignupConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showSignupConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create account
              </button>
            </div>
          )}

          {/* Message */}
          {msg && (
            <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {msg.text}
            </p>
          )}

          {/* Divider */}
          <div className="my-5 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-4 text-center text-xs text-zinc-600">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
