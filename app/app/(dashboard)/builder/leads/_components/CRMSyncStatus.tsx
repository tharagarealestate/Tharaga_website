'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, RefreshCw, Link2, XCircle } from 'lucide-react'
import { useState } from 'react'

interface CRMSyncStatusProps {
  status: {
    connected?: boolean
    active?: boolean
    health?: string
    account?: {
      id?: string
      name?: string
    }
    sync?: {
      last_sync?: string
      success_rate?: number
      recent_syncs?: number
    }
    statistics?: {
      total_syncs?: number
      successful_syncs?: number
      failed_syncs?: number
    }
  } | null
}

export function CRMSyncStatus({ status }: CRMSyncStatusProps) {
  const [syncing, setSyncing] = useState(false)

  if (!status || !status.connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4"
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
          <a
            href="/builder/settings/zoho"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Connect Now
          </a>
        </div>
      </motion.div>
    )
  }

  const healthColors = {
    excellent: 'from-green-500/20 to-emerald-500/20 border-green-500/50',
    good: 'from-blue-500/20 to-cyan-500/20 border-blue-500/50',
    fair: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50',
    poor: 'from-red-500/20 to-rose-500/20 border-red-500/50',
  }

  const healthIcons = {
    excellent: CheckCircle2,
    good: CheckCircle2,
    fair: AlertCircle,
    poor: XCircle,
  }

  const HealthIcon = healthIcons[status.health as keyof typeof healthIcons] || CheckCircle2
  const healthColor = healthColors[status.health as keyof typeof healthColors] || healthColors.good

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/crm/zoho/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_type: 'leads' }),
      })
      if (response.ok) {
        // Refresh status after sync
        window.location.reload()
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${healthColor} border rounded-xl p-4 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${healthColor} flex items-center justify-center`}>
            <HealthIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-white">ZOHO CRM Connected</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                status.health === 'excellent' ? 'bg-green-500/30 text-green-200' :
                status.health === 'good' ? 'bg-blue-500/30 text-blue-200' :
                status.health === 'fair' ? 'bg-yellow-500/30 text-yellow-200' :
                'bg-red-500/30 text-red-200'
              }`}>
                {status.health?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span>{status.account?.name || 'ZOHO Account'}</span>
              <span>•</span>
              <span>Last sync: {formatLastSync(status.sync?.last_sync)}</span>
              <span>•</span>
              <span>Success rate: {status.sync?.success_rate || 0}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <a
            href="/builder/settings/zoho"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-semibold transition-all"
          >
            Manage
          </a>
        </div>
      </div>
    </motion.div>
  )
}

