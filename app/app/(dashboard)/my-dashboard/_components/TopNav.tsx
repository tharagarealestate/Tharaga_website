"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Heart, Menu, X, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { listSaved } from '@/lib/saved'
import { getSupabase } from '@/lib/supabase'
import NotificationPanel from '../../_components/NotificationPanel'

function useSavedCount() {
  const [count, setCount] = React.useState<number>(() => (typeof window !== 'undefined' ? listSaved().length : 0))
  React.useEffect(() => {
    function refresh() {
      try { setCount(listSaved().length) } catch {}
    }
    const onStorage = (e: StorageEvent) => { if (e.key === 'thg_saved_v1') refresh() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    const id = window.setInterval(refresh, 3000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
      window.clearInterval(id)
    }
  }, [])
  return count
}

function useVisitsCount() {
  const [count, setCount] = React.useState<number>(0)
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (!cancelled) setCount(0); return }
        const nowISO = new Date().toISOString()
        // Try primary table name
        let c = 0
        try {
          const { count: c1, error: e1 } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gt('start_time', nowISO)
          if (!e1 && typeof c1 === 'number') c = c1
        } catch {}
        if (c === 0) {
          try {
            const { count: c2, error: e2 } = await supabase
              .from('site_visits')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .gt('visit_date', nowISO)
            if (!e2 && typeof c2 === 'number') c = c2
          } catch {}
        }
        if (!cancelled) setCount(c)
      } catch { if (!cancelled) setCount(0) }
    }
    load()
    const id = window.setInterval(load, 30000)
    return () => { cancelled = true; window.clearInterval(id) }
  }, [])
  return count
}

export default function TopNav() {
  const router = useRouter()
  const savedCount = useSavedCount()
  const visitsCount = useVisitsCount()
  const [query, setQuery] = React.useState('')
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        setUserEmail(user?.email ?? null)
      } catch { setUserEmail(null) }
    })()
  }, [])

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    try {
      const key = 'thg_recent_searches'
      const raw = localStorage.getItem(key)
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      const next = [q, ...arr.filter((s) => s !== q)].slice(0, 8)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
    router.push(`/property-listing/?q=${encodeURIComponent(q)}`)
  }

  const handleLogout = async () => {
    try {
      await getSupabase().auth.signOut()
    } catch {}
    window.location.reload()
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="sticky top-[60px] z-40 border-b border-gray-300 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 hidden md:block" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}>
        <div className="mx-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2">
          <Link href="/" className="shrink-0 font-semibold text-gray-900 text-sm sm:text-base transition-opacity hover:opacity-80">Tharaga</Link>
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 md:w-2/5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search properties..."
              className="w-full rounded-md border border-gray-300 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm shadow-sm focus:border-primary-600 focus:outline-none min-h-[44px]"
              aria-label="Search"
            />
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
            <Link href="/saved" className="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 sm:px-2.5 py-2 text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[44px]">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-gold-500" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.1rem] rounded-full bg-primary-600 px-1.5 text-center text-[10px] leading-4 text-white">{savedCount}</span>
              )}
              <span className="sr-only">Saved</span>
            </Link>
            <Link href="#" className="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 sm:px-2.5 py-2 text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[44px]">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
              {visitsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.1rem] rounded-full bg-primary-600 px-1.5 text-center text-[10px] leading-4 text-white">{visitsCount}</span>
              )}
              <span className="sr-only">Visits</span>
            </Link>
            <NotificationPanel />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 touch-manipulation"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {(userEmail || 'U').slice(0, 1).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
                  <div className="px-3 py-2 text-xs text-gray-500">{userEmail ?? 'Guest'}</div>
                  <Link href="/my-dashboard" className="block px-3 py-2 text-sm hover:bg-gray-50">My dashboard</Link>
                  <Link href="/saved" className="block px-3 py-2 text-sm hover:bg-gray-50">Saved</Link>
                  <Link href="/behavior-tracking" className="block px-3 py-2 text-sm hover:bg-gray-50">Behavior Analytics</Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sticky top-[60px] z-40 border-b border-gray-300 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:hidden" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}>
        <div className="mx-auto flex items-center justify-between px-3 py-2">
          {/* Left: Logo (20% width) */}
          <Link href="/" className="shrink-0 font-semibold text-gray-900 text-base transition-opacity hover:opacity-80">
            Tharaga
          </Link>

          {/* Right: User Icon & Hamburger Menu (40% width) */}
          <div className="flex items-center gap-2">
            {/* User Account Icon */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border-2 border-gray-700 bg-white transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="User account"
            >
              <span className="text-sm font-semibold text-gray-700">
                {(userEmail || 'U').slice(0, 1).toUpperCase()}
              </span>
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600"
                  >
                    <X className="w-6 h-6 text-white" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6 text-amber-500" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay & Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel - Slides from RIGHT */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'tween',
                duration: 0.35,
                ease: 'easeOut'
              }}
              className="fixed top-0 right-0 bottom-0 w-full bg-white z-50 overflow-y-auto md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <span className="text-xl font-bold text-gray-900">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-gray-700" aria-hidden="true" />
                </button>
              </div>

              <nav className="px-4 py-6 space-y-4">
                {/* Search */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0, duration: 0.3 }}
                >
                  <form onSubmit={handleSearchSubmit}>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search properties..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      aria-label="Search"
                    />
                  </form>
                </motion.div>

                {/* Menu Items */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                >
                  <Link
                    href="/saved"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-4 rounded-lg hover:bg-gray-50 transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-gold-500" />
                      <span className="text-base font-medium text-gray-900">Saved Properties</span>
                    </div>
                    {savedCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                        {savedCount}
                      </span>
                    )}
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <Link
                    href="#"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-4 rounded-lg hover:bg-gray-50 transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-gray-700" />
                      <span className="text-base font-medium text-gray-900">My Visits</span>
                    </div>
                    {visitsCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                        {visitsCount}
                      </span>
                    )}
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <Link
                    href="/my-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-4 rounded-lg hover:bg-gray-50 text-base font-medium text-gray-900 transition-all active:scale-[0.98]"
                  >
                    My Dashboard
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Link
                    href="/behavior-tracking"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-4 rounded-lg hover:bg-gray-50 text-base font-medium text-gray-900 transition-all active:scale-[0.98]"
                  >
                    Behavior Analytics
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="pt-4 border-t border-gray-200"
                >
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-4 rounded-lg bg-red-50 hover:bg-red-100 text-base font-medium text-red-600 transition-all active:scale-[0.98] text-left"
                  >
                    Log out
                  </button>
                </motion.div>
              </nav>

              {/* Menu Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="text-xs text-gray-500 text-center">
                    {userEmail ?? 'Guest'}
                  </div>
                  <div className="text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Tharaga
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
