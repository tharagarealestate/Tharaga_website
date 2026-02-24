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
  BarChart3,
  TrendingUp,
  Search,
  Sparkles,
  CreditCard,
  ChevronLeft,
  Megaphone,
  Workflow,
  Settings,
  Menu,
  X,
  Clock,
  Zap,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | null
  kbd?: string
  isNew?: boolean
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
 * ModernSidebar — Completely redesigned dashboard navigation
 *
 * Streamlined from 15+ items to 8 focused items:
 * 1. Overview - Command center
 * 2. Leads & Pipeline - Kanban-first CRM
 * 3. Properties - Management + performance
 * 4. Marketing - Campaigns & content (NEW)
 * 5. Automations - AI real-time pipeline viz (NEW)
 * 6. Analytics - Unified insights
 * 7. Revenue - Payments + forecasting
 * 8. Settings - Configuration
 */
export function ModernSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [currentSection, setCurrentSection] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isTrial, isExpired, isUrgent, formattedDaysLeft, progressPercentage } = useTrialStatus()

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

        const res = await fetch('/api/leads/count', { credentials: 'include', headers, cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setLeadCount(json.data)
          }
        }
      } catch { /* silently fail */ } finally {
        if (mounted) setIsLoadingCount(false)
      }
    }
    fetchLeadCount()
    const interval = setInterval(fetchLeadCount, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchFocused && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
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
    '/builder/marketing': 'marketing',
    '/builder/automations': 'automations',
    '/builder/analytics': 'analytics',
    '/builder/revenue': 'revenue',
    '/builder/settings': 'settings',
  }

  // Client-side navigation
  const handleNavigation = useCallback((href: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    if (typeof window === 'undefined') return
    setMobileOpen(false)

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

  // Navigation groups
  const s = (section: string) => `/builder?section=${section}`

  const navGroups = useMemo<NavGroup[]>(() => [
    {
      items: [
        { href: '/builder', label: 'Overview', icon: LayoutDashboard, kbd: 'G O' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { href: s('leads'), label: 'Leads & Pipeline', icon: Users, badge: isLoadingCount ? null : (leadCount?.total ?? 0), kbd: 'G L' },
        { href: s('properties'), label: 'Properties', icon: Building2, kbd: 'G P' },
      ],
    },
    {
      label: 'Grow',
      items: [
        { href: s('marketing'), label: 'Marketing', icon: Megaphone, kbd: 'G M', isNew: true },
        { href: s('automations'), label: 'AI Automations', icon: Workflow, kbd: 'G W', isNew: true },
      ],
    },
    {
      label: 'Insights',
      items: [
        { href: s('analytics'), label: 'Analytics', icon: BarChart3, kbd: 'G A' },
        { href: s('revenue'), label: 'Revenue', icon: TrendingUp, kbd: 'G R' },
      ],
    },
  ], [leadCount, isLoadingCount])

  const bottomItems: NavItem[] = useMemo(() => [
    { href: s('billing'), label: 'Billing', icon: CreditCard },
    { href: s('settings'), label: 'Settings', icon: Settings },
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
    // Overview special case
    if (item.href === '/builder' && (currentSection === 'overview' || currentSection === '')) return true
    const section = routeToSectionMap[item.href] || item.href.split('?section=')[1]?.split('&')[0]
    if (section && section !== 'overview') return currentSection === section
    return false
  }, [pathname, currentSection])

  const renderNavItem = (item: NavItem) => {
    const active = isItemActive(item)
    const Icon = item.icon
    return (
      <button
        key={item.href}
        type="button"
        onClick={(e) => handleNavigation(item.href, e)}
        className={cn(
          'relative w-full flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-all duration-100 group text-left',
          active
            ? 'bg-amber-500/10 text-zinc-100 border-l-2 border-l-amber-400 ml-[-1px]'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border-l-2 border-l-transparent'
        )}
      >
        <Icon className={cn(
          'w-4 h-4 flex-shrink-0 transition-colors',
          active ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
        )} />
        <span className="flex-1 font-medium truncate">{item.label}</span>
        {item.isNew && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-wider">
            New
          </span>
        )}
        {item.badge != null && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-300 rounded-full border border-amber-500/20 min-w-[20px] text-center">
            {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {item.kbd && (
          <span className="hidden group-hover:inline text-[9px] font-mono text-zinc-600">
            {item.kbd}
          </span>
        )}
      </button>
    )
  }

  const sidebarContent = (
    <>
      {/* Header */}
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
            placeholder="Search..."
            className={cn(
              'w-full pl-8 pr-8 py-1.5 bg-zinc-900/80 border rounded-md text-zinc-300 placeholder:text-zinc-600 text-xs',
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
          <div key={gi} className={cn(group.label && 'mt-4 first:mt-0')}>
            {group.label && (
              <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map(renderNavItem)}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex-shrink-0 border-t border-zinc-800/70 px-2 py-2 space-y-0.5">
        {/* Trial banner */}
        {isTrial && (
          <Link
            href="/pricing"
            className={cn(
              'block px-3 py-2.5 rounded-lg mb-2 transition-colors',
              isExpired
                ? 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/15'
                : isUrgent
                ? 'bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15'
                : 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15'
            )}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className={cn(
                'w-3.5 h-3.5',
                isExpired ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-amber-400'
              )} />
              <span className={cn(
                'text-[11px] font-semibold',
                isExpired ? 'text-red-300' : isUrgent ? 'text-orange-300' : 'text-amber-300'
              )}>
                {isExpired ? 'Trial Expired' : formattedDaysLeft}
              </span>
            </div>
            {!isExpired && (
              <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-500',
                    isUrgent ? 'bg-orange-400' : 'bg-amber-400'
                  )}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
            {isExpired && (
              <span className="text-[10px] text-red-400 font-medium">Upgrade to continue</span>
            )}
          </Link>
        )}

        {bottomItems.map(renderNavItem)}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-[1000]',
          'flex flex-col w-[256px]',
          'bg-zinc-950 border-r border-zinc-800/80',
          'hidden lg:flex'
        )}
        aria-label="Dashboard navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[999] lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              'fixed left-0 top-0 bottom-0 z-[1001]',
              'w-[280px] flex flex-col',
              'bg-zinc-950 border-r border-zinc-800',
              'lg:hidden'
            )}
          >
            <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                </div>
                <span className="font-bold text-zinc-100 text-sm">Tharaga</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-2">
              {filteredGroups.map((group, gi) => (
                <div key={gi} className={cn(group.label && 'mt-4 first:mt-0')}>
                  {group.label && (
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                      {group.label}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map(renderNavItem)}
                  </div>
                </div>
              ))}
            </nav>
            <div className="flex-shrink-0 border-t border-zinc-800/70 px-2 py-2 space-y-0.5">
              {bottomItems.map(renderNavItem)}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
