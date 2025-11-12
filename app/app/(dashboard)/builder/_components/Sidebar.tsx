"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Building2, DollarSign, MessageSquare, Settings, Lock, HelpCircle, Building, Clock, BarChart3 } from 'lucide-react'

interface SubscriptionData {
  tier: 'trial' | 'pro' | 'enterprise' | string
  trial_leads_used?: number
  days_remaining?: number
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

export function Sidebar() {
  const pathname = usePathname()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [leadCount, setLeadCount] = useState<LeadCountData | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [badgeAnimation, setBadgeAnimation] = useState<'pulse' | 'bounce' | null>(null)
  const previousCountRef = useRef<number>(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
        if (!cancelled) setSubscription({ tier: 'trial', trial_leads_used: 0, days_remaining: 14 })
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Fetch lead count with real-time updates
  useEffect(() => {
    let cancelled = false
    let retryCount = 0
    const maxRetries = 3

    async function fetchLeadCount() {
      try {
        const res = await fetch('/api/leads/count', { 
          next: { revalidate: 0 } as any,
          cache: 'no-store' // Ensure fresh data
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        if (json.success && json.data && !cancelled) {
          const newCount = json.data.total
          const previousCount = previousCountRef.current
          
          // Animate badge if count changed
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
          retryCount = 0 // Reset retry on success
        }
      } catch (error) {
        console.error('[Sidebar] Error fetching lead count:', error)
        retryCount++
        if (retryCount < maxRetries && !cancelled) {
          // Exponential backoff on retry
          setTimeout(() => fetchLeadCount(), Math.min(1000 * Math.pow(2, retryCount), 10000))
        } else if (!cancelled) {
          setIsLoadingCount(false)
        }
      }
    }

    // Initial fetch
    fetchLeadCount()

    // Set up polling - smart intervals:
    // - Fast updates when on leads page (5s)
    // - Normal updates otherwise (15s)
    // - Slower when tab is hidden (30s)
    const getPollInterval = () => {
      if (document.hidden) return 30000 // 30s when tab hidden
      if (pathname.startsWith('/builder/leads')) return 5000 // 5s when on leads page
      return 15000 // 15s otherwise
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

    // Listen for custom refresh events from other components
    const handleRefreshEvent = () => {
      if (!cancelled) {
        fetchLeadCount()
      }
    }

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (!cancelled) {
        startPolling()
        // Refresh immediately when tab becomes visible
        if (!document.hidden) {
          fetchLeadCount()
        }
      }
    }

    // Listen for focus events (when user switches back to tab)
    const handleFocus = () => {
      if (!cancelled && !document.hidden) {
        fetchLeadCount()
      }
    }

    // Listen for custom events
    window.addEventListener('leadCountRefresh', handleRefreshEvent)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Cleanup
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

  // Build navigation items with dynamic badge
  const items = useMemo<NavItem[]>(() => [
    { href: '/builder', label: 'Overview', icon: LayoutDashboard, badge: null, requiresPro: false },
    { 
      href: '/builder/leads', 
      label: 'Leads', 
      icon: Users, 
      badge: isLoadingCount ? null : (leadCount?.total ?? 0), 
      requiresPro: false, 
      submenu: [
        { href: '/builder/leads', label: 'All Leads' },
        { href: '/builder/leads/pipeline', label: 'Pipeline' },
        { href: '/builder/analytics', label: 'Analytics' },
      ]
    },
    { href: '/builder/properties', label: 'Properties', icon: Building2, requiresPro: false, submenu: [
      { href: '/builder/properties', label: 'Manage' },
      { href: '/builder/properties/performance', label: 'Performance' },
      { href: '/builder/properties/insights', label: 'AI Insights' },
    ]},
    { href: '/builder/revenue', label: 'Revenue', icon: DollarSign, requiresPro: true, submenu: [
      { href: '/builder/revenue', label: 'Overview' },
      { href: '/builder/revenue/payments', label: 'Payments' },
      { href: '/builder/revenue/forecasting', label: 'Forecasting' },
    ]},
    { href: '/builder/messaging', label: 'Client Outreach', icon: MessageSquare, requiresPro: false, submenu: [
      { href: '/builder/messaging', label: 'Send Messages' },
      { href: '/builder/communications', label: 'Communications' },
    ]},
    { href: '/behavior-tracking', label: 'Behavior Analytics', icon: BarChart3, requiresPro: false },
    { href: '/builder/settings', label: 'Settings', icon: Settings, requiresPro: false },
  ], [leadCount, isLoadingCount])

  return (
    <aside className="w-64 bg-gradient-to-b from-primary-950 to-primary-900 text-white flex flex-col shadow-2xl h-[calc(100vh-60px)] sticky top-[60px]">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/builder" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-primary-950" />
          </div>
          <div>
            <div className="font-bold text-lg">Tharaga</div>
            <div className="text-xs text-gray-400">Builder Portal</div>
          </div>
        </Link>
      </div>

      {/* Trial Banner */}
      {subscription?.tier === 'trial' && (
        <div className="mx-4 mt-4 p-4 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-semibold text-gold-300">Trial Active</span>
          </div>
          <div className="text-xs text-gray-300 mb-2">
            {subscription.trial_leads_used ?? 0} of 10 leads used
          </div>
          <div className="w-full bg-primary-800 rounded-full h-2 mb-2">
            <div
              className="bg-gold-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(((subscription.trial_leads_used ?? 0) / 10) * 100).toFixed(0)}%` }}
            />
          </div>
          <div className="text-xs text-gray-400">
            {subscription.days_remaining ?? 0} days remaining
          </div>
          <Link
            href="/builder/upgrade"
            className="mt-3 w-full block text-center py-2 bg-gold-500 hover:bg-gold-600 text-primary-950 font-semibold rounded-lg text-sm transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isLocked = (subscription?.tier === 'trial') && !!item.requiresPro

          return (
            <div key={item.href}>
              <Link
                href={isLocked ? '#' : item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative border-l-4',
                  isActive ? 'bg-gold-500/20 border-gold-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white border-transparent',
                  isLocked && 'opacity-50 cursor-not-allowed'
                )}
                onClick={isLocked ? (e) => e.preventDefault() : undefined}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span 
                    className={cn(
                      "ml-auto px-2 py-0.5 text-white text-xs font-bold rounded-full transition-all duration-300",
                      "bg-emerald-500 hover:bg-emerald-400",
                      badgeAnimation === 'pulse' && "animate-pulse ring-2 ring-emerald-300 ring-offset-2 ring-offset-primary-900",
                      badgeAnimation === 'bounce' && "animate-bounce",
                      isLoadingCount && "opacity-50"
                    )}
                    title={typeof item.badge === 'number' ? `${item.badge} leads` : item.badge}
                  >
                    {isLoadingCount ? (
                      <span className="inline-block w-4 h-3 bg-white/30 rounded animate-pulse" />
                    ) : (
                      <>
                        {typeof item.badge === 'number' ? (
                          item.badge > 99 ? '99+' : item.badge
                        ) : (
                          item.badge
                        )}
                        {leadCount && leadCount.hot > 0 && item.href === '/builder/leads' && (
                          <span 
                            className="ml-1.5 inline-block w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" 
                            title={`${leadCount.hot} hot leads available`}
                          />
                        )}
                        {leadCount && leadCount.pending_interactions > 0 && item.href === '/builder/leads' && (
                          <span 
                            className="ml-1 inline-block w-1 h-1 bg-orange-400 rounded-full" 
                            title={`${leadCount.pending_interactions} pending interactions`}
                          />
                        )}
                      </>
                    )}
                  </span>
                )}
                {isLocked && (
                  <Lock className="ml-auto w-4 h-4" />
                )}
              </Link>

              {item.submenu && isActive && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        'block px-4 py-2 text-sm rounded-lg transition-colors',
                        pathname === sub.href ? 'text-gold-400 font-medium' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/builder/help"
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-all"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">Help & Support</span>
        </Link>
      </div>
    </aside>
  )
}
