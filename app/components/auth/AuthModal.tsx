'use client'

/**
 * THARAGA — Neural Auth Modal
 *
 * Replaces all previous login containers / pages.
 * Handles: email/password sign-in, sign-up, Google OAuth.
 *
 * Loop fix: after successful auth → window.location.href = '/builder'
 * (hard navigation = clean page load = no BuilderAuthProvider race conditions)
 *
 * Exports (backwards-compatible with all existing callers):
 *   openAuthModal()   — opens the modal
 *   closeAuthModal()  — closes the modal
 *   AuthModal         — React component, mounted once in layout.tsx
 */

import {
  useState, useEffect, useRef, useCallback,
  type ChangeEvent, type FormEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import {
  X, Eye, EyeOff, Mail, Lock, User, Building2,
  ArrowRight, CheckCircle2, Loader2,
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

// ─── Global open / close API ─────────────────────────────────────────────────
let _open:  (() => void) | null = null
let _close: (() => void) | null = null

// Capture where the modal was opened from so succeed() / handleGoogle() can
// redirect back there. Callers can pass an explicit `next` path (e.g. '/builder')
// to override the current pathname.
let _sourcePathname = '/'

export function openAuthModal(next?: string) {
  if (typeof window !== 'undefined') {
    _sourcePathname = next ?? window.location.pathname
  }
  _open?.()
}
export function closeAuthModal() { _close?.() }

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab   = 'signin' | 'signup'
type Stage = 'idle' | 'loading' | 'success' | 'error'

// ─── Animation variants ───────────────────────────────────────────────────────
const backdropV = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
}
const cardV = {
  hidden:  { opacity: 0, scale: 0.93, y: 28 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.2,  ease: 'easeIn' } },
}
const fieldV = {
  hidden:  { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.055, duration: 0.26, ease: 'easeOut' },
  }),
}
const tabSlideV = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 22 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -22, transition: { duration: 0.15 } }),
}

