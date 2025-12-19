"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useTrialStatus } from './TrialStatusManager'
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  MessageSquare,
  Settings,
  Lock,
  HelpCircle,
  Building,
  Clock,
  BarChart3,
  Search,
  ChevronDown,
  ChevronRight,
  Calendar,
  Handshake,
  FileText,
  Activity,
  TrendingUp,
  Menu,
  X,
  Sparkles
} from 'lucide-react'

interface SubscriptionData {
  tier: 'trial' | 'pro' | 'enterprise' | 'trial_expired' | string
  trial_leads_used?: number
  days_remaining?: number
  is_trial_expired?: boolean
  builder_name?: string | null
}

interface LeadCountData {
  total: number
  hot: number
  warm: number
  pending_interactions: number
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | null | number
  requiresPro?: boolean
  submenu?: { href: string; label: string }[]
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

export function BuilderSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // Map routes to unified dashboard sections
  const routeToSectionMap: Record<string, string> = {
    '/builder': 'overview',
    '/builder/leads': 'leads',
    '/builder/leads/pipeline': 'pipeline',
    '/builder/properties': 'properties',
    '/builder/messaging': 'client-outreach',
    '/behavior-tracking': 'behavior-analytics',
    '/builder/settings': 'settings',
  }
  
  // Extract section from URL (handles both /builder?section=X and direct section URLs)
  const getSectionFromHref = (href: string): string | null => {
    if (href.startsWith('/builder?section=')) {
      const match = href.match(/[?&]section=([^&]+)/)
      return match ? match[1] : null
    }
    return routeToSectionMap[href] || null
  }
  
  // Check if a route should use unified dashboard
  const shouldUseUnifiedDashboard = (href: string): boolean => {
    return href.startsWith('/builder?section=') || href in routeToSectionMap
  }
  
