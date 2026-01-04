"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  Clock,
  Calendar,
  Handshake,
  FileText,
  Activity,
  Sparkles,
  TrendingUp
} from 'lucide-react'

interface SubscriptionData {
  tier: 'trial' | 'pro' | 'enterprise' | 'trial_expired' | string
  days_remaining?: number
  builder_name?: string | null
  is_trial_expired?: boolean
}

interface LeadCountData {
  total: number
  hot: number
  warm: number
}

export function BuilderTopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Fetch subscription data
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/builder/subscription', { next: { revalidate: 0 } as any })
        if (!res.ok) throw new Error('Failed')
        const data = (await res.json()) as SubscriptionData
        if (!cancelled) setSubscription(data)
      } catch (_) {
        if (!cancelled) setSubscription({ tier: 'trial', days_remaining: 14 })
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Fetch lead count
  useEffect(() => {
    let cancelled = false
    async function fetchLeadCount() {
      try {
        const res = await fetch('/api/leads/count', { 
          next: { revalidate: 0 } as any,
          cache: 'no-store'
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        if (json.success && json.data && !cancelled) {
          setLeadCount(json.data)
          setIsLoadingCount(false)
        }
      } catch (error) {
        console.error('[TopNav] Error fetching lead count:', error)
        if (!cancelled) setIsLoadingCount(false)
      }
    }

    fetchLeadCount()
    const interval = setInterval(() => {
      if (!cancelled) fetchLeadCount()
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Handle search (Cmd/Ctrl+K) - simple handler, doesn't depend on navItems
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('builder-search-input')
        if (searchInput) {
          (searchInput as HTMLInputElement).focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Navigation items - using section IDs for single-page navigation
  const navItems = useMemo(() => [
    { 
      section: 'overview',
      label: 'Overview', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      section: 'leads',
      label: 'Leads', 
      icon: Users,
      badge: isLoadingCount ? null : (leadCount?.total ?? 0)
    },
    { 
      section: 'pipeline',
      label: 'Pipeline', 
      icon: BarChart3,
      badge: null
    },
    { 
      section: 'properties',
      label: 'Properties', 
      icon: Building2,
      badge: null
    },
    { 
      section: 'client-outreach',
      label: 'Client Outreach', 
      icon: MessageSquare,
      badge: null
    },
    { 
      section: 'behavior-analytics',
      label: 'Behavior Analytics', 
      icon: BarChart3,
      badge: null
    },
    { 
      section: 'viewings',
      label: 'Viewings', 
      icon: Calendar,
      badge: null
    },
    { 
      section: 'negotiations',
      label: 'Negotiations', 
      icon: Handshake,
      badge: null
    },
    { 
      section: 'contracts',
      label: 'Contracts', 
      icon: FileText,
      badge: null
    },
    { 
      section: 'deal-lifecycle',
      label: 'Deal Lifecycle', 
      icon: Activity,
      badge: null
    },
    { 
      section: 'ultra-automation-analytics',
      label: 'Automation Analytics', 
      icon: TrendingUp,
      badge: null
    },
    { 
      section: 'settings',
      label: 'Settings', 
      icon: Settings,
      badge: null
    },
  ], [leadCount, isLoadingCount])

  // Handle section navigation - use useCallback to stabilize reference
  const handleSectionChange = useCallback((section: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    window.history.pushState({}, '', url.toString())
    // Dispatch custom event for section change
    window.dispatchEvent(new CustomEvent('dashboard-section-change', { detail: { section } }))
  }, [])

  // Get current page title based on active section
  const getPageTitle = () => {
    const sectionTitles: Record<string, string> = {
      'overview': 'Overview',
      'leads': 'Leads',
      'pipeline': 'Pipeline',
      'properties': 'Properties',
      'client-outreach': 'Client Outreach',
      'behavior-analytics': 'Behavior Analytics',
      'settings': 'Settings',
    }
    return sectionTitles[currentSection] || 'Dashboard'
  }

  // Get current section from URL or pathname
  const getCurrentSection = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section')
      if (section) return section
    }
    // Fallback to pathname-based detection
    if (pathname === '/builder' || pathname === '/builder/') return 'overview'
    if (pathname.startsWith('/builder/leads/pipeline')) return 'pipeline'
    if (pathname.startsWith('/builder/leads')) return 'leads'
    if (pathname.startsWith('/builder/properties')) return 'properties'
    if (pathname.startsWith('/builder/messaging')) return 'client-outreach'
    if (pathname.startsWith('/behavior-tracking')) return 'behavior-analytics'
    if (pathname.startsWith('/builder/settings')) return 'settings'
    return 'overview'
  }

  const currentSection = getCurrentSection()
  
  const isActive = (section: string) => {
    return currentSection === section
  }

  // Keyboard shortcuts for section navigation - placed after all dependencies are defined
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Number keys for quick section navigation (1-7)
      const sectionMap: Record<string, string> = {
        '1': 'overview',
        '2': 'leads',
        '3': 'pipeline',
        '4': 'properties',
        '5': 'client-outreach',
        '6': 'behavior-analytics',
        '7': 'settings',
      }

      if (e.key >= '1' && e.key <= '7' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        const section = sectionMap[e.key]
        if (section) {
          handleSectionChange(section)
          // Show visual feedback
          setTimeout(() => {
            const button = document.querySelector(`[data-section="${section}"]`) as HTMLElement
            if (button) {
              button.classList.add('ring-2', 'ring-[#D4AF37]', 'ring-offset-2', 'ring-offset-[#0a1628]')
              setTimeout(() => {
                button.classList.remove('ring-2', 'ring-[#D4AF37]', 'ring-offset-2', 'ring-offset-[#0a1628]')
              }, 400)
            }
          }, 50)
        }
        return
      }

      // Arrow keys for navigation (with Alt modifier)
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const currentIndex = navItems.findIndex(item => isActive(item.section))
        let newIndex = currentIndex

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          newIndex = (currentIndex + 1) % navItems.length
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          newIndex = (currentIndex - 1 + navItems.length) % navItems.length
        }

        if (newIndex !== currentIndex && newIndex >= 0) {
          handleSectionChange(navItems[newIndex].section)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navItems, currentSection, handleSectionChange, isActive])

  return (
    <>
      {/* Desktop Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden lg:block">
        <div className="bg-[rgba(10,22,40,0.85)] backdrop-blur-[24px] border-b border-white/[0.06]">
          <div className="max-w-[1920px] mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
            {/* Left: Logo + Page Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleSectionChange('overview')}
                className="flex items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center shadow-lg shadow-gold-500/30">
                  <span className="text-xl font-bold text-[#0a1628]">T</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-white text-sm">THARAGA</span>
                  <span className="text-[#D4AF37] text-[10px] font-medium">Builder Portal</span>
                </div>
              </button>
              
              <div className="h-6 w-px bg-white/10" />
              
              <h1 className="text-lg font-semibold text-white">
                {getPageTitle()}
              </h1>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="builder-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows or properties (⌘K)"
                  className="w-full pl-11 pr-4 py-2.5 bg-white/[0.03] backdrop-blur-[12px] border border-white/[0.1] rounded-xl text-white placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>
            </div>

            {/* Right: Navigation + User */}
            <div className="flex items-center gap-3">
              {/* Navigation Items */}
              <nav className="hidden xl:flex items-center gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.section)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.section}
                      data-section={item.section}
                      onClick={() => handleSectionChange(item.section)}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group",
                        active
                          ? "text-white bg-gradient-to-r from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] border-l-3 glow-border shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]"
                          : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                      )}
                      title={`${item.label} (Press ${navItems.indexOf(item) + 1})`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors">
                        {navItems.indexOf(item) + 1}
                      </span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className="ml-1 px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold rounded-full">
                          {typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>

              <div className="h-6 w-px bg-white/10" />

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a1628] animate-pulse" />
              </button>

              {/* Help */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Trial Badge */}
              {subscription && subscription.tier === 'trial' && (
                <Link
                  href="/pricing"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    (subscription.days_remaining ?? 0) === 0
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : (subscription.days_remaining ?? 0) <= 3
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                      : "bg-[#D4AF37]/20 text-[#D4AF37] glow-border"
                  )}
                >
                  Trial • {(subscription.days_remaining ?? 0) === 0 ? 'Expired' : `${subscription.days_remaining} days left`}
                </Link>
              )}

              {/* User Avatar */}
              <div className="flex items-center gap-2 pl-2">
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-xs text-gray-400">Builder</span>
                  <span className="text-sm font-medium text-white">
                    {subscription?.builder_name || 'My Account'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-900 to-primary-600 text-white flex items-center justify-center text-sm font-semibold shadow-lg">
                  {(subscription?.builder_name || 'B').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-[rgba(10,22,40,0.85)] backdrop-blur-[24px] border-b border-white/[0.06]">
          <div className="px-4 h-[60px] flex items-center justify-between">
            {/* Left: Logo & Title (20% width equivalent) */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => handleSectionChange('overview')}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center shadow-md">
                  <span className="text-base font-bold text-[#0a1628]">T</span>
                </div>
              </button>
              <h1 className="text-base font-semibold text-white truncate">{getPageTitle()}</h1>
            </div>

            {/* Right: User Icon & Hamburger Menu (40% width equivalent) */}
            <div className="flex items-center gap-2">
              {/* User Account Icon - Mobile Only */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-user-profile'))}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a1628]"
                aria-label="User account"
              >
                <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {(subscription?.builder_name || 'B').charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a1628]"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
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
                      <Menu className="w-6 h-6 text-[#D4AF37]" aria-hidden="true" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay & Sidebar - Slides from RIGHT */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop - 70% opacity */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />

              {/* Menu Panel - Slides from RIGHT with 350ms ease-out */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{
                  type: 'tween',
                  duration: 0.35,
                  ease: 'easeOut'
                }}
                className="fixed top-0 right-0 bottom-0 w-full bg-gradient-to-b from-[#0a1628] via-slate-900 to-[#0a1628] z-50 overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation menu"
              >
                {/* Menu Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
                  <span className="text-xl font-bold text-white">Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 hover:bg-white/5"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6 text-white" aria-hidden="true" />
                  </button>
                </div>

                <nav className="px-4 py-6 space-y-2">
                  {/* Search in Mobile Menu */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search workflows or properties..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] backdrop-blur-[12px] border border-white/[0.1] rounded-xl text-white placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Navigation Items - Staggered with 50ms delay */}
                  {navItems.map((item, index) => {
                    const active = isActive(item.section)
                    const Icon = item.icon
                    return (
                      <motion.button
                        key={item.section}
                        data-section={item.section}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        onClick={() => {
                          handleSectionChange(item.section)
                          setMobileMenuOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 text-left active:scale-[0.98] group hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500",
                          active
                            ? "text-white bg-gradient-to-r from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] border-l-3 glow-border shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]"
                            : "text-gray-300 hover:text-white hover:bg-white/5"
                        )}
                        title={`${item.label} (Press ${index + 1})`}
                      >
                        <Icon className={cn("w-5 h-5 shrink-0", active ? "text-[#D4AF37]" : "text-gray-400")} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== null && item.badge !== undefined && (
                          <span className="ml-auto px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded-full shrink-0">
                            {typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge}
                          </span>
                        )}
                      </motion.button>
                    )
                  })}

                  {/* Trial Status in Mobile Menu */}
                  {subscription && subscription.tier === 'trial' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navItems.length * 0.05 + 0.1, duration: 0.3 }}
                      className="mt-6 p-4 bg-[#D4AF37]/10 backdrop-blur-[12px] glow-border rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-semibold text-[#D4AF37]">Trial Active</span>
                      </div>
                      <div className="text-xs text-gray-300 mb-2">
                        {(subscription.days_remaining ?? 0) === 0
                          ? 'Expired - Upgrade Now'
                          : `${subscription.days_remaining} day${subscription.days_remaining === 1 ? '' : 's'} left`}
                      </div>
                      <button
                        onClick={() => {
                          window.location.href = '/pricing'
                          setMobileMenuOpen(false)
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0a1628] text-xs font-bold rounded-lg hover:shadow-lg transition-all active:scale-95"
                      >
                        Upgrade to Pro
                      </button>
                    </motion.div>
                  )}
                </nav>

                {/* Menu Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06] bg-[#0a1628]/50 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: navItems.length * 0.05 + 0.15, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Builder: {subscription?.builder_name || 'Account'}</span>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
                        className="flex items-center gap-1 text-[#D4AF37] hover:text-[#F4D03F] transition-colors"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Help</span>
                      </button>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      &copy; {new Date().getFullYear()} THARAGA
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}

