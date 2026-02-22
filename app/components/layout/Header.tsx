'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronDown, Sparkles, LogIn, LogOut, LayoutDashboard, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { openAuthModal } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'

const navLinks = [
  { label: 'Properties', href: '/property-listing' },
  {
    label: 'Tools',
    href: '/tools/roi',
    children: [
      { label: 'ROI Calculator', href: '/tools/roi' },
      { label: 'EMI Calculator', href: '/tools/emi' },
      { label: 'Budget Planner', href: '/tools/budget-planner' },
      { label: 'Loan Eligibility', href: '/tools/loan-eligibility' },
      { label: 'Neighborhood Finder', href: '/tools/neighborhood-finder' },
      { label: 'Property Valuation', href: '/tools/property-valuation' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Auth state
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [dashboardPath, setDashboardPath] = useState('/builder')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(null)
    setUserMenuOpen(false)
  }, [pathname])

  // Check auth state on mount + listen for changes
  useEffect(() => {
    let mounted = true

    async function loadUser(authUser: any) {
      if (!authUser) {
        if (mounted) {
          setUser(null)
          setDisplayName('')
          setUserEmail('')
        }
        return
      }

      if (mounted) {
        setUser(authUser)
        setUserEmail(authUser.email || '')
        setDisplayName(
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] || 'User'
        )
      }

      // Fetch profile for better display name
      try {
        const supabase = getSupabase()
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', authUser.id)
          .single()
        if (mounted && profile?.full_name) {
          setDisplayName(profile.full_name)
        }
      } catch {}

      // Fetch role for dashboard path
      try {
        const supabase = getSupabase()
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
        const roleList = (roles || []).map((r: any) => r.role)
        if (mounted) {
          if (roleList.includes('buyer')) {
            setDashboardPath('/my-dashboard')
          } else {
            setDashboardPath('/builder')
          }
        }
      } catch {}
    }

    async function init() {
      try {
        const supabase = getSupabase()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        loadUser(authUser)
      } catch {}
    }

    init()

    // Listen for auth state changes (sign in, sign out, token refresh)
    try {
      const supabase = getSupabase()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        loadUser(session?.user || null)
      })
      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    } catch {
      return () => { mounted = false }
    }
  }, [])

  const handleSignIn = useCallback(() => {
    setMobileOpen(false)
    openAuthModal()
  }, [])

  const handleSignOut = useCallback(async () => {
    setUserMenuOpen(false)
    setMobileOpen(false)
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
      setUser(null)
      setDisplayName('')
      setUserEmail('')
      router.push('/')
    } catch {}
  }, [router])

  // User initials for avatar
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-200',
        scrolled
          ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50'
          : 'bg-transparent'
      )}
    >
      <div className="container-page">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-lg font-bold font-display text-zinc-100">
              Tharaga
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                {link.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(link.label)}
                    onMouseLeave={() => setDropdownOpen(null)}
                  >
                    <button
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                        'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                      )}
                    >
                      {link.label}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {dropdownOpen === link.label && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-xl animate-scale-in">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      pathname === link.href
                        ? 'text-zinc-100 bg-zinc-800/50'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    )}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right side — Auth state */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              /* ── Signed in: avatar + dropdown ── */
              <div
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-zinc-300 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-sm font-medium text-zinc-200 truncate">{displayName}</p>
                      <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={dashboardPath}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Signed out: Sign In button ── */
              <Button variant="primary" size="sm" onClick={handleSignIn}>
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800 animate-slide-up">
          <div className="container-page py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block px-3 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg"
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="pl-4 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 rounded-lg"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-zinc-800">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-sm font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{displayName}</p>
                      <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                  <Link
                    href={dashboardPath}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-zinc-800/50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <Button variant="primary" size="md" className="w-full" onClick={handleSignIn}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
