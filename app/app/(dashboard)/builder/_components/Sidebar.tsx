"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Building2, DollarSign, MessageSquare, Settings, Lock, HelpCircle, Building, Clock, BarChart3, CreditCard } from 'lucide-react'

interface SubscriptionData {
  tier: 'trial' | 'pro' | 'enterprise' | 'trial_expired' | string
  trial_leads_used?: number
  days_remaining?: number
  is_trial_expired?: boolean
  status?: string
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

  // Fetch subscription data (unchanged behaviour)
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

  // Fetch lead count with real-time updates (unchanged behaviour)
  useEffect(() => {
    let cancelled = false
    let retryCount = 0
    const maxRetries = 3

    async function fetchLeadCount() {
      try {
        const res = await fetch('/api/leads/count', {
          next: { revalidate: 0 } as any,
          cache: 'no-store', // Ensure fresh data
          credentials: 'include', // Important: Include cookies for auth
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

  // Build navigation items with dynamic badge (same destinations)
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
    { href: '/builder/billing', label: 'Billing & Usage', icon: CreditCard, requiresPro: false },
    { href: '/builder/settings', label: 'Settings', icon: Settings, requiresPro: false },
  ], [leadCount, isLoadingCount])

  const isTrial = subscription?.tier === 'trial' || subscription?.tier === 'trial_expired' || subscription?.is_trial_expired

  return (
    <aside className="group/sidebar relative h-[calc(100vh-60px)] sticky top-[60px] hidden lg:flex flex-col text-white bg-[#0F111C] shadow-2xl w-[60px] hover:w-[230px] transition-[width] duration-300 ease-out overflow-hidden">
      {/* Logo + trial badge condensed */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-white/10">
        <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center">
          <Building className="w-5 h-5 text-primary-950" />
        </div>
        <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
          <div className="font-semibold text-sm">Tharaga</div>
          <div className="text-[11px] text-gray-400">Builder Portal</div>
        </div>
      </div>

      {isTrial && (
        <Link 
          href="/pricing"
          className="mx-3 mt-3 p-3 rounded-xl bg-gold-500/15 backdrop-blur-sm glow-border hover:bg-gold-500/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-gold-300" />
            <span className="text-[11px] font-semibold text-gold-100">Trial Active</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-primary-900 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gold-400 transition-all duration-300"
              style={{ width: `${(((subscription?.trial_leads_used ?? 0) / 10) * 100).toFixed(0)}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-gray-300">
              {subscription?.days_remaining === 0 
                ? 'Expired - Upgrade' 
                : subscription?.days_remaining && subscription.days_remaining <= 3
                ? `⚠️ ${subscription.days_remaining} day${subscription.days_remaining === 1 ? '' : 's'} left`
                : `${subscription?.days_remaining ?? 0} days left`}
            </span>
            {(subscription?.days_remaining === 0 || (subscription?.days_remaining ?? 14) <= 3) && (
              <span className="text-[10px] text-gold-300 font-semibold">Upgrade →</span>
            )}
          </div>
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 mt-2 px-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isLocked = isTrial && !!item.requiresPro

          return (
            <div key={item.href}>
              <Link
                href={isLocked ? '#' : item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gold-500/20 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white',
                  isLocked && 'opacity-50 cursor-not-allowed'
                )}
                onClick={isLocked ? (e) => e.preventDefault() : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                  {item.label}
                </span>
                {item.badge !== null && item.badge !== undefined && (
                  <span 
                    className={cn(
                      "ml-auto px-2 py-0.5 text-white text-[10px] font-bold rounded-full transition-all duration-300",
                      "bg-emerald-500 hover:bg-emerald-400",
                      badgeAnimation === 'pulse' && "animate-pulse ring-2 ring-emerald-300 ring-offset-2 ring-offset-[#0F111C]",
                      badgeAnimation === 'bounce' && "animate-bounce",
                      isLoadingCount && "opacity-50"
                    )}
                    title={typeof item.badge === 'number' ? `${item.badge} leads` : String(item.badge)}
                  >
                    {isLoadingCount ? (
                      <span className="inline-block w-4 h-3 bg-white/30 rounded animate-pulse" />
                    ) : (
                      <>
                        {typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge}
                        {leadCount && leadCount.hot > 0 && item.href === '/builder/leads' && (
                          <span 
                            className="ml-1 inline-block w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" 
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

              {/* Submenus appear only when expanded width (handled purely visually) */}
              {item.submenu && isActive && (
                <div className="ml-11 mt-1 space-y-0.5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        'block px-3 py-1.5 text-xs rounded-lg transition-colors',
                        pathname === sub.href ? 'text-gold-300 font-medium bg-white/5' : 'text-gray-400 hover:text-white'
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

      {/* Bottom link - AI Assistant */}
      <div className="px-2 py-3 border-t border-white/10">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-ai-assistant'))
          }}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          title="Open AI Assistant (Press ? for help)"
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
            Help &amp; Support
          </span>
        </button>
      </div>
    </aside>
  )
}

