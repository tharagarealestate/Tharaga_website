"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Sparkles,
  Zap,
  BarChart3,
  Building,
  Clock,
  CreditCard,
  Home,
  ArrowLeft
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

export function AdvancedAISidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // Routes that exist as separate pages use direct paths (billing, integrations, leads, etc.)
  // Routes that don't exist use query parameters with router.push for smooth navigation
  const routeToSectionMap: Record<string, string> = {
    '/builder': 'overview',
  }
  
  // Routes that exist as actual Next.js pages (use direct Link navigation)
  const existingPageRoutes = [
    '/builder/leads/pipeline', // Keep pipeline as standalone page
    '/builder/properties/performance',
    '/builder/billing',
    '/builder/integrations',
    '/builder/analytics',
    '/builder/communications',
    '/builder/messaging',
    '/builder/settings',
  ]
  
  // Routes that should use unified dashboard sections (use event-based navigation)
  const sectionRoutesMap: Record<string, string> = {
    '/builder': 'overview',
    '/builder/leads': 'leads', // Use unified dashboard LeadsSection (the top-tier recent implementation)
    '/builder/viewings': 'viewings',
    '/builder/negotiations': 'negotiations',
    '/builder/contracts': 'contracts',
    '/builder/properties': 'properties', // Properties section in unified dashboard
  }
  
  const shouldUseQueryParams = (href: string): boolean => {
    // Use query params for routes that don't exist as pages
    return href in sectionRoutesMap || href.startsWith('/builder?section=')
  }
  
  const getQueryParamUrl = (href: string): string => {
    if (href.startsWith('/builder?section=')) return href
    const section = sectionRoutesMap[href]
    return section ? `/builder?section=${section}` : href
  }
  
  // Handle navigation for section-based routes (like BuilderTopNav does)
  const handleSectionNavigation = (href: string) => {
    if (!shouldUseQueryParams(href)) return // Let Link handle it
    
    const section = sectionRoutesMap[href] || href.split('?section=')[1]?.split('&')[0]
    if (!section) return
    
    // Use the same approach as BuilderTopNav - update URL and dispatch event
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.pathname = '/builder'
      url.searchParams.set('section', section)
      window.history.pushState({}, '', url.toString())
      // Dispatch custom event for section change (BuilderTopNav pattern)
      window.dispatchEvent(new CustomEvent('dashboard-section-change', { detail: { section } }))
    }
  }

  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const previousCountRef = useRef<number>(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const trialStatus = useTrialStatus()

  // Fetch lead count with real-time updates (deferred for better initial load performance)
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
          previousCountRef.current = newCount
          setLeadCount(json.data)
          setIsLoadingCount(false)
          retryCount = 0
        }
      } catch (error) {
        console.error('[AdvancedAISidebar] Error fetching lead count:', error)
        retryCount++
        if (retryCount < maxRetries && !cancelled) {
          setTimeout(() => fetchLeadCount(), Math.min(1000 * Math.pow(2, retryCount), 10000))
        } else if (!cancelled) {
          setIsLoadingCount(false)
        }
      }
    }

    // Defer initial fetch to improve initial page load performance
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        fetchLeadCount()
      }
    }, 500)

    const getPollInterval = () => {
      if (document.hidden) return 60000 // Reduced when tab is hidden
      if (pathname.startsWith('/builder/leads')) return 15000 // Increased for better performance
      return 45000 // Increased for better performance
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

    // Start polling after initial fetch
    const pollingTimeoutId = setTimeout(() => {
      if (!cancelled) {
        startPolling()
      }
    }, 2000)

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

    window.addEventListener('leadCountRefresh', handleRefreshEvent)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      clearTimeout(pollingTimeoutId)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      window.removeEventListener('leadCountRefresh', handleRefreshEvent)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname])

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
        const searchInput = document.getElementById('ai-sidebar-search')
        if (searchInput) {
          (searchInput as HTMLInputElement).focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Navigation groups - Clean, organized structure for better UX
  // Routes that exist use direct paths, others use query params
  const navGroups = useMemo<NavGroup[]>(() => {
    return [
      // Main Dashboard
      {
        items: [
          { href: '/builder', label: 'Dashboard', icon: LayoutDashboard, badge: null, requiresPro: false },
        ]
      },
      // Sales & Pipeline - Consolidated for better organization
      {
        label: 'Sales',
        items: [
          {
            href: '/builder/leads',
            label: 'Leads',
            icon: Users,
            badge: isLoadingCount ? null : (leadCount?.total ?? 0),
            requiresPro: false,
            submenu: [
              { href: '/builder/leads', label: 'All Leads' },
              { href: '/builder/leads/pipeline', label: 'Pipeline' },
            ]
          },
          {
            href: '/builder/properties',
            label: 'Properties',
            icon: Building2,
            requiresPro: false,
            submenu: [
              { href: '/builder/properties', label: 'Manage' },
              { href: '/builder/properties/performance', label: 'Performance' },
            ]
          },
          { href: '/builder/viewings', label: 'Viewings', icon: Calendar, requiresPro: false },
          { href: '/builder/negotiations', label: 'Negotiations', icon: Handshake, requiresPro: false },
          { href: '/builder/contracts', label: 'Contracts', icon: FileText, requiresPro: false },
        ]
      },
      // Communication & Outreach
      {
        label: 'Communication',
        items: [
          {
            href: '/builder/communications',
            label: 'Messages',
            icon: MessageSquare,
            requiresPro: false,
            submenu: [
              { href: '/builder/communications', label: 'All Messages' },
              { href: '/builder/messaging', label: 'Outreach' },
            ]
          },
          { href: '/builder/messaging', label: 'WhatsApp', icon: MessageSquare, requiresPro: false },
        ]
      },
      // Analytics - Single item with submenu
      {
        label: 'Analytics',
        items: [
          {
            href: '/builder/analytics',
            label: 'Analytics',
            icon: TrendingUp,
            requiresPro: false,
            submenu: [
              { href: '/builder/analytics', label: 'Overview' },
              { href: '/builder/analytics/behavior', label: 'Behavior' },
              { href: '/builder/analytics/deal-lifecycle', label: 'Deal Lifecycle' },
              { href: '/builder/analytics/automation', label: 'Automation' },
            ]
          },
        ]
      },
      // Business & Finance
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
      // Settings & Configuration
      {
        label: 'Settings',
        items: [
          { 
            href: '/builder/integrations', 
            label: 'Integrations', 
            icon: Zap, 
            requiresPro: false,
          },
          { 
            href: '/builder/billing', 
            label: 'Billing', 
            icon: CreditCard, 
            requiresPro: false,
          },
        ]
      },
    ]
  }, [leadCount, isLoadingCount])

  const isTrial = trialStatus.isTrial

  // Filter items based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return navGroups
    }
    
    const query = searchQuery.toLowerCase()
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.submenu?.some(sub => sub.label.toLowerCase().includes(query))
      )
    })).filter(group => group.items.length > 0)
  }, [navGroups, searchQuery])

  const sidebarWidth = 260 // Slightly wider for better AI aesthetic

  return (
    <>
      {/* Desktop Sidebar - Advanced AI Design */}
      <motion.aside
        initial={{ x: -sidebarWidth }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-[1000]",
          "flex flex-col",
          "bg-slate-900/95 backdrop-blur-2xl",
          "border-r glow-border border-r-amber-300/25",
          "shadow-[0_0_60px_rgba(251,191,36,0.1)]",
          "hidden lg:flex"
        )}
        style={{ width: `${sidebarWidth}px` }}
        aria-label="Main navigation sidebar"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800/50 to-slate-900 opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]" />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header Section - AI Style */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0 px-4 py-5 border-b glow-border border-b-amber-300/25"
          >
            {/* Home Button - Elegant Design */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-3"
            >
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02, x: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full group relative overflow-hidden rounded-lg px-3 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/20 hover:border-amber-400/40 transition-all duration-300"
                >
                  {/* Animated background glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />

                  <div className="relative flex items-center gap-2.5">
                    {/* Icon with glow effect - Reduced size */}
                    <div className="relative">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-900 group-hover:translate-x-[-2px] transition-transform" />
                      </div>
                      <div className="absolute inset-0 rounded-lg bg-amber-400/30 blur-md group-hover:blur-lg transition-all" />
                    </div>

                    {/* Text - Compact */}
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 transition-colors tracking-wide">
                        HOME
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
                        Back to main site
                      </span>
                    </div>
                  </div>
                </motion.button>
              </Link>
            </motion.div>

            {/* Brand Logo with AI Glow */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                  <Zap className="w-5 h-5 text-slate-900" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-amber-400/30 blur-xl animate-pulse" />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm tracking-tight">THARAGA</span>
                <span className="text-amber-300 text-[10px] font-medium">AI Builder Portal</span>
              </div>
            </div>

            {/* Search Bar - AI Style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors" 
                style={{ color: isSearchFocused ? '#fbbf24' : undefined }} 
              />
              <input
                id="ai-sidebar-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search commands..."
                className={cn(
                  "w-full pl-10 pr-3 py-2.5 bg-slate-800/50 backdrop-blur-sm",
                  "border-2 rounded-xl text-white placeholder:text-slate-400 text-sm",
                  "focus:outline-none transition-all duration-300",
                  isSearchFocused 
                    ? "glow-border shadow-[0_0_20px_rgba(251,191,36,0.2)] bg-slate-800/70" 
                    : "border-slate-700/50 hover:border-slate-600/50"
                )}
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-800/50 border border-slate-700/50 rounded">
                <span className="text-[8px]">⌘</span>K
              </kbd>
            </motion.div>
          </motion.div>

          {/* Main Navigation - Scrollable with Smooth Animations */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-1 custom-scrollbar">
            <AnimatePresence mode="wait">
              {filteredGroups.map((group, groupIndex) => (
                <motion.div
                  key={groupIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.05 + 0.2 }}
                  className={cn("space-y-1", group.label && "mb-4")}
                >
                  {/* Group Label */}
                  {group.label && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {group.label}
                    </motion.div>
                  )}

                  {/* Group Items */}
                  {group.items.map((item, itemIndex) => {
                    // Active state detection - handle both direct routes and section-based routes
                    let isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    
                    // Check if this is a section-based route and if it matches current section
                    if (shouldUseQueryParams(item.href) && pathname === '/builder') {
                      const section = sectionRoutesMap[item.href] || item.href.split('?section=')[1]?.split('&')[0]
                      if (section && typeof window !== 'undefined') {
                        const urlParams = new URLSearchParams(window.location.search)
                        isActive = urlParams.get('section') === section
                      }
                    }
                    
                    const isLocked = isTrial && !!item.requiresPro
                    const hasSubmenu = item.submenu && item.submenu.length > 0
                    const isSubmenuOpen = openSubmenus.has(item.href)
                    const isHovered = hoveredItem === item.href

                    return (
                      <div key={item.href}>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (groupIndex * 0.05) + (itemIndex * 0.03) + 0.25 }}
                          onHoverStart={() => setHoveredItem(item.href)}
                          onHoverEnd={() => setHoveredItem(null)}
                        >
                          {/* Use button for section-based routes to avoid Link navigation conflicts */}
                          {shouldUseQueryParams(item.href) && !isLocked ? (
                            <button
                              type="button"
                              onClick={() => {
                                // For section-based routes, use event-based navigation (no Link conflicts)
                                handleSectionNavigation(item.href)
                              }}
                              className={cn(
                                "relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 group text-left",
                                "hover:bg-slate-800/60",
                                isActive
                                  ? "bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-white shadow-lg shadow-amber-500/20"
                                  : "text-slate-300 hover:text-white"
                              )}
                            >
                          ) : (
                            <Link
                              href={isLocked ? '#' : item.href}
                              onClick={(e) => {
                                // Only handle locked items - let Next.js Link handle all navigation naturally
                                if (isLocked) {
                                  e.preventDefault()
                                  window.location.href = '/pricing'
                                  return
                                }
                                // For direct page routes (billing, integrations), let Next.js Link handle it
                              }}
                              className={cn(
                                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 group",
                                "hover:bg-slate-800/60",
                                isActive
                                  ? "bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-white shadow-lg shadow-amber-500/20"
                                  : "text-slate-300 hover:text-white",
                                isLocked && "opacity-50 cursor-not-allowed"
                              )}
                            >
                          )}
                            {/* Active Indicator Glow */}
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            )}

                            {/* Hover Glow Effect */}
                            {isHovered && !isActive && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 rounded-xl bg-amber-500/5 blur-sm"
                              />
                            )}

                            {/* Icon with Animation */}
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "relative flex items-center justify-center shrink-0 w-8 h-8 rounded-lg transition-all duration-300",
                                isActive 
                                  ? "bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/20" 
                                  : "bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-amber-300"
                              )}
                            >
                              <item.icon className="w-4 h-4 relative z-10" />
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute inset-0 rounded-lg bg-amber-400/20 blur-md"
                                />
                              )}
                            </motion.div>
                            
                            {/* Label */}
                            <span className="font-medium truncate flex-1 min-w-0 text-sm">
                              {item.label}
                            </span>
                            
                            {/* Badge */}
                            {item.badge !== null && item.badge !== undefined && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={cn(
                                  "ml-auto px-2 py-0.5 text-white text-[10px] font-bold rounded-full",
                                  "bg-gradient-to-r from-emerald-500 to-emerald-600",
                                  "shadow-lg shadow-emerald-500/30",
                                  isLoadingCount && "opacity-50"
                                )}
                              >
                                {isLoadingCount ? (
                                  <span className="inline-block w-4 h-2.5 bg-white/30 rounded animate-pulse" />
                                ) : (
                                  typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge
                                )}
                              </motion.span>
                            )}

                            {/* Submenu Toggle */}
                            {hasSubmenu && (
                              <motion.button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleSubmenu(item.href)
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="ml-auto p-1 hover:bg-slate-700/50 rounded transition-colors shrink-0"
                                aria-label={isSubmenuOpen ? "Collapse submenu" : "Expand submenu"}
                                aria-expanded={isSubmenuOpen}
                              >
                                <motion.div
                                  animate={{ rotate: isSubmenuOpen ? 90 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </motion.div>
                              </motion.button>
                            )}

                            {isLocked && (
                              <Lock 
                                className="ml-auto w-4 h-4 text-slate-500 shrink-0"
                              />
                            )}
                          {shouldUseQueryParams(item.href) && !isLocked ? (
                            </button>
                          ) : (
                            </Link>
                          )}
                        </motion.div>

                        {/* Submenu with Smooth Animation - Enhanced */}
                        <AnimatePresence>
                          {hasSubmenu && isSubmenuOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, y: -10 }}
                              animate={{ height: 'auto', opacity: 1, y: 0 }}
                              exit={{ height: 0, opacity: 0, y: -10 }}
                              transition={{ 
                                duration: 0.25, 
                                ease: [0.16, 1, 0.3, 1],
                                opacity: { duration: 0.2 }
                              }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-700/50 pl-3">
                                {item.submenu?.map((sub, subIndex) => {
                                  // Active state for submenu items
                                  let isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/')
                                  
                                  // Check if this is a section-based route
                                  if (shouldUseQueryParams(sub.href) && pathname === '/builder') {
                                    const section = sectionRoutesMap[sub.href] || sub.href.split('?section=')[1]?.split('&')[0]
                                    if (section && typeof window !== 'undefined') {
                                      const urlParams = new URLSearchParams(window.location.search)
                                      isSubActive = urlParams.get('section') === section
                                    }
                                  }
                                  
                                  return (
                                    <motion.div
                                      key={sub.href}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: subIndex * 0.05 }}
                                    >
                                      {/* Use button for section-based submenu routes to avoid Link navigation conflicts */}
                                      {shouldUseQueryParams(sub.href) ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // For section-based routes, use event-based navigation (no Link conflicts)
                                            handleSectionNavigation(sub.href)
                                          }}
                                          className={cn(
                                            "block w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all duration-200",
                                            isSubActive
                                              ? "text-amber-300 font-semibold bg-amber-500/10 border-l-2 border-amber-400"
                                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                          )}
                                        >
                                          {sub.label}
                                        </button>
                                      ) : (
                                        <Link
                                          href={sub.href}
                                          className={cn(
                                            "block px-3 py-1.5 text-xs rounded-lg transition-all duration-200",
                                            isSubActive
                                              ? "text-amber-300 font-semibold bg-amber-500/10 border-l-2 border-amber-400"
                                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                          )}
                                        >
                                          {sub.label}
                                        </Link>
                                      )}
                                    </motion.div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          </nav>

          {/* Footer Section - Trial Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-shrink-0 border-t glow-border border-t-amber-300/25 px-4 py-4"
          >
            {isTrial && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-3 rounded-xl backdrop-blur-sm border-2 transition-all cursor-pointer",
                  trialStatus.isExpired
                    ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                    : trialStatus.isUrgent
                    ? "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50"
                    : "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
                )}
                onClick={() => router.push('/pricing')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={cn(
                    "w-4 h-4",
                    trialStatus.isExpired ? "text-red-300" : trialStatus.isUrgent ? "text-orange-300" : "text-amber-300"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold",
                    trialStatus.isExpired ? "text-red-100" : trialStatus.isUrgent ? "text-orange-100" : "text-amber-100"
                  )}>
                    {trialStatus.isExpired ? "Trial Expired" : "Trial Active"}
                  </span>
                </div>
                {!trialStatus.isExpired && (
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trialStatus.progressPercentage}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        trialStatus.isUrgent ? "bg-orange-400" : "bg-amber-400"
                      )}
                    />
                  </div>
                )}
                <div className={cn(
                  "text-[10px] font-medium",
                  trialStatus.isExpired 
                    ? "text-red-300" 
                    : trialStatus.isUrgent 
                    ? "text-orange-300" 
                    : "text-slate-300"
                )}>
                  {trialStatus.isExpired 
                    ? 'Upgrade Now →'
                    : trialStatus.isUrgent
                    ? `⚠️ ${trialStatus.formattedDaysLeft}`
                    : trialStatus.formattedDaysLeft}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.aside>

      {/* Mobile Menu Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-[1001] lg:hidden p-3 rounded-xl bg-slate-900/95 backdrop-blur-xl glow-border text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </motion.button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                "fixed left-0 top-0 bottom-0 z-[1001] w-[280px] flex flex-col",
                "bg-slate-900/95 backdrop-blur-2xl border-r glow-border border-r-amber-300/25",
                "lg:hidden"
              )}
            >
              {/* Mobile content - same structure as desktop */}
              <div className="flex items-center justify-between px-4 py-4 border-b glow-border border-b-amber-300/25">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                    <Zap className="w-5 h-5 text-slate-900" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm">THARAGA</span>
                    <span className="text-amber-300 text-[10px] font-medium">AI Builder Portal</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              {/* Mobile navigation - reuse same structure */}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

