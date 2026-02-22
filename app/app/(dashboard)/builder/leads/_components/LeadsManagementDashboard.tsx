'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Clock, 
  Zap, 
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react'
import { LeadsList } from './LeadsList'
import { AIInsightsPanel } from './AIInsightsPanel'
import { CRMSyncStatus } from './CRMSyncStatus'
import { LeadsAnalytics } from './LeadsAnalytics'
import { RealTimeNotifications } from './RealTimeNotifications'
import { getSupabase } from '@/lib/supabase'

interface DashboardStats {
  total_leads: number
  hot_leads: number
  warm_leads: number
  pending_interactions: number
  average_score: number
  conversion_rate: number
  ai_recommendations: number
}

export function LeadsManagementDashboard() {
  const supabase = useMemo(() => getSupabase(), [])
  const [activeTab, setActiveTab] = useState<'leads' | 'analytics' | 'insights'>('leads')
  const [crmStatus, setCrmStatus] = useState<any>(null)
  const [crmLoading, setCrmLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    total_leads: 0,
    hot_leads: 0,
    warm_leads: 0,
    pending_interactions: 0,
    average_score: 0,
    conversion_rate: 0,
    ai_recommendations: 0,
  })

  // Fetch ZOHO CRM status
  useEffect(() => {
    let isMounted = true

    async function fetchCRMStatus() {
      try {
        const response = await fetch('/api/crm/zoho/status')
        if (response.ok && isMounted) {
          const data = await response.json()
          setCrmStatus(data)
        }
      } catch (error) {
        console.error('Failed to fetch CRM status:', error)
      } finally {
        if (isMounted) {
          setCrmLoading(false)
        }
      }
    }

    fetchCRMStatus()
    // Refresh every 30 seconds (increased from frequent polling)
    const interval = setInterval(() => {
      if (isMounted) {
        fetchCRMStatus()
      }
    }, 30000)

    // Listen for CRM sync completion events
    const handleSyncComplete = () => {
      if (isMounted) {
        fetchCRMStatus()
      }
    }
    window.addEventListener('crm-sync-complete', handleSyncComplete)

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener('crm-sync-complete', handleSyncComplete)
    }
  }, [])

  // Wrap in useCallback to ensure stable reference (prevents LeadsList re-renders)
  const handleStatsUpdate = useCallback((newStats: any) => {
    setStats({
      total_leads: newStats.total_leads || 0,
      hot_leads: newStats.hot_leads || 0,
      warm_leads: newStats.warm_leads || 0,
      pending_interactions: newStats.pending_interactions || 0,
      average_score: newStats.average_score || 0,
      conversion_rate: 0, // Calculate from analytics
      ai_recommendations: 0, // Calculate from insights
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="flex justify-end">
        <RealTimeNotifications />
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Leads</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.total_leads}</div>
          <div className="text-sm text-slate-400">
            {stats.hot_leads} hot • {stats.warm_leads} warm
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Avg Score</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.average_score.toFixed(1)}
          </div>
          <div className="text-sm text-slate-400">Out of 10.0</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Pending Actions</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.pending_interactions}</div>
          <div className="text-sm text-slate-400">Requires attention</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">AI Insights</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.ai_recommendations}</div>
          <div className="text-sm text-slate-400">Active recommendations</div>
        </motion.div>
      </div>

      {/* CRM Sync Status Bar */}
      {!crmLoading && (
        <CRMSyncStatus status={crmStatus} />
      )}

      {/* Tab Navigation */}
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-2 shadow-2xl">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'leads'
                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              <span>All Leads</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'insights'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>AI Insights</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'leads' && (
          <LeadsList 
            showInlineFilters={true} 
            onStatsUpdate={handleStatsUpdate}
          />
        )}
        {activeTab === 'analytics' && (
          <LeadsAnalytics />
        )}
        {activeTab === 'insights' && (
          <AIInsightsPanel />
        )}
      </motion.div>
    </div>
  )
}

