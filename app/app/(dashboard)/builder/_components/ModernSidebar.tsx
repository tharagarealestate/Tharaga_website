"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase'
import { useTrialStatus } from './TrialStatusManager'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Search,
  Sparkles,
  Plug,
  CreditCard,
  Shield,
  ChevronLeft,
  HelpCircle,
  Workflow,
  UserCircle,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | null
  kbd?: string
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

interface LeadCountData {
  total: number
  hot: number
  warm: number
}

/**
 * ModernSidebar — Supabase-inspired dashboard navigation
 *
 * Design:
 * - Organized into clear groups: Core, Manage, Engage, Insights
 * - Back button returns to homepage
 * - Settings/integrations pinned at bottom
 * - Active state: left amber border + subtle bg tint
 * - Flat items, no dropdowns
 * - Keyboard shortcut hints on hover
 * - Search with / shortcut
 */
export function ModernSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentSection, setCurrentSection] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { isTrial } = useTrialStatus()

  // Track current section from URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateSection = () => {
      const params = new URLSearchParams(window.location.search)
      const section = params.get('section') || (pathname === '/builder' ? 'overview' : '')
      setCurrentSection(section)
    }
    updateSection()

    const handleSectionChange = (e: any) => {
      if (e.detail?.section) setCurrentSection(e.detail.section)
    }
    window.addEventListener('dashboard-section-change', handleSectionChange)
    window.addEventListener('popstate', updateSection)
    return () => {
      window.removeEventListener('dashboard-section-change', handleSectionChange)
      window.removeEventListener('popstate', updateSection)
    }
  }, [pathname])

  // Check admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser()
        setIsAdmin(user?.email === 'tharagarealestate@gmail.com')
      } catch { /* silently fail */ }
    }
    checkAdmin()
  }, [])

  // Fetch lead count
  useEffect(() => {
    let mounted = true
    async function fetchLeadCount() {
      try {
        const supabaseClient = (typeof window !== 'undefined' && (window as any).supabase) || getSupabase()
        const { data: { session } } = await supabaseClient.auth.getSession()
        const token = session?.access_token
        const headers: HeadersInit = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/builder/leads?limit=1', { credentials: 'include', headers })
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          const leads = data?.data?.leads || []
          setLeadCount({
            total: leads.length || 0,
            hot: leads.filter((l: any) => l.category === 'Hot Lead').length || 0,
            warm: leads.filter((l: any) => l.category === 'Warm Lead').length || 0,
          })
        }
      } catch { /* silently fail */ } finally {
        if (mounted) setIsLoadingCount(false)
      }
    }
    fetchLeadCount()
    return () => { mounted = false }
  }, [])

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchFocused && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('[data-sidebar-search]')
        input?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchFocused])

  // Section URL mapping
  const routeToSectionMap: Record<string, string> = {
    '/builder': 'overview',
    '/builder/leads': 'leads',
    '/builder/properties': 'properties',
    '/builder/properties/performance': 'properties',
    '/builder/pipeline': 'pipeline',
    '/builder/viewings': 'viewings',
    '/builder/contacts': 'contacts',
    '/builder/messaging': 'client-outreach',
    '/builder/analytics': 'analytics',
    '/builder/revenue': 'revenue',
  }

  // Client-side navigation
  const handleNavigation = useCallback((href: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    if (typeof window === 'undefined') return

    const currentHref = window.location.pathname + window.location.search
    if (currentHref === href || currentHref === href + '/') return

    let section: string | null = null
    if (href.startsWith('/builder?section=')) {
      section = href.split('?section=')[1]?.split('&')[0] || null
    } else {
      section = routeToSectionMap[href] || null
    }

    if (section) {
      router.push(`/builder?section=${section}`, { scroll: false })
      window.dispatchEvent(new CustomEvent('dashboard-section-change', { detail: { section } }))
    } else if (href.startsWith('/builder/')) {
      router.push(href, { scroll: false })
    } else {
      window.location.href = href
    }
  }, [router])

  // Navigation groups — Supabase-style
  const navGroups = useMemo<NavGroup[]>(() => {
    const s = (section: string) => `/builder?section=${section}`
    return [
      {
        items: [
          { href: '/builder', label: 'Overview', icon: LayoutDashboard, kbd: 'G O' },
        ],
      },
      {
        label: 'Manage',
        items: [
          { href: s('properties'), label: 'Properties', icon: Building2, kbd: 'G P' },
          { href: s('leads'), label: 'Leads', icon: Users, badge: isLoadingCount ? null : (leadCount?.total ?? 0), kbd: 'G L' },
          { href: s('contacts'), label: 'Contacts', icon: UserCircle },
        ],
      },
      {
        label: 'Engage',
        items: [
          { href: s('client-outreach'), label: 'Messages', icon: MessageSquare, kbd: 'G M' },
          { href: s('overview'), label: 'Automations', icon: Workflow },
        ],
      },
      {
        label: 'Insights',
        items: [
          { href: s('analytics'), label: 'Analytics', icon: BarChart3, kbd: 'G A' },
          { href: s('revenue'), label: 'Revenue', icon: TrendingUp, kbd: 'G R' },
        ],
      },
    ]
  }, [leadCount, isLoadingCount])

  // Bottom navigation items
  const bottomItems: NavItem[] = useMemo(() => [
    { href: '/builder/integrations', label: 'Integrations', icon: Plug },
    { href: '/builder/billing', label: 'Billing', icon: CreditCard },
    { href: '/builder/rera-compliance', label: 'RERA', icon: Shield },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ], [])

  // Search filter
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups
    const q = searchQuery.toLowerCase()
    return navGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }, [navGroups, searchQuery])

  // Active state check
  const isItemActive = useCallback((item: NavItem): boolean => {
    const section = routeToSectionMap[item.href] || item.href.split('?section=')[1]?.split('&')[0]
    if (section) return currentSection === section
    const np = pathname.replace(/\/$/, '') || '/builder'
    const nh = item.href.replace(/\/$/, '')
    if (np === nh) return true
    if (nh !== '/builder' && np.startsWith(nh + '/')) return true
    return false
  }, [pathname, currentSection])

  const sidebarWidth = 256

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-[1000]',
        'flex flex-col',
        'bg-zinc-950 border-r border-zinc-800',
        'hidden lg:flex'
      )}
      style={{ width: `${sidebarWidth}px` }}
      aria-label="Dashboard navigation"
    >
      {/* Header: Back, Brand, Search */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-zinc-800/70">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-3 group"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-4 h-4 text-zinc-950" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-zinc-100 text-sm leading-tight">Tharaga</span>
            <span className="text-amber-400/80 text-[10px] font-medium leading-tight">Builder Dashboard</span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            data-sidebar-search
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search navigation..."
            className={cn(
              'w-full pl-8 pr-8 py-1.5 bg-zinc-900/80 border rounded-lg text-zinc-300 placeholder:text-zinc-600 text-xs',
              'focus:outline-none transition-all duration-150',
              isSearchFocused
                ? 'border-amber-500/40 bg-zinc-900'
                : 'border-zinc-800 hover:border-zinc-700'
            )}
          />
          {!isSearchFocused && !searchQuery && (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50">/</kbd>
          )}
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        {filteredGroups.map((group, gi) => (
          <div key={gi} className={cn(group.label && 'mt-5 first:mt-0')}>
            {group.label && (
              <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item)
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={(e) => handleNavigation(item.href, e)}
                    className={cn(
                      'relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all duration-100 group text-left',
                      active
                        ? 'bg-amber-500/10 text-zinc-100 border-l-2 border-l-amber-400 ml-[-1px]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-l-2 border-l-transparent'
                    )}
                  >
                    <Icon className={cn(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      active ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    )} />
                    <span className="flex-1 font-medium truncate">{item.label}</span>
                    {item.badge != null && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-300 rounded-full border border-amber-500/20">
                        {item.badge}
                      </span>
                    )}
                    {item.kbd && (
                      <span className="hidden group-hover:inline text-[9px] font-mono text-zinc-600">
                        {item.kbd}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Integrations, Billing, RERA, Help */}
      <div className="flex-shrink-0 border-t border-zinc-800/70 px-2 py-2 space-y-0.5">
        {bottomItems.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all duration-100 group',
                active
                  ? 'bg-amber-500/10 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
              <span className="font-medium truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
