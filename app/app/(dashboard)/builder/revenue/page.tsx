'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, FileText, PieChart, BarChart3, Lock, Sparkles } from 'lucide-react'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'

interface RevenueData {
  totalRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  pendingRevenue: number
  monthlyGrowth: number
  lastMonthRevenue: number
  breakdown: {
    commissions: number
    pendingCommissions: number
    affiliateCommissions: number
    propertySales: number
    monthlyPropertySales: number
  }
  pipelineValue: number
  pipelineLeads: number
  avgPropertyPrice: number
  commissionRate: number
  recentTransactions: Array<{
    id: string
    type: string
    amount: number
    dealValue: number
    date: string
    status: string
  }>
  stats: {
    totalDeals: number
    pendingDeals: number
    avgDealSize: number
    avgCommission: number
  }
  timeline: {
    thisMonth: number
    lastMonth: number
    thisYear: number
  }
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '₹0'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [subscription, setSubscription] = useState<any>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)

  const fetchRevenue = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const response = await fetch('/api/builder/revenue', {
        cache: 'no-store',
        next: { revalidate: 0 }
      })

      if (!response.ok) {
        // If 403, it's an upgrade requirement - handled by lock screen
        if (response.status === 403) {
          return
        }
        throw new Error('Failed to fetch revenue data')
      }

      const result = await response.json()
      if (result.success) {
        setRevenueData(result.data)
        setLastUpdated(new Date())
      } else {
        // If requires upgrade, don't show error, just return (lock screen will show)
        if (result.requiresUpgrade) {
          return
        }
        throw new Error(result.error || 'Failed to fetch revenue data')
      }
    } catch (err: any) {
      console.error('[Revenue Page] Error:', err)
      setError(err.message || 'Failed to load revenue data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Check subscription access
  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch('/api/builder/subscription', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setSubscription(data)
          const isTrial = data.tier === 'trial' || data.tier === 'trial_expired' || data.is_trial_expired
          if (isTrial) {
            setCheckingAccess(false)
            return // Don't fetch revenue for trial users
          }
        }
      } catch (err) {
        console.error('[Revenue] Subscription check error:', err)
      }
      setCheckingAccess(false)
    }
    checkAccess()
  }, [])

  useEffect(() => {
    // Only fetch if user has access (not trial)
    if (checkingAccess) return
    
    const isTrial = subscription?.tier === 'trial' || subscription?.tier === 'trial_expired' || subscription?.is_trial_expired
    if (isTrial) return

    fetchRevenue()

    // Set up real-time polling every 30 seconds
    const interval = setInterval(() => {
      fetchRevenue(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [checkingAccess, subscription])

  // Check if user has access
  const isTrial = subscription?.tier === 'trial' || subscription?.tier === 'trial_expired' || subscription?.is_trial_expired

  if (checkingAccess || loading) {
    return (
      <BuilderPageWrapper title="Revenue Dashboard" description="Track your real-time revenue and commissions">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </BuilderPageWrapper>
    )
  }

  // Show lock screen for trial users
  if (isTrial) {
    return (
      <BuilderPageWrapper title="Revenue Dashboard" description="Track your real-time revenue and commissions">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
          <div className="w-20 h-20 rounded-2xl bg-gold-500/20 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-gold-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Revenue Dashboard</h2>
          <p className="text-lg text-slate-300 mb-2 max-w-md">
            Access real-time revenue tracking, commission management, and financial insights
          </p>
          <p className="text-sm text-slate-400 mb-8">
            Upgrade to Builder Pro to unlock this premium feature
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30"
          >
            <Sparkles className="w-5 h-5" />
            Upgrade to Pro
          </Link>
          <div className="mt-8 p-6 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-4">What you'll get:</h3>
            <ul className="text-left space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-amber-300">✓</span>
                Real-time revenue tracking from all sources
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-300">✓</span>
                Commission transaction management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-300">✓</span>
                Revenue forecasting and predictions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-300">✓</span>
                Payment history and invoice management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-300">✓</span>
                Pipeline value calculations
              </li>
            </ul>
          </div>
        </div>
      </BuilderPageWrapper>
    )
  }

  if (error) {
    return (
      <BuilderPageWrapper title="Revenue Dashboard" description="Track your real-time revenue and commissions">
        <div className="text-center py-12">
          <p className="text-rose-300 mb-4">{error}</p>
          <button
            onClick={() => fetchRevenue()}
            className="px-4 py-2.5 bg-amber-500/20 glow-border text-amber-300 rounded-lg hover:bg-amber-500/30 transition-all"
          >
            Retry
          </button>
        </div>
      </BuilderPageWrapper>
    )
  }

  if (!revenueData) {
    return (
      <BuilderPageWrapper title="Revenue Dashboard" description="Track your real-time revenue and commissions">
        <div className="text-center py-16 px-6">
          <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <DollarSign className="h-10 w-10 text-slate-500" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">No revenue data available</h4>
          <p className="text-slate-400">Revenue data will appear here once you have transactions</p>
        </div>
      </BuilderPageWrapper>
    )
  }

  const growthColor = revenueData.monthlyGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'
  const growthIcon = revenueData.monthlyGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />

  return (
    <BuilderPageWrapper 
      title="Revenue Dashboard" 
      description="Track your real-time revenue, commissions, and pipeline value"
      noContainer
    >
      <div className="space-y-6">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
            </p>
          </div>
          <button
            onClick={() => fetchRevenue(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        {/* Main Revenue Cards - Design System Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-amber-300" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-amber-300" />
                <span className="text-xs text-slate-400">Total</span>
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Total Revenue</h3>
              <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                {formatCurrency(revenueData.totalRevenue)}
              </p>
              <p className="text-sm text-slate-400">All-time revenue</p>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="w-16 h-16 text-emerald-300" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 text-emerald-300" />
                <div className={`flex items-center gap-1 ${growthColor.replace('text-emerald-400', 'text-emerald-300').replace('text-red-400', 'text-rose-300')}`}>
                  {growthIcon}
                  <span className="text-xs font-medium">
                    {revenueData.monthlyGrowth >= 0 ? '+' : ''}{revenueData.monthlyGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Monthly Revenue</h3>
              <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                {formatCurrency(revenueData.monthlyRevenue)}
              </p>
              <p className="text-sm text-slate-400">This month</p>
            </div>
          </div>

          {/* Pending Revenue */}
          <div className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-16 h-16 text-amber-300" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-8 w-8 text-amber-300" />
                <span className="text-xs text-slate-400">Pending</span>
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Pending Revenue</h3>
              <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                {formatCurrency(revenueData.pendingRevenue)}
              </p>
              <p className="text-sm text-slate-400">Awaiting payment</p>
            </div>
          </div>

          {/* Pipeline Value */}
          <div className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 className="w-16 h-16 text-blue-300" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8 text-blue-300" />
                <span className="text-xs text-slate-400">Potential</span>
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Pipeline Value</h3>
              <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                {formatCurrency(revenueData.pipelineValue)}
              </p>
              <p className="text-sm text-slate-400">{revenueData.pipelineLeads} hot/warm leads</p>
            </div>
          </div>
        </div>

        {/* Breakdown Section - Design System Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-300" />
                Revenue Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-300" />
                    <span className="text-slate-300">Commissions</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(revenueData.breakdown.commissions)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-300" />
                    <span className="text-slate-300">Pending</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(revenueData.breakdown.pendingCommissions)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-300" />
                    <span className="text-slate-300">Property Sales</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(revenueData.breakdown.propertySales)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-300" />
                    <span className="text-slate-300">Affiliate</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(revenueData.breakdown.affiliateCommissions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-300" />
                Key Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Total Deals</span>
                  <span className="font-semibold text-white">{revenueData.stats.totalDeals}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Pending Deals</span>
                  <span className="font-semibold text-white">{revenueData.stats.pendingDeals}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Avg Deal Size</span>
                  <span className="font-semibold text-white">{formatCurrency(revenueData.stats.avgDealSize)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Avg Commission</span>
                  <span className="font-semibold text-white">{formatCurrency(revenueData.stats.avgCommission)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Commission Rate</span>
                  <span className="font-semibold text-white">{revenueData.commissionRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions - Design System Container */}
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-300" />
              Recent Transactions
            </h3>
            {revenueData.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {revenueData.recentTransactions.map((transaction, index) => (
                  <div
                    key={`${transaction.id}-${index}`}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Commission Payment</p>
                        <p className="text-sm text-slate-400">
                          Deal: {formatCurrency(transaction.dealValue)} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-lg">{formatCurrency(transaction.amount)}</p>
                      <p className={`text-xs ${
                        transaction.status === 'completed' ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-slate-500" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">No transactions yet</h4>
                <p className="text-slate-400">Revenue will appear here once deals are closed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}