// ─── Google SVG icon ─────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  icon, label, children, action,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="group space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        <span className="text-zinc-600">{icon}</span>
        {label}
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/40 group-focus-within:border-amber-500/40 group-focus-within:bg-zinc-800/80 transition-all duration-200">
        {children}
        {action}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AuthModal() {
  const [open,       setOpen]       = useState(false)
  const [tab,        setTab]        = useState<Tab>('signin')
  const [tabDir,     setTabDir]     = useState(1)
  const [stage,      setStage]      = useState<Stage>('idle')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [showPw2,    setShowPw2]    = useState(false)
  const [mounted,    setMounted]    = useState(false)

  // Sign-in
  const [siEmail,    setSiEmail]    = useState('')
  const [siPassword, setSiPassword] = useState('')

  // Sign-up
  const [suName,     setSuName]     = useState('')
  const [suEmail,    setSuEmail]    = useState('')
  const [suPw,       setSuPw]       = useState('')
  const [suPw2,      setSuPw2]      = useState('')

  const cardShake = useAnimationControls()
  const firstRef  = useRef<HTMLInputElement>(null)

  // ── Register globals ──────────────────────────────────────────────────────
  useEffect(() => {
    _open  = () => { setOpen(true); setStage('idle'); setErrorMsg('') }
    _close = () => setOpen(false)
    setMounted(true)
    ;(window as any).__thgOpenAuthModal = () => { setOpen(true); setStage('idle') }
    ;(window as any).openAuthModal      = () => { setOpen(true); setStage('idle') }
    try {
      const last = localStorage.getItem('__tharaga_last_email')
      if (last) setSiEmail(last)
    } catch {}
    return () => {
      _open = null; _close = null
      delete (window as any).__thgOpenAuthModal
      delete (window as any).openAuthModal
    }
  }, [])

  // Auto-focus first field
  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 320)
  }, [open, tab])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const switchTab = useCallback((next: Tab) => {
    if (next === tab) return
    setTabDir(next === 'signup' ? 1 : -1)
    setTab(next)
    setStage('idle')
    setErrorMsg('')
    setShowPw(false); setShowPw2(false)
  }, [tab])

  const fail = useCallback(async (msg: string) => {
    setErrorMsg(msg)
    setStage('error')
    await cardShake.start({
      x: [0, -7, 7, -5, 5, -3, 0],
      transition: { duration: 0.38, ease: 'easeInOut' },
    })
  }, [cardShake])

  // After success — redirect to builder if that's the source, otherwise stay on current page
  const succeed = useCallback((email = '') => {
    if (email) {
      try { localStorage.setItem('__tharaga_last_email', email) } catch {}
    }
    setStage('success')

    const isBuilderFlow = _sourcePathname.startsWith('/builder')

    if (isBuilderFlow) {
      // Hard navigate to builder — eliminates BuilderAuthProvider race conditions
      setSuccessMsg('Signed in! Loading your dashboard…')
      setTimeout(() => { window.location.href = '/builder' }, 900)
    } else {
      // Stay on current page — header updates via onAuthStateChange automatically
      setSuccessMsg('Signed in! Welcome back.')
      setTimeout(() => { _close?.() }, 1200)
    }
  }, [])

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = useCallback(async () => {
    setStage('loading')
    setErrorMsg('')
    try {
      const supabase = getSupabase()
      // Use the page that opened the modal as the post-auth redirect target
      const nextPath = _sourcePathname.startsWith('/builder') ? '/builder' : _sourcePathname || '/'
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) await fail(error.message)
    } catch (e: any) {
      await fail(e?.message || 'Google sign-in failed. Please try again.')
    }
  }, [fail])

  // ── Email sign-in ─────────────────────────────────────────────────────────
  const handleSignIn = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (!siEmail.trim() || !siPassword) { await fail('Please fill in all fields'); return }
    setStage('loading'); setErrorMsg('')
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: siEmail.trim().toLowerCase(),
        password: siPassword,
      })
      if (error) { await fail(error.message); return }
      if (!data.user) { await fail('Sign-in failed — please try again'); return }
      succeed(siEmail.trim().toLowerCase())
    } catch (e: any) {
      await fail(e?.message || 'Something went wrong. Please try again.')
    }
  }, [siEmail, siPassword, fail, succeed])

  // ── Email sign-up ─────────────────────────────────────────────────────────
  const handleSignUp = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (!suName.trim())         { await fail('Please enter your name'); return }
    if (!suEmail.trim())        { await fail('Please enter your email'); return }
    if (suPw.length < 8)        { await fail('Password must be at least 8 characters'); return }
    if (suPw !== suPw2)         { await fail('Passwords do not match'); return }
    setStage('loading'); setErrorMsg('')
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signUp({
        email: suEmail.trim().toLowerCase(),
        password: suPw,
        options: {
          data: { full_name: suName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(_sourcePathname.startsWith('/builder') ? '/builder' : _sourcePathname || '/')}`,
        },
      })
      if (error) { await fail(error.message); return }

      // No session → email confirmation required
      if (data.user && !data.session) {
        setStage('success')
        setSuccessMsg(`check-email:${suEmail.trim()}`)
        return
      }

      succeed(suEmail.trim().toLowerCase())
    } catch (e: any) {
      await fail(e?.message || 'Something went wrong. Please try again.')
    }
  }, [suName, suEmail, suPw, suPw2, fail, succeed])

  // ── Render ────────────────────────────────────────────────────────────────
  if (!mounted) return null

  const isLoading   = stage === 'loading'
  const isSuccess   = stage === 'success'
  const checkEmail  = isSuccess && successMsg.startsWith('check-email:')
  const checkAddr   = checkEmail ? successMsg.replace('check-email:', '') : ''

  // Password strength (0-4)
  const pwStrength = [4, 6, 8, 12].filter(n => suPw.length >= n).length

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="auth-bg"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[300] flex items-center justify-center px-4"
          style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(14px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading && !isSuccess) setOpen(false)
          }}
        >
          {/* ── Ambient background orbs ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x:[0,50,-30,0], y:[0,-40,25,0], scale:[1,1.12,0.9,1] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-48 -left-48 w-[550px] h-[550px] rounded-full bg-amber-500/6 blur-[130px]"
            />
            <motion.div
              animate={{ x:[0,-35,20,0], y:[0,30,-40,0], scale:[1,0.88,1.1,1] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
              className="absolute -bottom-48 -right-40 w-[500px] h-[500px] rounded-full bg-amber-600/5 blur-[120px]"
            />
          </div>

          {/* ── Card ── */}
          <motion.div
            key="auth-card"
            variants={cardV}
            initial="hidden"
            animate={[cardShake, 'visible'] as any}
            exit="exit"
            className="relative z-10 w-full max-w-[400px]"
          >
            {/* Amber glow border */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/22 via-amber-400/6 to-transparent pointer-events-none" />

            <div className="relative rounded-2xl bg-zinc-900/92 backdrop-blur-2xl border border-white/[0.065] overflow-y-auto max-h-[90svh] shadow-2xl shadow-black/60">
              {/* Top amber accent line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

              {/* ── Success overlay ── */}
              <AnimatePresence mode="wait">
                {isSuccess && (
                  <motion.div
                    key="success-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.3 } }}
                    className="px-8 py-14 flex flex-col items-center text-center gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.12 }}
                      className="w-16 h-16 rounded-full bg-amber-500/12 border border-amber-500/25 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-amber-400" />
                    </motion.div>

                    {checkEmail ? (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0, transition:{delay:0.2} }} className="space-y-2">
                        <h2 className="text-lg font-bold text-zinc-100">Check your inbox</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px]">
                          Confirmation sent to{' '}
                          <span className="text-amber-400 font-medium">{checkAddr}</span>.
                          Click the link, then sign in.
                        </p>
                        <button
                          onClick={() => { setStage('idle'); switchTab('signin') }}
                          className="mt-3 text-xs text-zinc-500 hover:text-amber-400 transition-colors underline underline-offset-2"
                        >
                          Back to sign in
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0, transition:{delay:0.2} }} className="space-y-2">
                        <h2 className="text-lg font-bold text-zinc-100">You're in!</h2>
                        <p className="text-sm text-zinc-400">Loading your dashboard…</p>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <div className="w-3.5 h-3.5 rounded-full border-t-2 border-amber-500 animate-spin" />
                          <span className="text-xs text-zinc-600">Redirecting</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── Form ── */}
                {!isSuccess && (
                  <motion.div key="form-content" initial={{ opacity:0 }} animate={{ opacity:1 }}>

                    {/* Header row */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/60">Tharaga</p>
                          <p className="text-sm font-bold text-zinc-100 leading-tight">Builder Platform</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                        aria-label="Close"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70 transition-all disabled:opacity-30"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 mb-5">
                      <div className="relative flex bg-zinc-800/45 rounded-xl p-1 gap-1">
                        <motion.div
                          layoutId="auth-tab-pill"
                          className="absolute inset-y-1 rounded-lg bg-zinc-700/55 border border-white/[0.055]"
                          style={{
                            left:  tab === 'signin' ? '4px' : undefined,
                            right: tab === 'signup' ? '4px' : undefined,
                            width: 'calc(50% - 4px)',
                          }}
                          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        />
                        {(['signin', 'signup'] as Tab[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => switchTab(t)}
                            disabled={isLoading}
                            className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 ${
                              tab === t ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {t === 'signin' ? 'Sign In' : 'Create Account'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab body */}
                    <div className="px-6 pb-6 overflow-hidden">
                      <AnimatePresence mode="wait" custom={tabDir}>
                        <motion.div
                          key={tab}
                          custom={tabDir}
                          variants={tabSlideV}
                          initial="enter"
                          animate="center"
                          exit="exit"
                        >
                          {/* Google button (both tabs) */}
                          <motion.div custom={0} variants={fieldV} initial="hidden" animate="visible">
                            <button
                              type="button"
                              onClick={handleGoogle}
                              disabled={isLoading}
                              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-zinc-700/55 bg-zinc-800/30 hover:bg-zinc-800/60 hover:border-zinc-600/55 text-sm font-medium text-zinc-300 transition-all duration-200 disabled:opacity-40"
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <GoogleIcon />}
                              Continue with Google
                            </button>
                          </motion.div>

                          {/* Divider */}
                          <motion.div custom={1} variants={fieldV} initial="hidden" animate="visible"
                            className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-zinc-800/80" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">or</span>
                            <div className="flex-1 h-px bg-zinc-800/80" />
                          </motion.div>

                          {/* ── Sign In ── */}
                          {tab === 'signin' && (
                            <form onSubmit={handleSignIn} className="space-y-3">
                              <motion.div custom={2} variants={fieldV} initial="hidden" animate="visible">
                                <Field icon={<Mail className="w-3.5 h-3.5" />} label="Email">
                                  <input
                                    ref={firstRef}
                                    type="email"
                                    value={siEmail}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSiEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    disabled={isLoading}
                                    autoComplete="email"
                                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40"
                                  />
                                </Field>
                              </motion.div>

                              <motion.div custom={3} variants={fieldV} initial="hidden" animate="visible">
                                <Field
                                  icon={<Lock className="w-3.5 h-3.5" />}
                                  label="Password"
                                  action={
                                    <button type="button" tabIndex={-1} onClick={() => setShowPw(p => !p)}
                                      className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  }
                                >
                                  <input
                                    type={showPw ? 'text' : 'password'}
                                    value={siPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSiPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40"
                                  />
                                </Field>
                              </motion.div>

                              <AnimatePresence>
                                {stage === 'error' && errorMsg && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="text-xs text-red-400 bg-red-500/8 border border-red-500/18 rounded-lg px-3 py-2 leading-relaxed"
                                  >{errorMsg}</motion.p>
                                )}
                              </AnimatePresence>

                              <motion.div custom={4} variants={fieldV} initial="hidden" animate="visible">
                                <button
                                  type="submit"
                                  disabled={isLoading}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/18 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isLoading
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                                  }
                                </button>
                              </motion.div>

                              <motion.p custom={5} variants={fieldV} initial="hidden" animate="visible"
                                className="text-center text-[11px] text-zinc-600 pt-0.5">
                                No account?{' '}
                                <button type="button" onClick={() => switchTab('signup')}
                                  className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">
                                  Create one free
                                </button>
                              </motion.p>
                            </form>
                          )}

                          {/* ── Sign Up ── */}
                          {tab === 'signup' && (
                            <form onSubmit={handleSignUp} className="space-y-3">
                              <motion.div custom={2} variants={fieldV} initial="hidden" animate="visible">
                                <Field icon={<User className="w-3.5 h-3.5" />} label="Full Name">
                                  <input
                                    ref={firstRef}
                                    type="text"
                                    value={suName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSuName(e.target.value)}
                                    placeholder="Your full name"
                                    disabled={isLoading}
                                    autoComplete="name"
                                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40"
                                  />
                                </Field>
                              </motion.div>

                              <motion.div custom={3} variants={fieldV} initial="hidden" animate="visible">
                                <Field icon={<Mail className="w-3.5 h-3.5" />} label="Work Email">
                                  <input
                                    type="email"
                                    value={suEmail}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSuEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    disabled={isLoading}
                                    autoComplete="email"
                                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40"
                                  />
                                </Field>
                              </motion.div>

                              <motion.div custom={4} variants={fieldV} initial="hidden" animate="visible">
                                <Field
                                  icon={<Lock className="w-3.5 h-3.5" />}
                                  label="Password"
                                  action={
                                    <button type="button" tabIndex={-1} onClick={() => setShowPw(p => !p)}
                                      className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  }
                                >
                                  <input
                                    type={showPw ? 'text' : 'password'}
                                    value={suPw}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSuPw(e.target.value)}
                                    placeholder="Min 8 characters"
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40"
                                  />
                                </Field>
                                {/* Strength bar */}
                                {suPw.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {[0,1,2,3].map(i => (
                                      <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                                        i < pwStrength
                                          ? pwStrength <= 1 ? 'bg-red-500'
                                            : pwStrength <= 2 ? 'bg-orange-400'
                                            : pwStrength <= 3 ? 'bg-amber-400'
                                            : 'bg-emerald-500'
                                          : 'bg-zinc-800'
                                      }`} />
                                    ))}
                                  </div>
                                )}
                              </motion.div>

                              <motion.div custom={5} variants={fieldV} initial="hidden" animate="visible">
                                <Field
                                  icon={<Lock className="w-3.5 h-3.5" />}
                                  label="Confirm Password"
                                  action={
                                    <button type="button" tabIndex={-1} onClick={() => setShowPw2(p => !p)}
                                      className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                                      {showPw2 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  }
                                >
                                  <input
                                    type={showPw2 ? 'text' : 'password'}
                                    value={suPw2}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSuPw2(e.target.value)}
                                    placeholder="Repeat password"
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40"
                                  />
                                </Field>
                              </motion.div>

                              <AnimatePresence>
                                {stage === 'error' && errorMsg && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="text-xs text-red-400 bg-red-500/8 border border-red-500/18 rounded-lg px-3 py-2 leading-relaxed"
                                  >{errorMsg}</motion.p>
                                )}
                              </AnimatePresence>

                              <motion.div custom={6} variants={fieldV} initial="hidden" animate="visible">
                                <button
                                  type="submit"
                                  disabled={isLoading}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/18 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isLoading
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
                                  }
                                </button>
                              </motion.div>

                              <motion.div custom={7} variants={fieldV} initial="hidden" animate="visible" className="space-y-1">
                                <p className="text-center text-[11px] text-zinc-600">
                                  By signing up you agree to our{' '}
                                  <a href="/terms" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">Terms</a>
                                  {' & '}
                                  <a href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">Privacy Policy</a>
                                </p>
                                <p className="text-center text-[11px] text-zinc-600">
                                  Have an account?{' '}
                                  <button type="button" onClick={() => switchTab('signin')}
                                    className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">
                                    Sign in
                                  </button>
                                </p>
                              </motion.div>
                            </form>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
