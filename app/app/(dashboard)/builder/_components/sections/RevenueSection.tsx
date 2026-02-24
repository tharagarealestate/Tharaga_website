"use client"

import { motion } from 'framer-motion'
import {
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Download, IndianRupee, Clock,
  CreditCard, Target, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR } from '../hooks/useBuilderData'

interface RevenueSectionProps {
  onNavigate?: (section: string) => void
}

interface RevenueData {
  success: boolean
  data: {
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
    recentTransactions: {
      id: string
      type: string
      amount: number
      dealValue: number
      date: string
      status: string
    }[]
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
}

export function RevenueSection({ onNavigate }: RevenueSectionProps) {
  const { isAdmin } = useBuilderDataContext()

  const { data: revenueResponse, isLoading } = useRealtimeData<RevenueData>(
    '/api/builder/revenue',
    { refreshInterval: 30000 }
  )

  const revenue = revenueResponse?.data
  const totalRevenue = revenue?.totalRevenue || 0
  const pendingRevenue = revenue?.pendingRevenue || 0
  const monthlyGrowth = revenue?.monthlyGrowth || 0
  const pipelineValue = revenue?.pipelineValue || 0
  const transactions = revenue?.recentTransactions || []
  const stats = revenue?.stats
  const timeline = revenue?.timeline

  const statusColors: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    processing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 animate-pulse">
              <div className="h-4 w-20 bg-zinc-800 rounded mb-3" />
              <div className="h-8 w-16 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100">Revenue</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">Financial overview and transactions</p>
        </div>
        <button className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatINR(totalRevenue), change: monthlyGrowth, icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Pending', value: formatINR(pendingRevenue), change: 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Avg Deal', value: stats?.avgDealSize ? formatINR(stats.avgDealSize) : '—', change: 0, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Pipeline', value: formatINR(pipelineValue), change: 0, icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((metric, i) => {
          const Icon = metric.icon
          return (
            <motion.div key={metric.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{metric.label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', metric.bg)}>
                  <Icon className={cn('w-4 h-4', metric.color)} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-zinc-100">{metric.value}</span>
                {metric.change !== 0 && (
                  <span className={cn('flex items-center gap-0.5 text-xs font-medium mb-0.5', metric.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {metric.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-base font-semibold text-zinc-100 mb-5">Revenue Breakdown</h2>
          {revenue?.breakdown ? (
            <div className="space-y-4">
              {[
                { label: 'Commissions', value: revenue.breakdown.commissions, color: 'bg-emerald-500' },
                { label: 'Pending Commissions', value: revenue.breakdown.pendingCommissions, color: 'bg-amber-500' },
                { label: 'Property Sales', value: revenue.breakdown.propertySales, color: 'bg-blue-500' },
                { label: 'Affiliate', value: revenue.breakdown.affiliateCommissions, color: 'bg-purple-500' },
              ].filter(i => i.value > 0).map(item => {
                const max = Math.max(revenue!.breakdown.commissions, revenue!.breakdown.propertySales, 1)
                return (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-zinc-300">{item.label}</span>
                      <span className="text-sm font-medium text-zinc-200">{formatINR(item.value)}</span>
                    </div>
                    <div className="h-2.5 bg-zinc-800/50 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / max) * 100}%` }}
                        transition={{ duration: 0.6 }} className={cn('h-full rounded-full', item.color)} />
                    </div>
                  </div>
                )
              })}
              {timeline && (
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-800/50">
                  <div><p className="text-[11px] text-zinc-500 mb-1">This Month</p><p className="text-lg font-bold text-zinc-100">{formatINR(timeline.thisMonth)}</p></div>
                  <div><p className="text-[11px] text-zinc-500 mb-1">Last Month</p><p className="text-lg font-bold text-zinc-100">{formatINR(timeline.lastMonth)}</p></div>
                  <div><p className="text-[11px] text-zinc-500 mb-1">This Year</p><p className="text-lg font-bold text-zinc-100">{formatINR(timeline.thisYear)}</p></div>
                </div>
              )}
              {stats && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800/50">
                  <div className="bg-zinc-800/30 rounded-lg p-3"><p className="text-[11px] text-zinc-500">Total Deals</p><p className="text-lg font-bold text-zinc-200">{stats.totalDeals}</p></div>
                  <div className="bg-zinc-800/30 rounded-lg p-3"><p className="text-[11px] text-zinc-500">Pending</p><p className="text-lg font-bold text-amber-400">{stats.pendingDeals}</p></div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-zinc-600">No revenue data yet. Available for Pro/Enterprise plans.</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-base font-semibold text-zinc-100 mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-600">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const status = statusColors[tx.status] || statusColors.pending
                return (
                  <div key={tx.id} className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-200 capitalize">{tx.type}</p>
                      <p className="text-xs text-zinc-500">{new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-zinc-200">{formatINR(tx.amount)}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', status.bg, status.text)}>{tx.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
