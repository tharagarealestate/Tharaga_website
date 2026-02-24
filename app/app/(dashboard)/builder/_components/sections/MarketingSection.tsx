"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, Mail, MessageSquare, Share2,
  Plus, BarChart3, Eye, Users,
  Sparkles, Send, Calendar, TrendingUp,
  FileText, Globe, Target, Zap,
  ChevronRight, ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketingProps {
  onNavigate?: (section: string) => void
}

type TabId = 'campaigns' | 'content' | 'social' | 'email'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'whatsapp' | 'social'
  status: 'active' | 'draft' | 'completed' | 'scheduled'
  sent: number
  opened: number
  clicked: number
  converted: number
  date: string
}

interface ContentTemplate {
  id: string
  title: string
  type: 'property-listing' | 'market-update' | 'testimonial' | 'offer'
  aiGenerated: boolean
  lastUsed: string
}

export function MarketingSection({ onNavigate }: MarketingProps) {
  const [activeTab, setActiveTab] = useState<TabId>('campaigns')

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'content', label: 'AI Content', icon: Sparkles },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'social', label: 'Social', icon: Share2 },
  ]

  const campaigns: Campaign[] = [
    { id: '1', name: 'Villa Park Launch', type: 'email', status: 'active', sent: 1250, opened: 780, clicked: 234, converted: 12, date: '2024-02-15' },
    { id: '2', name: 'Diwali Offer - 10% Off', type: 'whatsapp', status: 'completed', sent: 3200, opened: 2800, clicked: 890, converted: 45, date: '2024-01-20' },
    { id: '3', name: 'Monthly Market Update', type: 'email', status: 'scheduled', sent: 0, opened: 0, clicked: 0, converted: 0, date: '2024-03-01' },
    { id: '4', name: 'Site Visit Reminder', type: 'sms', status: 'draft', sent: 0, opened: 0, clicked: 0, converted: 0, date: '' },
  ]

  const contentTemplates: ContentTemplate[] = [
    { id: '1', title: 'Premium Villa Showcase', type: 'property-listing', aiGenerated: true, lastUsed: '2 days ago' },
    { id: '2', title: 'Tamil Nadu Market Trends Q1', type: 'market-update', aiGenerated: true, lastUsed: '1 week ago' },
    { id: '3', title: 'Customer Success Story', type: 'testimonial', aiGenerated: false, lastUsed: '3 days ago' },
    { id: '4', title: 'Festival Special Offer', type: 'offer', aiGenerated: true, lastUsed: 'Never' },
  ]

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    draft: { bg: 'bg-zinc-800', text: 'text-zinc-400', dot: 'bg-zinc-500' },
    completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
    scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
  }

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    email: Mail,
    sms: MessageSquare,
    whatsapp: MessageSquare,
    social: Share2,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Marketing Hub</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage campaigns, content, and outreach</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: '3', icon: Megaphone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Emails Sent', value: '4.5K', icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Open Rate', value: '62%', icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Leads Generated', value: '57', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stat.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', stat.color)} />
                </div>
              </div>
              <span className="text-2xl font-bold text-zinc-100 tabular-nums">{stat.value}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {campaigns.map((campaign) => {
            const status = statusColors[campaign.status]
            const TypeIcon = typeIcons[campaign.type] || Mail
            return (
              <div
                key={campaign.id}
                className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                      <TypeIcon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-zinc-200">{campaign.name}</h3>
                      <p className="text-xs text-zinc-500 capitalize">{campaign.type} campaign</p>
                    </div>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full',
                    status.bg, status.text
                  )}>
                    <div className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                    {campaign.status}
                  </span>
                </div>
                {campaign.status !== 'draft' && (
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] text-zinc-500">Sent</p>
                      <p className="text-sm font-medium text-zinc-300 tabular-nums">{campaign.sent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">Opened</p>
                      <p className="text-sm font-medium text-zinc-300 tabular-nums">{campaign.opened.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">Clicked</p>
                      <p className="text-sm font-medium text-zinc-300 tabular-nums">{campaign.clicked.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">Converted</p>
                      <p className="text-sm font-medium text-emerald-400 tabular-nums">{campaign.converted}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>
      )}

      {/* AI Content Tab */}
      {activeTab === 'content' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* AI Content Generator */}
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

          {/* Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contentTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700/60 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    <h4 className="text-sm font-medium text-zinc-200">{template.title}</h4>
                  </div>
                  {template.aiGenerated && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded-full font-bold uppercase">AI</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 capitalize mb-2">{template.type.replace(/-/g, ' ')}</p>
                <p className="text-[11px] text-zinc-600">Last used: {template.lastUsed}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 text-center">
            <Mail className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-200 mb-1">Email Campaigns</h3>
            <p className="text-sm text-zinc-500 mb-4">Send targeted email campaigns to your leads and clients.</p>
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
