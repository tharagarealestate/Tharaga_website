"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, Mail, MessageSquare, Share2,
  Plus, Eye, Users,
  Sparkles, Send, TrendingUp,
  FileText, Globe, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR } from '../hooks/useBuilderData'

interface MarketingProps {
  onNavigate?: (section: string) => void
}

type TabId = 'campaigns' | 'content' | 'social' | 'email'

export function MarketingSection({ onNavigate }: MarketingProps) {
  const { isAdmin } = useBuilderDataContext()
  const [activeTab, setActiveTab] = useState<TabId>('campaigns')

  // Fetch lead analytics for marketing insights (real data)
  const { data: analyticsData } = useRealtimeData<{
    success: boolean
    leads_by_source: { source: string; count: number; percentage: number }[]
    total_value: number
    conversion_rate: number
  }>('/api/leads/analytics', { refreshInterval: 30000 })

  // Fetch lead counts for marketing KPIs
  const { data: leadCountData } = useRealtimeData<{
    success: boolean
    data: { total: number; hot: number; warm: number }
  }>('/api/leads/count', { refreshInterval: 30000 })

  const leadSources = analyticsData?.leads_by_source || []
  const totalLeads = leadCountData?.data?.total || 0
  const hotLeads = leadCountData?.data?.hot || 0
  const conversionRate = analyticsData?.conversion_rate || 0

  // Derive marketing metrics from real lead data
  const topSource = leadSources.length > 0 ? leadSources[0] : null
  const totalFromMarketing = leadSources.reduce((sum, s) => sum + s.count, 0)

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'content', label: 'AI Content', icon: Sparkles },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'social', label: 'Social', icon: Share2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100">Marketing Hub</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">Manage campaigns, content, and outreach</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Real KPIs from lead data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: totalLeads.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Hot Leads', value: hotLeads.toString(), icon: Send, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Top Source', value: topSource ? `${topSource.source}` : '—', icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Conversion', value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stat.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', stat.color)} />
                </div>
              </div>
              <span className="text-2xl font-bold text-zinc-100">{stat.value}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Campaigns Tab - Real lead source breakdown */}
      {activeTab === 'campaigns' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">Lead Source Performance</h2>
            {leadSources.length === 0 ? (
              <div className="text-center py-8 text-sm text-zinc-600">No lead sources tracked yet</div>
            ) : (
              <div className="space-y-3">
                {leadSources.map((source, idx) => {
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500', 'bg-pink-500']
                  return (
                    <div key={source.source} className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-3 h-3 rounded-full', colors[idx % colors.length])} />
                          <span className="text-sm font-medium text-zinc-200 capitalize">{source.source || 'Unknown'}</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-100">{source.count} leads</span>
                      </div>
                      <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${source.percentage}%` }}
                          transition={{ duration: 0.6 }}
                          className={cn('h-full rounded-full', colors[idx % colors.length])} />
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">{source.percentage.toFixed(1)}% of total leads</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* AI Content Tab */}
      {activeTab === 'content' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">AI Content Generator</h3>
                <p className="text-sm text-zinc-400 mb-3">Generate property descriptions, market reports, and social posts instantly.</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-purple-500/15 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors">
                    Property Description
                  </button>
                  <button className="px-3 py-1.5 bg-purple-500/15 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors">
                    Market Report
                  </button>
                  <button className="px-3 py-1.5 bg-purple-500/15 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors">
                    Social Post
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 text-center">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-200 mb-1">Content Templates</h3>
            <p className="text-sm text-zinc-500 mb-4">AI-powered templates will be auto-generated based on your property listings.</p>
          </div>
        </motion.div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 text-center">
            <Mail className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-200 mb-1">Email Campaigns</h3>
            <p className="text-sm text-zinc-500 mb-4">Send targeted email campaigns to your {totalLeads} leads.</p>
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors">
              Create Email Campaign
            </button>
          </div>
        </motion.div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 text-center">
            <Globe className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-200 mb-1">Social Media Management</h3>
            <p className="text-sm text-zinc-500 mb-4">Schedule and publish property listings across social platforms.</p>
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors">
              Connect Social Accounts
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
