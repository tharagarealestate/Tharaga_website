'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  LogIn,
  LogOut,
  LayoutDashboard,
  User,
  TrendingUp,
  Calculator,
  Building2,
  Shield,
  Target,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { openAuthModal } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'

const toolItems = [
  { label: 'ROI Calculator', href: '/tools/roi', icon: TrendingUp, desc: 'Returns analysis' },
  { label: 'EMI Calculator', href: '/tools/emi', icon: Calculator, desc: 'Loan payments' },
  { label: 'Budget Planner', href: '/tools/budget-planner', icon: Building2, desc: 'Affordability' },
  { label: 'Loan Eligibility', href: '/tools/loan-eligibility', icon: Shield, desc: 'Bank check' },
  { label: 'Neighborhood Finder', href: '/tools/neighborhood-finder', icon: Target, desc: 'Area match' },
  { label: 'Property Valuation', href: '/tools/property-valuation', icon: BarChart3, desc: 'Market value' },
]

const navLinks = [
  { label: 'Properties', href: '/property-listing' },
  { label: 'Tools', href: '/tools/roi', hasDropdown: true },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileToolsExpanded, setMobileToolsExpanded] = useState(false)
  const toolsRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  // Auth state
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const dashboardPath = '/builder'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setToolsOpen(false)
    setUserMenuOpen(false)
    setMobileToolsExpanded(false)
  }, [pathname])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auth
  useEffect(() => {
    let mounted = true

    async function loadUser(authUser: any) {
      if (!authUser) {
        if (mounted) { setUser(null); setDisplayName(''); setUserEmail('') }
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
      try {
        const supabase = getSupabase()
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', authUser.id).single()
        if (mounted && profile?.full_name) setDisplayName(profile.full_name)
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

    try {
      const supabase = getSupabase()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        loadUser(session?.user || null)
      })
      return () => { mounted = false; subscription.unsubscribe() }
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
      setUser(null); setDisplayName(''); setUserEmail('')
      router.push('/')
    } catch {}
  }, [router])

  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
        scrolled
          ? 'bg-zinc-950/85 backdrop-blur-2xl border-b border-zinc-800/60 shadow-lg shadow-black/10'
          : 'bg-transparent'
      )}
    >
      <div className="container-page">
        <nav className="flex items-center justify-between h-16 md:h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              <Sparkles className="w-4.5 h-4.5 text-zinc-950" />
            </div>
            <span className="text-xl font-extrabold font-display text-zinc-100 tracking-tight">
              Tharaga
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.hasDropdown ? (
                  /* Tools dropdown */
                  <div ref={toolsRef} className="relative">
                    <button
                      onClick={() => setToolsOpen(!toolsOpen)}
                      onMouseEnter={() => setToolsOpen(true)}
                      className={cn(
                        'flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                        toolsOpen
                          ? 'text-zinc-100 bg-zinc-800/60'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                      )}
                    >
                      {link.label}
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', toolsOpen && 'rotate-180')} />
                    </button>

                    {toolsOpen && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-2 shadow-2xl shadow-black/30 animate-scale-in"
                        onMouseLeave={() => setToolsOpen(false)}
                      >
                        {toolItems.map((tool) => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-zinc-800/60 transition-colors group/item"
                          >
                            <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 group-hover/item:bg-amber-500/10 group-hover/item:text-amber-400 transition-colors">
                              <tool.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-zinc-300 font-medium group-hover/item:text-zinc-100 transition-colors">{tool.label}</p>
                              <p className="text-xs text-zinc-600">{tool.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      'px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                      pathname === link.href
                        ? 'text-zinc-100 bg-zinc-800/60'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                    )}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-zinc-300 max-w-[120px] truncate hidden lg:block">
                    {displayName}
                  </span>
                  <ChevronDown className={cn('w-3 h-3 text-zinc-500 transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-zinc-800/60">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{displayName}</p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={dashboardPath}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/builder"
                  className="px-3.5 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800/40 transition-all hidden lg:block"
                >
                  Builder Portal
                </Link>
                <Button variant="primary" size="sm" onClick={handleSignIn} className="rounded-xl shadow-md shadow-amber-500/15">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In
                </Button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/60 animate-slide-up">
          <div className="container-page py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.hasDropdown ? (
                  <>
                    <button
                      onClick={() => setMobileToolsExpanded(!mobileToolsExpanded)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-xl transition-colors"
                    >
                      {link.label}
                      <ChevronDown className={cn('w-4 h-4 text-zinc-500 transition-transform', mobileToolsExpanded && 'rotate-180')} />
                    </button>
                    {mobileToolsExpanded && (
                      <div className="pl-2 pb-2 space-y-0.5 animate-fade-in">
                        {toolItems.map((tool) => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 rounded-xl transition-colors"
                          >
                            <tool.icon className="w-4 h-4" />
                            {tool.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      'block px-4 py-3 text-sm font-medium rounded-xl transition-colors',
                      pathname === link.href
                        ? 'text-zinc-100 bg-zinc-800/40'
                        : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/40'
                    )}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}

            <div className="pt-4 mt-4 border-t border-zinc-800/60">
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-sm font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{displayName}</p>
                      <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                  <Link
                    href={dashboardPath}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-xl transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-2 px-2">
                  <Link
                    href="/builder"
                    className="block text-center px-4 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl transition-colors"
                  >
                    Builder Portal
                  </Link>
                  <Button variant="primary" size="md" className="w-full rounded-xl" onClick={handleSignIn}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
