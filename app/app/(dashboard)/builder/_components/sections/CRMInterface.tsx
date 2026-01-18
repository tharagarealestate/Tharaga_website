"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Link2, RefreshCw, CheckCircle2, AlertCircle, XCircle, 
  X, Settings, Activity, Database, TrendingUp 
} from 'lucide-react'
import { CRMSyncStatus } from '../../leads/_components/CRMSyncStatus'

interface CRMInterfaceProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Advanced CRM Interface
 * Displays all CRM-related features and integrations
 * Connects to India-based CRM systems seamlessly
 */
export function CRMInterface({ isOpen, onClose }: CRMInterfaceProps) {
  const [crmStatus, setCrmStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Fetch CRM status on mount and when opened
  useEffect(() => {
    if (!isOpen) return

    const fetchCRMStatus = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/crm/zoho/status')
        if (response.ok) {
          const data = await response.json()
          setCrmStatus(data.success ? data.data : null)
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
  }, [isOpen])

  const handleConnect = async () => {
    try {
      // Redirect to Zoho connection page
      window.location.href = '/builder/settings/zoho'
    } catch (error) {
      console.error('Failed to connect CRM:', error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Slide-in Panel from Right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border border-l shadow-2xl z-[9999] overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b glow-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <Link2 className="w-5 h-5 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">CRM Integration</h2>
                    <p className="text-sm text-slate-400">Manage your CRM connections and sync settings</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
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
                          onClick={handleConnect}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sync Statistics */}
                {crmStatus && (
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
                )}

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
                {crmStatus && (
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
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t glow-border">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {crmStatus ? (
                    <>
                      <button
                        onClick={() => {
                          setSyncing(true)
                          fetch('/api/crm/zoho/sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sync_type: 'leads' }),
                          })
                            .then(() => {
                              window.dispatchEvent(new CustomEvent('crm-sync-complete'))
                              setTimeout(() => setSyncing(false), 2000)
                            })
                            .catch(() => setSyncing(false))
                        }}
                        disabled={syncing}
                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <a
                        href="/builder/settings/zoho"
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        Manage Settings
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={handleConnect}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Connect ZOHO CRM
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
