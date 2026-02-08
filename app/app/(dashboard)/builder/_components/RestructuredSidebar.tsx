"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase'
import { useTrialStatus } from './TrialStatusManager'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Calendar,
  Settings,
  BarChart3,
  Zap,
  CreditCard,
  Handshake,
  FileText,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Wrench,
  Workflow,
  Link2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | null
  requiresPro?: boolean
  submenu?: Array<{ href: string; label: string }>
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
 * Restructured Builder Dashboard Sidebar
 * Based on Perplexity research recommendations for optimal UX flow
 * 
 * Structure:
 * 1. Dashboard (Home)
 * 2. Properties
 * 3. Leads & CRM
 * 4. Communications
 * 5. Calendar & Viewings
 * 6. Analytics & Reports
 * 7. Automation
 * 8. Settings
 */
export function RestructuredSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
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
  const routeToSectionMap: Record<string, string> = {
    '/builder': 'overview',
    '/builder/leads': 'leads',
    '/builder/properties': 'properties',
    '/builder/pipeline': 'pipeline',
    '/builder/viewings': 'viewings',
    '/builder/negotiations': 'negotiations',
    '/builder/contracts': 'contracts',
    '/builder/contacts': 'contacts',
  }

  // Handle section-based navigation (NO PAGE RELOAD)
  const handleSectionNavigation = useCallback((href: string) => {
    if (typeof window === 'undefined') return
    
    // Extract section from href
    let section: string | null = null
    if (href.startsWith('/builder?section=')) {
      section = href.split('?section=')[1]?.split('&')[0] || null
    } else {
      section = routeToSectionMap[href] || null
    }
    
    if (!section) {
      // Not a section route, use regular navigation
      router.push(href)
      return
    }
    
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.pathname = '/builder'
    url.searchParams.set('section', section)
    window.history.pushState({}, '', url.toString())
    
    // Dispatch custom event for section change (BuilderDashboardClient listens to this)
    window.dispatchEvent(new CustomEvent('dashboard-section-change', { 
      detail: { section } 
    }))
  }, [router])

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

  // Task-oriented navigation structure (based on Perplexity research)
  const navGroups = useMemo<NavGroup[]>(() => {
    const createSectionUrl = (section: string) => `/builder?section=${section}`

    return [
      // 1. Dashboard (Home)
      {
        items: [
          { 
            href: '/builder', 
            label: 'Dashboard', 
            icon: LayoutDashboard, 
            badge: null, 
            requiresPro: false 
          },
        ]
      },
      // 2. Properties
      {
        label: 'Properties',
        items: [
          { 
            href: createSectionUrl('properties'), 
            label: 'All Properties', 
            icon: Building2, 
            requiresPro: false,
            submenu: [
              { href: createSectionUrl('properties'), label: 'Manage Properties' },
              { href: '/builder/properties/performance', label: 'Performance Analytics' },
            ]
          },
        ]
      },
      // 3. Leads & CRM
      {
        label: 'Leads & CRM',
        items: [
          { 
            href: createSectionUrl('leads'), 
            label: 'Lead Management', 
            icon: Users, 
            badge: isLoadingCount ? null : (leadCount?.total ?? 0),
            requiresPro: false,
            submenu: [
              { href: createSectionUrl('leads'), label: 'All Leads' },
              { href: createSectionUrl('pipeline'), label: 'Pipeline View' },
            ]
          },
          { 
            href: createSectionUrl('contacts'), 
            label: 'Contacts', 
            icon: Users, 
            requiresPro: false,
          },
        ]
      },
      // 4. Communications
      {
        label: 'Communication',
        items: [
          { 
            href: '/builder/messaging', 
            label: 'Messages', 
            icon: MessageSquare, 
            requiresPro: false,
            submenu: [
              { href: '/builder/messaging', label: 'WhatsApp' },
            ]
          },
        ]
      },
      // 5. Calendar & Viewings
      {
        label: 'Calendar & Viewings',
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
        ]
      },
      // 6. Analytics & Reports
      {
        label: 'Analytics',
        items: [
          { 
            href: '/builder/analytics', 
            label: 'Analytics Dashboard', 
            icon: BarChart3, 
            requiresPro: false
          },
          { 
            href: '/builder/revenue', 
            label: 'Revenue Analytics', 
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
        item.label.toLowerCase().includes(query) ||
        item.submenu?.some(sub => sub.label.toLowerCase().includes(query))
      )
    })).filter(group => group.items.length > 0)
  }, [navGroups, searchQuery])

  // Check if route uses section-based navigation
  const shouldUseQueryParams = (href: string): boolean => {
    return href.startsWith('/builder?section=') || href in routeToSectionMap
  }

  // Determine active state (works on initial load)
  const isItemActive = (item: NavItem): boolean => {
    if (typeof window === 'undefined') return false
    
    // For section-based routes, check URL params
    if (shouldUseQueryParams(item.href)) {
      const section = routeToSectionMap[item.href] || item.href.split('?section=')[1]?.split('&')[0]
      if (section) {
        const urlParams = new URLSearchParams(window.location.search)
        const currentSection = urlParams.get('section') || 'overview'
        return currentSection === section
      }
    }
    
    // For regular routes, check pathname
    if (pathname === item.href || pathname.startsWith(item.href + '/')) {
      return true
    }
    
    return false
  }
  
  // Sync active section on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Read initial section from URL on mount
    const urlParams = new URLSearchParams(window.location.search)
    const initialSection = urlParams.get('section') || 'overview'
    
    // Trigger section change event to sync dashboard
    // Use setTimeout to ensure BuilderDashboardClient is ready
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dashboard-section-change', { 
        detail: { section: initialSection } 
      }))
    }, 0)
  }, [])

  const sidebarWidth = 280 // Optimal width per research (240-300px range)

  return (
    <motion.aside
      initial={{ x: -sidebarWidth }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-[1000]",
        "flex flex-col",
        "bg-slate-900/95 backdrop-blur-2xl",
        "border-r glow-border",
        "shadow-[0_0_60px_rgba(251,191,36,0.1)]",
        "hidden lg:flex"
      )}
      style={{ width: `${sidebarWidth}px` }}
      aria-label="Main navigation sidebar"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800/50 to-slate-900 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]" />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-3 py-3 border-b glow-border"
        >
          {/* Home Button - No Container, Top Left, Small Size */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>HOME</span>
          </Link>

          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
              <Sparkles className="w-4.5 h-4.5 text-slate-900" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm leading-tight">THARAGA</span>
              <span className="text-amber-300 text-[10px] font-medium leading-tight">Builder Portal</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search commands..."
              className={cn(
                "w-full pl-9 pr-2.5 py-2 bg-slate-800/50 backdrop-blur-sm",
                "border-2 rounded-lg text-white placeholder:text-slate-400 text-xs",
                "focus:outline-none transition-all duration-300",
                isSearchFocused 
                  ? "glow-border shadow-[0_0_20px_rgba(212,175,55,0.2)] bg-slate-800/70" 
                  : "border-slate-700/50 hover:border-slate-600/50"
              )}
            />
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
          <AnimatePresence mode="wait">
            {filteredGroups.map((group, groupIndex) => (
              <motion.div
                key={groupIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.05 }}
                className={cn("space-y-1", group.label && "mb-4")}
              >
                {/* Group Label */}
                {group.label && (
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                )}

                {/* Group Items */}
                {group.items.map((item) => {
                  const isActive = isItemActive(item)
                  const isLocked = isTrial && !!item.requiresPro
                  const hasSubmenu = item.submenu && item.submenu.length > 0
                  const isSubmenuOpen = openSubmenus.has(item.href)
                  const isHovered = hoveredItem === item.href
                  const Icon = item.icon

                  return (
                    <div key={item.href}>
                      {/* Main Item */}
                      {shouldUseQueryParams(item.href) && !isLocked ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleSectionNavigation(item.href)
                            if (hasSubmenu) toggleSubmenu(item.href)
                          }}
                          onMouseEnter={() => setHoveredItem(item.href)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 group text-left",
                            "hover:bg-slate-800/60",
                            isActive
                              ? "bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-white shadow-lg shadow-amber-500/20"
                              : "text-slate-300 hover:text-white"
                          )}
                        >
                          {/* Active Indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}

                          <Icon className={cn(
                            "w-5 h-5 flex-shrink-0 transition-colors",
                            isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-300"
                          )} />

                          <span className="flex-1 font-medium">{item.label}</span>

                          {/* Badge */}
                          {item.badge !== null && item.badge !== undefined && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 rounded-full">
                              {item.badge}
                            </span>
                          )}

                          {/* Submenu Toggle */}
                          {hasSubmenu && (
                            <motion.div
                              animate={{ rotate: isSubmenuOpen ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </motion.div>
                          )}

                          {/* Lock Icon */}
                          {isLocked && (
                            <span className="text-xs text-slate-500">🔒</span>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={isLocked ? '#' : item.href}
                          onClick={(e) => {
                            if (isLocked) {
                              e.preventDefault()
                              // Show upgrade modal
                              return
                            }
                            if (hasSubmenu) {
                              e.preventDefault()
                              toggleSubmenu(item.href)
                              return
                            }
                            // For builder routes, use Next.js router for smooth transition
                            if (item.href.startsWith('/builder/') && !item.href.includes('?')) {
                              e.preventDefault()
                              router.push(item.href)
                            }
                          }}
                          onMouseEnter={() => setHoveredItem(item.href)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 group",
                            "hover:bg-slate-800/60",
                            isActive
                              ? "bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-white shadow-lg shadow-amber-500/20"
                              : "text-slate-300 hover:text-white"
                          )}
                        >
                          {/* Active Indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}

                          <Icon className={cn(
                            "w-5 h-5 flex-shrink-0 transition-colors",
                            isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-300"
                          )} />

                          <span className="flex-1 font-medium">{item.label}</span>

                          {/* Badge */}
                          {item.badge !== null && item.badge !== undefined && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 rounded-full">
                              {item.badge}
                            </span>
                          )}

                          {/* Submenu Toggle */}
                          {hasSubmenu && (
                            <motion.div
                              animate={{ rotate: isSubmenuOpen ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </motion.div>
                          )}

                          {/* Lock Icon */}
                          {isLocked && (
                            <span className="text-xs text-slate-500">🔒</span>
                          )}
                        </Link>
                      )}

                      {/* Submenu */}
                      {hasSubmenu && (
                        <AnimatePresence>
                          {isSubmenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-8 mt-1 space-y-1">
                                {item.submenu?.map((subItem) => {
                                  // Check if submenu item uses section-based routing
                                  const subItemUsesQueryParams = subItem.href.startsWith('/builder?section=') || routeToSectionMap[subItem.href]
                                  let isSubActive = false
                                  
                                  if (subItemUsesQueryParams) {
                                    const section = routeToSectionMap[subItem.href] || subItem.href.split('?section=')[1]?.split('&')[0]
                                    if (section && typeof window !== 'undefined') {
                                      const urlParams = new URLSearchParams(window.location.search)
                                      isSubActive = urlParams.get('section') === section
                                    }
                                  } else {
                                    isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                                  }
                                  
                                  if (subItemUsesQueryParams) {
                                    return (
                                      <button
                                        key={subItem.href}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          handleSectionNavigation(subItem.href)
                                          toggleSubmenu(item.href)
                                        }}
                                        className={cn(
                                          "w-full text-left block px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                          isSubActive
                                            ? "bg-amber-500/10 text-amber-300 font-medium"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                                        )}
                                      >
                                        {subItem.label}
                                      </button>
                                    )
                                  }
                                  
                                  return (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      onClick={(e) => {
                                        // For regular links, use Next.js navigation but prevent default if it's a builder route
                                        if (subItem.href.startsWith('/builder/')) {
                                          e.preventDefault()
                                          router.push(subItem.href)
                                        }
                                        // Auto-close submenu after navigation
                                        setTimeout(() => toggleSubmenu(item.href), 150)
                                      }}
                                      className={cn(
                                        "block px-3 py-2 rounded-lg text-sm transition-all duration-200 ml-2",
                                        isSubActive
                                          ? "bg-amber-500/15 text-amber-300 font-medium border-l-2 border-l-amber-400"
                                          : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-l-2 hover:border-l-amber-400/30 border-l-2 border-l-transparent"
                                      )}
                                    >
                                      {subItem.label}
                                    </Link>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
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






















