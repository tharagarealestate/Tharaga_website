"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useTrialStatus } from './TrialStatusManager'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Handshake,
  FileText,
  BarChart3,
  TrendingUp,
  Search,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | null
  requiresPro?: boolean
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
 * Modern Sidebar - Inspired by GitHub, Linear, Vercel
 * 
 * Features:
 * - All navigation uses client-side routing (no page reloads)
 * - Fast, smooth transitions with zero lag
 * - Perfect alignment and minimal gaps
 * - Modern dark theme with amber accents
 * - Smooth dropdown animations
 * - Active state indicators
 * - Search functionality
 * - Badge notifications
 */
export function ModernSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  // Removed openSubmenus - no dropdowns anymore
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { isTrial } = useTrialStatus()

  // Fetch lead count
  useEffect(() => {
    let mounted = true
    async function fetchLeadCount() {
      try {
        const res = await fetch('/api/builder/leads?limit=1', { credentials: 'include' })
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
      } catch (error) {
        console.error('Failed to fetch lead count:', error)
      } finally {
        if (mounted) setIsLoadingCount(false)
      }
    }
    fetchLeadCount()
    return () => { mounted = false }
  }, [])

  // Route to section mapping for unified dashboard
  // ALL routes now use section-based navigation for no page reload
  const routeToSectionMap: Record<string, string> = {
    '/builder': 'overview',
    '/builder/leads': 'leads',
    '/builder/properties': 'properties',
    '/builder/properties/performance': 'properties', // Performance analytics is a subsection
    '/builder/pipeline': 'pipeline',
    '/builder/viewings': 'viewings',
    '/builder/negotiations': 'negotiations',
    '/builder/contracts': 'contracts',
    '/builder/contacts': 'contacts',
    '/builder/messaging': 'client-outreach', // Messages uses client-outreach section
    '/builder/analytics': 'analytics', // Need to add analytics section
    '/builder/revenue': 'revenue', // Need to add revenue section
  }

  // Enhanced client-side navigation - INSTANT HIGHLIGHTING, NO LAG
  const handleNavigation = useCallback((href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (typeof window === 'undefined') return
    
    // Prevent double navigation
    const currentHref = window.location.pathname + window.location.search
    if (currentHref === href || currentHref === href + '/') {
      return // Already on this page
    }
    
    // Check if it's a section-based route
    let section: string | null = null
    if (href.startsWith('/builder?section=')) {
      section = href.split('?section=')[1]?.split('&')[0] || null
    } else {
      section = routeToSectionMap[href] || null
    }
    
    if (section) {
      // Section-based navigation - update URL without reload
      router.push(`/builder?section=${section}`, { scroll: false })
      // Dispatch event immediately for instant UI update
      window.dispatchEvent(new CustomEvent('dashboard-section-change', { 
        detail: { section } 
      }))
    } else if (href.startsWith('/builder/')) {
      // Builder routes - use Next.js router for smooth transition
      router.push(href, { scroll: false })
    } else {
      // External routes
      window.location.href = href
    }
  }, [router])

  // Removed toggleSubmenu - no dropdowns anymore

  // Optimized Navigation structure - Simplified from 12 items to 8 items
  // Pipeline View integrated into Leads page as tab
  // Performance Analytics integrated into Properties page as tab
  const navGroups = useMemo<NavGroup[]>(() => {
    const createSectionUrl = (section: string) => `/builder?section=${section}`

    return [
      {
        label: 'Dashboard',
        items: [
          {
            href: '/builder',
            label: 'Overview',
            icon: LayoutDashboard,
            badge: null,
            requiresPro: false
          },
        ]
      },
      {
        label: 'Properties',
        items: [
          {
            href: createSectionUrl('properties'),
            label: 'Properties',
            icon: Building2,
            requiresPro: false,
          },
          {
            href: createSectionUrl('analytics'),
            label: 'Analytics',
            icon: BarChart3,
            requiresPro: false
          },
        ]
      },
      {
        label: 'Leads & CRM',
        items: [
          {
            href: createSectionUrl('leads'),
            label: 'Leads',
            icon: Users,
            badge: isLoadingCount ? null : (leadCount?.total ?? 0),
            requiresPro: false,
          },
          {
            href: createSectionUrl('contacts'),
            label: 'Contacts',
            icon: Users,
            requiresPro: false,
          },
        ]
      },
      {
        label: 'Deals & Revenue',
        items: [
          {
            href: createSectionUrl('negotiations'),
            label: 'Negotiations',
            icon: Handshake,
            requiresPro: false
          },
          {
            href: createSectionUrl('contracts'),
            label: 'Contracts',
            icon: FileText,
            requiresPro: false
          },
          {
            href: createSectionUrl('client-outreach'),
            label: 'Messages',
            icon: MessageSquare,
            requiresPro: false,
          },
          {
            href: createSectionUrl('revenue'),
            label: 'Revenue',
            icon: TrendingUp,
            requiresPro: true
          },
        ]
      },
    ]
  }, [leadCount, isLoadingCount])

  // Filter items based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return navGroups
    }
    
    const query = searchQuery.toLowerCase()
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0)
  }, [navGroups, searchQuery])

  // Check if route uses section-based navigation
  const shouldUseQueryParams = (href: string): boolean => {
    return href.startsWith('/builder?section=') || href in routeToSectionMap
  }

  // Determine active state - INSTANT, ACCURATE highlighting with no lag
  // Use URL search params and pathname for instant, accurate highlighting
  const isItemActive = useCallback((item: NavItem): boolean => {
    if (typeof window === 'undefined') return false
    
    // Check section-based routes first (most common case)
    if (shouldUseQueryParams(item.href)) {
      const section = routeToSectionMap[item.href] || item.href.split('?section=')[1]?.split('&')[0]
      if (section) {
        // Use current URL directly for instant check - most reliable method
        const urlParams = new URLSearchParams(window.location.search)
        const currentSection = urlParams.get('section') || (pathname === '/builder' ? 'overview' : null)
        return currentSection === section
      }
    }
    
    // For direct routes (non-section-based), use pathname matching
    const normalizedPathname = pathname.replace(/\/$/, '') || '/builder'
    const normalizedItemHref = item.href.replace(/\/$/, '')
    
    // Exact match for direct routes
    if (normalizedPathname === normalizedItemHref) {
      return true
    }
    
    // Child route match (but not the other way around)
    if (normalizedItemHref !== '/builder' && normalizedPathname.startsWith(normalizedItemHref + '/')) {
      return true
    }
    
    return false
  }, [pathname])

  const sidebarWidth = 260 // Optimized width

  return (
    <motion.aside
      initial={{ x: -sidebarWidth }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-[1000]",
        "flex flex-col",
        "bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95",
        "border-r border-slate-700/50",
        "shadow-2xl",
        "hidden lg:flex"
      )}
      style={{ width: `${sidebarWidth}px` }}
      aria-label="Main navigation sidebar"
    >
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header - Minimal Gaps */}
        <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-700/50">
          {/* Home Button - No Container, Top Left, Small */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors mb-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>HOME</span>
          </Link>

          {/* Brand - Tighter Spacing */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-slate-900" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm leading-tight">THARAGA</span>
              <span className="text-amber-300 text-[10px] font-medium leading-tight">Builder Portal</span>
            </div>
          </div>

          {/* Search - Compact */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search..."
              className={cn(
                "w-full pl-8 pr-2 py-1.5 bg-slate-800/50 backdrop-blur-sm",
                "border rounded-lg text-white placeholder:text-slate-400 text-xs",
                "focus:outline-none transition-all duration-200",
                isSearchFocused 
                  ? "glow-border bg-slate-800/70 shadow-sm" 
                  : "border-slate-700/50 hover:border-slate-600/50"
              )}
            />
          </div>
        </div>

        {/* Navigation - Minimal Gaps */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
          <AnimatePresence mode="wait">
            {filteredGroups.map((group, groupIndex) => (
              <motion.div
                key={groupIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.03 }}
                className={cn("space-y-0.5", group.label && "mb-3")}
              >
                {/* Group Label */}
                {group.label && (
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                )}

                {/* Group Items - NO DROPDOWNS, all items are flat */}
                {group.items.map((item) => {
                  const isActive = isItemActive(item)
                  const isLocked = isTrial && !!item.requiresPro
                  const Icon = item.icon

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={(e) => {
                        if (isLocked) {
                          // Still navigate to show the upgrade/lock screen
                          handleNavigation(item.href, e)
                          return
                        }
                        handleNavigation(item.href, e)
                      }}
                      className={cn(
                        "relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 group text-left",
                        "hover:bg-slate-700/40",
                        isActive
                          ? "bg-amber-500/20 text-white border-l-2 border-l-amber-400"
                          : "text-slate-300 hover:text-white border-l-2 border-l-transparent"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors duration-150",
                        isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-300"
                      )} />

                      <span className="flex-1 font-medium text-sm truncate min-w-0">{item.label}</span>

                      {/* Badge */}
                      {item.badge !== null && item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-400/30">
                          {item.badge}
                        </span>
                      )}

                      {/* Lock Icon */}
                      {isLocked && (
                        <span className="text-xs text-slate-500">🔒</span>
                      )}
                    </button>
                  )
                })}
              </motion.div>
            ))}
          </AnimatePresence>
        </nav>
      </div>
    </motion.aside>
  )
}