  // Get unified dashboard URL for a route
  const getUnifiedDashboardUrl = (href: string): string => {
    if (href.startsWith('/builder?section=')) return href
    const section = routeToSectionMap[href]
    return section ? `/builder?section=${section}` : href
  }
  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [badgeAnimation, setBadgeAnimation] = useState<'pulse' | 'bounce' | null>(null)
  // Sidebar is always expanded (static) - no collapse functionality
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const previousCountRef = useRef<number>(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sidebarRef = useRef<HTMLAsideElement>(null)
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use trial status manager for real subscription data
  const trialStatus = useTrialStatus()

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebar-expanded')
    const savedPinned = localStorage.getItem('sidebar-pinned')
    if (savedExpanded === 'true') setIsExpanded(true)
    if (savedPinned === 'true') {
      setIsPinned(true)
      setIsExpanded(true)
    }
  }, [])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', String(isExpanded))
    localStorage.setItem('sidebar-pinned', String(isPinned))
  }, [isExpanded, isPinned])

  // Subscription data is now managed by TrialStatusManager

  // Fetch lead count with real-time updates
  useEffect(() => {
    let cancelled = false
    let retryCount = 0
    const maxRetries = 3

    async function fetchLeadCount() {
      try {
        const res = await fetch('/api/leads/count', { 
          next: { revalidate: 0 } as any,
          cache: 'no-store'
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        if (json.success && json.data && !cancelled) {
          const newCount = json.data.total
          const previousCount = previousCountRef.current
          
          if (previousCount > 0 && newCount > previousCount) {
            setBadgeAnimation('pulse')
            setTimeout(() => setBadgeAnimation(null), 1000)
          } else if (previousCount > 0 && newCount !== previousCount) {
            setBadgeAnimation('bounce')
            setTimeout(() => setBadgeAnimation(null), 600)
          }
          
          previousCountRef.current = newCount
          setLeadCount(json.data)
          setIsLoadingCount(false)
          retryCount = 0
        }
      } catch (error) {
        console.error('[Sidebar] Error fetching lead count:', error)
        retryCount++
        if (retryCount < maxRetries && !cancelled) {
          setTimeout(() => fetchLeadCount(), Math.min(1000 * Math.pow(2, retryCount), 10000))
        } else if (!cancelled) {
          setIsLoadingCount(false)
        }
      }
    }

    fetchLeadCount()

    const getPollInterval = () => {
      if (document.hidden) return 30000
      if (pathname.startsWith('/builder/leads')) return 5000
      return 15000
    }

    const startPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      pollIntervalRef.current = setInterval(() => {
        if (!cancelled && !document.hidden) {
          fetchLeadCount()
        }
      }, getPollInterval())
    }

    startPolling()

    const handleRefreshEvent = () => {
      if (!cancelled) {
        fetchLeadCount()
      }
    }

    const handleVisibilityChange = () => {
      if (!cancelled) {
        startPolling()
        if (!document.hidden) {
          fetchLeadCount()
        }
      }
    }

    const handleFocus = () => {
      if (!cancelled && !document.hidden) {
        fetchLeadCount()
      }
    }

    window.addEventListener('leadCountRefresh', handleRefreshEvent)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      window.removeEventListener('leadCountRefresh', handleRefreshEvent)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [pathname])

  // Sidebar is static - no hover expand/collapse functionality
  // Removed handleMouseEnter and handleMouseLeave for static sidebar

  // Toggle submenu
  const toggleSubmenu = useCallback((href: string) => {
    setOpenSubmenus(prev => {
      const next = new Set(prev)
      if (next.has(href)) {
        next.delete(href)
      } else {
        next.add(href)
      }
      return next
    })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('sidebar-search-input')
        if (searchInput) {
          (searchInput as HTMLInputElement).focus()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault()
        setIsPinned(!isPinned)
        setIsExpanded(!isPinned)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPinned])

  // Grouped navigation items - Smart grouping
  // Uses section-based navigation for unified dashboard, route-based for standalone pages
  const navGroups = useMemo<NavGroup[]>(() => {
    // Helper function to create section-based navigation URLs
    const createSectionUrl = (section: string) => `/builder?section=${section}`
    
    return [
    {
      items: [
        // Overview uses unified dashboard section
        { href: createSectionUrl('overview'), label: 'Overview', icon: LayoutDashboard, badge: null, requiresPro: false },
      ]
    },
    {
      label: 'Sales & Leads',
      items: [
        { 
          // Use unified single-page dashboard sections for leads
          href: createSectionUrl('leads'), 
          label: 'Leads', 
          icon: Users, 
          badge: isLoadingCount ? null : (leadCount?.total ?? 0), 
          requiresPro: false,
          submenu: [
            { href: createSectionUrl('leads'), label: 'All Leads' },
            { href: createSectionUrl('pipeline'), label: 'Pipeline' },
          ]
        },
        { href: createSectionUrl('viewings'), label: 'Viewings', icon: Calendar, requiresPro: false },
        { href: createSectionUrl('negotiations'), label: 'Negotiations', icon: Handshake, requiresPro: false },
        { href: createSectionUrl('contracts'), label: 'Contracts', icon: FileText, requiresPro: false },
      ]
    },
    {
      label: 'Properties',
      items: [
        { 
          // Use unified section for properties
          href: createSectionUrl('properties'), 
          label: 'Properties', 
          icon: Building2, 
          requiresPro: false,
          submenu: [
            { href: createSectionUrl('properties'), label: 'Manage' },
            { href: '/builder/properties/performance', label: 'Performance' },
          ]
        },
      ]
    },
    {
      label: 'Communication',
      items: [
        { 
          // Unified section for client outreach
          href: createSectionUrl('client-outreach'), 
          label: 'Client Outreach', 
          icon: MessageSquare, 
          requiresPro: false,
          submenu: [
            { href: createSectionUrl('client-outreach'), label: 'Send Messages' },
            { href: '/builder/communications', label: 'Communications' },
          ]
        },
      ]
    },
    {
      label: 'Analytics & Insights',
      items: [
        // Behavior analytics is part of unified dashboard
        { href: createSectionUrl('behavior-analytics'), label: 'Behavior Analytics', icon: BarChart3, requiresPro: false },
        { href: '/builder/analytics', label: 'Analytics', icon: TrendingUp, requiresPro: false },
        { href: createSectionUrl('deal-lifecycle'), label: 'Deal Lifecycle', icon: Activity, requiresPro: false },
        { href: createSectionUrl('ultra-automation-analytics'), label: 'Automation Analytics', icon: Sparkles, requiresPro: false },
      ]
    },
    {
      label: 'Business',
      items: [
        { 
          href: '/builder/revenue', 
          label: 'Revenue', 
          icon: DollarSign, 
          requiresPro: true,
          submenu: [
            { href: '/builder/revenue', label: 'Overview' },
            { href: '/builder/revenue/payments', label: 'Payments' },
            { href: '/builder/revenue/forecasting', label: 'Forecasting' },
          ]
        },
      ]
    },
    {
      items: [
        // Settings section inside unified dashboard (quick access),
        // detailed settings live in /builder/settings and subroutes
        { href: createSectionUrl('settings'), label: 'Settings', icon: Settings, requiresPro: false },
      ]
    },
    ]
  }, [leadCount, isLoadingCount])

  const isTrial = trialStatus.isTrial

  // Filter items based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups
    
    const query = searchQuery.toLowerCase()
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.submenu?.some(sub => sub.label.toLowerCase().includes(query))
      )
    })).filter(group => group.items.length > 0)
  }, [navGroups, searchQuery])

