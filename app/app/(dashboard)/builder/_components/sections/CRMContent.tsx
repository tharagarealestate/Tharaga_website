"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Link2, RefreshCw, CheckCircle2, AlertCircle, XCircle,
  Settings, Activity, Database, TrendingUp
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { CRMSyncStatus } from '../../leads/_components/CRMSyncStatus'
import { CRMDashboard } from './CRMDashboard'

/**
 * CRM Content Component
 * Displays all CRM-related features and integrations inline
 * No redirects - all functionality works within the page
 * Shows full-page CRM dashboard when connected
 */
export function CRMContent() {
  const [crmStatus, setCrmStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  // Fetch CRM status on mount
  useEffect(() => {
    const fetchCRMStatus = async () => {
      setLoading(true)
      try {
        // Get auth token
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const response = await fetch('/api/crm/zoho/status', {
          credentials: 'include',
          headers
        })
        if (response.ok) {
          const data = await response.json()
          // Handle both old format (data.success && data.data) and new format (data directly)
          if (data.success !== false) {
            setCrmStatus(data.data || data)
          } else {
            setCrmStatus(null)
          }
        } else {
          setCrmStatus(null)
        }
      } catch (error) {
        console.error('Failed to fetch CRM status:', error)
        setCrmStatus(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCRMStatus()

    // Listen for sync complete events
    const handleSyncComplete = () => {
      fetchCRMStatus()
    }
    window.addEventListener('crm-sync-complete', handleSyncComplete)

    return () => {
      window.removeEventListener('crm-sync-complete', handleSyncComplete)
    }
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Get auth token
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/crm/zoho/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sync_type: 'leads' }),
        credentials: 'include',
      })
      if (response.ok) {
        window.dispatchEvent(new CustomEvent('crm-sync-complete'))
        // Refetch status after a delay
        setTimeout(() => {
          // Get auth token
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        fetch('/api/crm/zoho/status', { credentials: 'include', headers })
            .then(res => res.json())
            .then(data => {
              setCrmStatus(data.success ? data.data : null)
            })
            .catch(console.error)
        }, 1000)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleConnect = async () => {
    // CRITICAL FIX: Show full CRM dashboard for connection flow
    setShowDashboard(true)
  }

  // Show full CRM dashboard if connected or if user clicked to view dashboard
  if (showDashboard) {
    return <CRMDashboard onClose={() => setShowDashboard(false)} embedded={true} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
          <Link2 className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">CRM Integration</h2>
          <p className="text-sm text-slate-400">Manage your CRM connections and sync settings</p>
        </div>
        {crmStatus?.connected && (
          <button
            onClick={() => setShowDashboard(true)}
            className="ml-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            View Dashboard
          </button>
        )}
      </div>

      {/* CRM Status */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : (
        <div>
          {crmStatus ? (
            <CRMSyncStatus status={crmStatus} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">ZOHO CRM Not Connected</h3>
                    <p className="text-xs text-slate-400">Connect ZOHO CRM to automatically sync leads and deals</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDashboard(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Connect Now
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* CRM Features Grid */}
      {crmStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sync Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 glow-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Sync Statistics</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Total Syncs:</span>
                <span className="font-semibold text-white">
                  {crmStatus.statistics?.total_syncs || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Successful:</span>
                <span className="font-semibold text-green-400">
                  {crmStatus.statistics?.successful_syncs || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-semibold text-red-400">
                  {crmStatus.statistics?.failed_syncs || 0}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Data Mapping */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 glow-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Data Mapping</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Leads Synced:</span>
                <span className="font-semibold text-white">Auto</span>
              </div>
              <div className="flex justify-between">
                <span>Deals Synced:</span>
                <span className="font-semibold text-white">Auto</span>
              </div>
              <div className="flex justify-between">
                <span>Contacts Synced:</span>
                <span className="font-semibold text-white">Auto</span>
              </div>
            </div>
          </motion.div>

          {/* Sync Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 glow-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Sync Settings</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Auto Sync:</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync Frequency:</span>
                <span className="font-semibold text-white">Real-time</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Region:</span>
                <span className="font-semibold text-white">India</span>
              </div>
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 glow-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Performance</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Health Status:</span>
                <span className={`font-semibold ${
                  crmStatus.health === 'excellent' ? 'text-green-400' :
                  crmStatus.health === 'good' ? 'text-blue-400' :
                  crmStatus.health === 'fair' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {crmStatus.health?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-semibold text-white">
                  {crmStatus.sync?.success_rate || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync:</span>
                <span className="font-semibold text-white">
                  {crmStatus.sync?.last_sync ? new Date(crmStatus.sync.last_sync).toLocaleString('en-IN') : 'Never'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick Actions */}
      {crmStatus && (
        <div className="pt-4 border-t glow-border">
          <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => setShowDashboard(true)}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 text-white rounded-lg text-sm font-semibold transition-all"
            >
              View Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
