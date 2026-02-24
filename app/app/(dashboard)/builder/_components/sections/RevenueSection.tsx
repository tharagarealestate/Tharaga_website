"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
  Calendar, Download, IndianRupee, BarChart3, Clock,
  CreditCard, Users, Building2, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueSectionProps {
  onNavigate?: (section: string) => void
}

export function RevenueSection({ onNavigate }: RevenueSectionProps) {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m'>('30d')

  const revenueMetrics = [
    { label: 'Total Revenue', value: '₹24.5L', change: 15.3, icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending Payments', value: '₹8.2L', change: -5.1, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Avg Deal Size', value: '₹42L', change: 8.7, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Deals', value: '14', change: 3, icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  const recentTransactions = [
    { id: '1', property: 'Villa Park - Plot #12', client: 'Rajesh Kumar', amount: '₹52L', status: 'completed', date: '2024-02-20' },
    { id: '2', property: 'Green Valley - Villa A3', client: 'Priya Sharma', amount: '₹38L', status: 'pending', date: '2024-02-18' },
    { id: '3', property: 'Lake View - Plot #7', client: 'Arun Patel', amount: '₹28L', status: 'completed', date: '2024-02-15' },
    { id: '4', property: 'Sunrise Homes - Unit B5', client: 'Meena R.', amount: '₹45L', status: 'processing', date: '2024-02-12' },
  ]

  const monthlyRevenue = [
    { month: 'Sep', value: 18 },
    { month: 'Oct', value: 22 },
    { month: 'Nov', value: 15 },
    { month: 'Dec', value: 28 },
    { month: 'Jan', value: 20 },
    { month: 'Feb', value: 24.5 },
  ]

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value))

  const statusColors: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    processing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Revenue</h1>
          <p className="text-sm text-zinc-500 mt-1">Financial overview and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {(['30d', '90d', '12m'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  timeRange === range ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueMetrics.map((metric, i) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{metric.label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', metric.bg)}>
                  <Icon className={cn('w-4 h-4', metric.color)} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-zinc-100">{metric.value}</span>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-medium mb-0.5',
                  metric.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {metric.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(metric.change)}%
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Chart + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
        >
          <h2 className="text-base font-semibold text-zinc-100 mb-5">Monthly Revenue</h2>
          <div className="flex items-end gap-4 h-48">
            {monthlyRevenue.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.value / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="w-8 bg-gradient-to-t from-amber-500/60 to-amber-400/40 rounded-t-md"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-zinc-300 font-medium block">₹{m.value}L</span>
                  <span className="text-[11px] text-zinc-500">{m.month}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
        >
          <h2 className="text-base font-semibold text-zinc-100 mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTransactions.map((tx) => {
              const status = statusColors[tx.status] || statusColors.pending
              return (
                <div key={tx.id} className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200 truncate">{tx.property}</p>
                    <p className="text-xs text-zinc-500">{tx.client}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold text-zinc-200">{tx.amount}</p>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', status.bg, status.text)}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