<<<<<<< HEAD
  // Static sidebar - always expanded, width minimized to content
  const sidebarWidth = 220 // Compact width optimized for content
=======
  // Reduced width for compact design - pricing card style
  const sidebarWidth = isExpanded ? 240 : 64
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842

  return (
    <>
      {/* Desktop Sidebar - Pricing Card Glassmorphic Style */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-[1000] group/sidebar",
          "flex flex-col",
          "relative",
          "backdrop-blur-xl bg-white/10 border-r border-white/20",
          "rounded-r-3xl overflow-hidden",
<<<<<<< HEAD
          "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          "hover:shadow-2xl",
          "transition-all duration-[250ms] ease-in-out",
=======
          "transition-all duration-[250ms] ease-in-out",
          "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          "hover:shadow-2xl",
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
          "hidden lg:flex"
        )}
        style={{ width: `${sidebarWidth}px` }}
        aria-label="Main navigation sidebar"
      >
        {/* Shimmer Effect - Pricing Card Style */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/sidebar:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-0" />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full bg-gradient-to-b from-primary-950/80 via-primary-900/80 to-primary-950/80">
<<<<<<< HEAD
        {/* Header Section - Compact */}
        <div className="flex-shrink-0 px-3 py-3 border-b border-white/10">
=======
        {/* Header Section */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-white/10">
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center shadow-lg shadow-gold-500/30 shrink-0">
              <Building className="w-4 h-4 text-primary-950" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-white text-xs whitespace-nowrap">THARAGA</span>
              <span className="text-gold-400 text-[9px] font-medium whitespace-nowrap">Builder Portal</span>
            </div>
          </div>

<<<<<<< HEAD
          {/* Search Bar - Always Visible (Static) */}
          <div className="mt-3">
=======
          {/* Search Bar - Compact */}
          <div className={cn(
            "mt-3 transition-all duration-150 ease-out",
            isExpanded 
              ? "opacity-100 max-h-40 pointer-events-auto" 
              : "opacity-0 max-h-0 overflow-hidden pointer-events-none"
          )}>
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                id="sidebar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder:text-gray-400 text-xs focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-medium text-gray-400 bg-white/5 border border-white/10 rounded">
                <span className="text-[7px]">⌘</span>K
              </kbd>
            </div>
          </div>
<<<<<<< HEAD
=======

          {/* Collapsed Search Icon */}
          {!isExpanded && (
            <button
              onClick={() => {
                setIsExpanded(true)
                setTimeout(() => {
                  const searchInput = document.getElementById('sidebar-search-input')
                  if (searchInput) {
                    (searchInput as HTMLInputElement).focus()
                  }
                }, 250)
              }}
              className="mt-3 w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-gray-400" />
            </button>
          )}
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
        </div>

        {/* Main Navigation - Scrollable - Compact */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-3 space-y-0.5 custom-scrollbar">
          {filteredGroups.map((group, groupIndex) => (
<<<<<<< HEAD
            <div key={groupIndex} className={cn("space-y-0.5", group.label && "mb-3")}>
              {/* Group Label */}
              {group.label && (
=======
            <div key={groupIndex} className={cn("space-y-1", group.label && isExpanded && "mb-4")}>
              {/* Group Label - Compact */}
              {group.label && isExpanded && (
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
                <div className="px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}

              {/* Group Items */}
              {group.items.map((item) => {
                // Check if active - handle both route-based and section-based navigation
                const isRouteActive = pathname === item.href || pathname.startsWith(item.href + '/')
                let isSectionActive = false
                
                // Check if this item uses unified dashboard and is active via section param
                if (shouldUseUnifiedDashboard(item.href)) {
                  const section = getSectionFromHref(item.href)
                  if (section && pathname === '/builder' && typeof window !== 'undefined') {
                    const currentSection = new URLSearchParams(window.location.search).get('section')
                    isSectionActive = currentSection === section
                  }
                } else if (item.href.includes('?section=')) {
                  const sectionParam = item.href.split('?section=')[1]?.split('&')[0]
                  if (typeof window !== 'undefined') {
                    const currentSection = new URLSearchParams(window.location.search).get('section')
                    isSectionActive = currentSection === sectionParam && (pathname === '/builder' || pathname === '/builder/')
                  }
                }
                const isActive = isRouteActive || isSectionActive
                const isLocked = isTrial && !!item.requiresPro
                const hasSubmenu = item.submenu && item.submenu.length > 0
                const isSubmenuOpen = openSubmenus.has(item.href)

                return (
                  <div key={item.href}>
                    <Link
                      href={isLocked ? '#' : item.href}
                      onClick={(e) => {
                        if (isLocked) {
                          e.preventDefault()
                          // Show upgrade prompt
                          window.location.href = '/pricing'
                          return
                        }
                        
                        // If this route should use unified dashboard, intercept and redirect
                        if (shouldUseUnifiedDashboard(item.href)) {
                          e.preventDefault()
                          const unifiedUrl = getUnifiedDashboardUrl(item.href)
                          // Use window.location for immediate navigation to ensure URL updates
                          window.location.href = unifiedUrl
                          return
                        }
                        
                        // For other routes, allow normal navigation
                        // Submenu toggle is handled by the chevron button
                      }}
                      className={cn(
                        "flex items-center rounded-lg px-2 py-2 text-xs transition-all duration-150 group relative",
                        "hover:bg-white/5",
                        isActive
                          ? "bg-gold-500/20 text-white border-l-2 border-gold-500"
                          : "text-gray-400 hover:text-white",
                        isLocked && "opacity-50 cursor-not-allowed",
                        "gap-2"
                      )}
                    >
                      {/* Icon container - Compact */}
<<<<<<< HEAD
                      <div className="flex items-center justify-center shrink-0 w-4 h-4">
                        <item.icon className={cn("w-4 h-4 transition-colors duration-150", isActive && "text-gold-400")} />
                      </div>
                      
                      {/* Label - Always visible (static sidebar) */}
                      <span className="font-medium truncate flex-1 min-w-0 text-xs">
=======
                      <div className={cn(
                        "flex items-center justify-center shrink-0 transition-all duration-150",
                        "w-4 h-4"
                      )}>
                        <item.icon className={cn("w-4 h-4 transition-colors duration-150", isActive && "text-gold-400")} />
                      </div>
                      
                      {/* Label - Compact */}
                      <span className={cn(
                        "font-medium truncate transition-all duration-150 ease-out text-xs",
                        isExpanded 
                          ? "opacity-100 translate-x-0 ml-0 w-auto flex-1 min-w-0" 
                          : "opacity-0 -translate-x-2 w-0 ml-0 pointer-events-none"
                      )}>
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
                        {item.label}
                      </span>
                      
                      {item.badge !== null && item.badge !== undefined && (
                        <span 
                          className={cn(
                            "ml-auto px-1.5 py-0.5 text-white text-[9px] font-bold rounded-full transition-all duration-300",
                            "bg-emerald-500",
                            badgeAnimation === 'pulse' && "animate-pulse ring-1 ring-emerald-300",
                            badgeAnimation === 'bounce' && "animate-bounce",
                            isLoadingCount && "opacity-50"
                          )}
                        >
                          {isLoadingCount ? (
                            <span className="inline-block w-3 h-2.5 bg-white/30 rounded animate-pulse" />
                          ) : (
                            typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge
                          )}
                        </span>
                      )}

                      {hasSubmenu && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleSubmenu(item.href)
                          }}
                          className="ml-auto p-0.5 hover:bg-white/5 rounded transition-colors shrink-0"
                          aria-label={isSubmenuOpen ? "Collapse submenu" : "Expand submenu"}
                          aria-expanded={isSubmenuOpen}
                        >
                          {isSubmenuOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform duration-150" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 transition-transform duration-150" />
                          )}
                        </button>
                      )}

                      {isLocked && (
                        <Lock 
                          className="ml-auto w-3.5 h-3.5 text-gray-500 shrink-0" 
                          title="Upgrade to Pro to access Revenue features"
                        />
                      )}
                    </Link>

                    {/* Submenu - Smooth expand/collapse animation */}
                    <div 
                      className={cn(
                        "overflow-hidden transition-all duration-150 ease-out",
                        hasSubmenu && isSubmenuOpen
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      )}
                    >
                      {hasSubmenu && (
                        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                          {item.submenu?.map((sub) => {
                            const isSubActive = pathname === sub.href || 
                              (shouldUseUnifiedDashboard(sub.href) && 
                               pathname === '/builder' && 
                               typeof window !== 'undefined' &&
                               new URLSearchParams(window.location.search).get('section') === getSectionFromHref(sub.href))
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={(e) => {
                                  // If this submenu item should use unified dashboard, intercept
                                  if (shouldUseUnifiedDashboard(sub.href)) {
                                    e.preventDefault()
                                    const unifiedUrl = getUnifiedDashboardUrl(sub.href)
                                    window.location.href = unifiedUrl
                                  }
                                }}
                                className={cn(
                                  "block px-2 py-1 text-[11px] rounded-lg transition-colors duration-150",
                                  isSubActive
                                    ? "text-gold-300 font-medium bg-white/5"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                              >
                                {sub.label}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer Section - Only Trial Banner (Removed Help & Support, User Profile, Pin Sidebar) */}
        <div className="flex-shrink-0 border-t border-white/10 px-2 py-3">
          {/* Trial/Upgrade CTA - Compact Design */}
<<<<<<< HEAD
          {isTrial && (
=======
          {isTrial && isExpanded && (
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
            <Link
              href="/pricing"
              className={cn(
                "block p-2 rounded-lg backdrop-blur-sm border transition-colors",
                trialStatus.isExpired
                  ? "bg-red-500/15 border-red-500/30 hover:bg-red-500/20"
                  : trialStatus.isUrgent
                  ? "bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/20"
                  : "bg-gold-500/15 border-gold-500/30 hover:bg-gold-500/20"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className={cn(
                  "w-3 h-3",
                  trialStatus.isExpired ? "text-red-300" : trialStatus.isUrgent ? "text-orange-300" : "text-gold-300"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold",
                  trialStatus.isExpired ? "text-red-100" : trialStatus.isUrgent ? "text-orange-100" : "text-gold-100"
                )}>
                  {trialStatus.isExpired ? "Trial Expired" : "Trial Active"}
                </span>
              </div>
              {!trialStatus.isExpired && (
                <div className="h-1 w-full rounded-full bg-primary-900 overflow-hidden mb-1">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      trialStatus.isUrgent ? "bg-orange-400" : "bg-gold-400"
                    )}
                    style={{ width: `${trialStatus.progressPercentage.toFixed(0)}%` }}
                  />
                </div>
              )}
              <div className={cn(
                "text-[10px]",
                trialStatus.isExpired 
                  ? "text-red-400 font-semibold" 
                  : trialStatus.isUrgent 
                  ? "text-orange-400 font-medium" 
                  : "text-gray-300"
              )}>
                {trialStatus.isExpired 
                  ? 'Upgrade Now'
                  : trialStatus.isUrgent
                  ? `⚠️ ${trialStatus.formattedDaysLeft}`
                  : trialStatus.formattedDaysLeft}
              </div>
              {(trialStatus.isExpired || trialStatus.isUrgent) && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] text-gray-400">
                    {trialStatus.trialLeadsUsed}/{trialStatus.trialLeadsLimit} leads
                  </span>
                  <span className="text-[9px] text-gold-300 font-semibold">→</span>
                </div>
              )}
            </Link>
          )}
        </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-[1001] lg:hidden p-2 rounded-lg bg-primary-900/90 backdrop-blur-sm border border-white/10 text-white"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className={cn(
              "fixed left-0 top-0 bottom-0 z-[1001]",
              "w-[280px] flex flex-col",
              "bg-gradient-to-b from-primary-950 via-primary-900 to-primary-950",
              "backdrop-blur-xl border-r border-white/10",
              "transform transition-transform duration-300 ease-out",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
              "lg:hidden"
            )}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary-950" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-white text-sm">THARAGA</span>
                  <span className="text-gold-400 text-[10px] font-medium">Builder Portal</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="px-4 py-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder:text-gray-400 text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>
            </div>

            {/* Mobile Navigation - Same structure as desktop */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
              {filteredGroups.map((group, groupIndex) => (
                <div key={groupIndex} className={cn("space-y-1", group.label && "mb-4")}>
                  {group.label && (
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {group.label}
                    </div>
                  )}
                  {group.items.map((item) => {
                    // Check if active - handle both route-based and section-based navigation
                    const isRouteActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    let isSectionActive = false
                    
                    // Check if this item uses unified dashboard and is active via section param
                    if (shouldUseUnifiedDashboard(item.href)) {
                      const section = getSectionFromHref(item.href)
                      if (section && pathname === '/builder' && typeof window !== 'undefined') {
                        const currentSection = new URLSearchParams(window.location.search).get('section')
                        isSectionActive = currentSection === section
                      }
                    } else if (item.href.includes('?section=')) {
                      const sectionParam = item.href.split('?section=')[1]?.split('&')[0]
                      if (typeof window !== 'undefined') {
                        const currentSection = new URLSearchParams(window.location.search).get('section')
                        isSectionActive = currentSection === sectionParam && (pathname === '/builder' || pathname === '/builder/')
                      }
                    }
                    const isActive = isRouteActive || isSectionActive
                    const isLocked = isTrial && !!item.requiresPro
                    const hasSubmenu = item.submenu && item.submenu.length > 0
                    const isSubmenuOpen = openSubmenus.has(item.href)

                    return (
                      <div key={item.href}>
                        <Link
                          href={isLocked ? '#' : item.href}
                          onClick={(e) => {
                            if (isLocked) {
                              e.preventDefault()
                              window.location.href = '/pricing'
                              return
                            }
                            // If clicking chevron button, only toggle submenu
                            if ((e.target as HTMLElement).closest('button')) {
                              e.preventDefault()
                              return
                            }
                            
                            // If this route should use unified dashboard, intercept and redirect
                            if (shouldUseUnifiedDashboard(item.href)) {
                              e.preventDefault()
                              const unifiedUrl = getUnifiedDashboardUrl(item.href)
                              window.location.href = unifiedUrl
                              return
                            }
                            
                            // Otherwise, navigate and close menu
                            setMobileMenuOpen(false)
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                            isActive
                              ? "bg-gold-500/20 text-white border-l-3 border-gold-500"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-gold-400")} />
                          <span className="font-medium flex-1">{item.label}</span>
                          {item.badge !== null && item.badge !== undefined && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                              {typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge}
                            </span>
                          )}
                          {hasSubmenu && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleSubmenu(item.href)
                              }}
                              className="shrink-0"
                              aria-label={isSubmenuOpen ? "Collapse submenu" : "Expand submenu"}
                            >
                              {isSubmenuOpen ? (
                                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-150" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-150" />
                              )}
                            </button>
                          )}
                        </Link>
                        {/* Mobile Submenu - Smooth animation */}
                        <div 
                          className={cn(
                            "overflow-hidden transition-all duration-150 ease-out",
                            hasSubmenu && isSubmenuOpen
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                          )}
                        >
                          {hasSubmenu && (
                            <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-4">
                              {item.submenu?.map((sub) => {
                                const isSubActive = pathname === sub.href || 
                                  (shouldUseUnifiedDashboard(sub.href) && 
                                   pathname === '/builder' && 
                                   typeof window !== 'undefined' &&
                                   new URLSearchParams(window.location.search).get('section') === getSectionFromHref(sub.href))
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={(e) => {
                                      // If this submenu item should use unified dashboard, intercept
                                      if (shouldUseUnifiedDashboard(sub.href)) {
                                        e.preventDefault()
                                        const unifiedUrl = getUnifiedDashboardUrl(sub.href)
                                        window.location.href = unifiedUrl
                                        return
                                      }
                                      setMobileMenuOpen(false)
                                    }}
                                    className={cn(
                                      "block px-3 py-1.5 text-xs rounded-lg transition-colors duration-150",
                                      isSubActive
                                        ? "text-gold-300 font-medium bg-white/5"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                  >
                                    {sub.label}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </nav>

            {/* Mobile Footer */}
            <div className="border-t border-white/10 px-4 py-4 space-y-3">
              {isTrial && (
                <Link
                  href="/pricing"
                  className="block p-3 rounded-xl bg-gold-500/15 border border-gold-500/30"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-gold-300" />
                    <span className="text-[11px] font-semibold text-gold-100">Trial Active</span>
                  </div>
                  <div className="text-[10px] text-gray-300">
                    {trialStatus.isExpired
                      ? 'Expired - Upgrade'
                      : trialStatus.formattedDaysLeft}
                  </div>
                </Link>
              )}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                  {(trialStatus.subscription?.builder_name || 'B').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {trialStatus.subscription?.builder_name || 'Builder'}
                  </div>
                  <div className="text-[10px] text-gray-400">My Account</div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Set CSS variable for sidebar width - Static sidebar */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --sidebar-width: ${sidebarWidth}px;
          }
          @media (min-width: 1024px) {
            main.flex-1 {
              margin-left: var(--sidebar-width);
            }
          }
        `
      }} />
    </>
  )
}
