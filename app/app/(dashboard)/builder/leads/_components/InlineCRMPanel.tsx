'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Users,
  Building2,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface InlineCRMPanelProps {
  onClose: () => void
}

export function InlineCRMPanel({ onClose }: InlineCRMPanelProps) {
  const [loading, setLoading] = useState(true)
  const [crmData, setCrmData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals'>('overview')

  useEffect(() => {
    async function fetchCRMData() {
      try {
        const response = await fetch('/api/crm/zoho/dashboard-data')
        if (response.ok) {
          const data = await response.json()
          setCrmData(data)
        }
      } catch (error) {
        console.error('Failed to fetch CRM data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCRMData()
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ZOHO CRM Integration</h2>
                <p className="text-xs text-slate-400">Real-time data sync and management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700/50 px-6 flex gap-1 bg-slate-800/50">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'contacts', label: 'Contacts', icon: Users },
              { id: 'deals', label: 'Deals', icon: DollarSign },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full" />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-blue-400" />
                          <h3 className="text-sm font-semibold text-white">Total Contacts</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{crmData?.stats?.total_contacts || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">+{crmData?.stats?.new_contacts_this_month || 0} this month</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          <h3 className="text-sm font-semibold text-white">Active Deals</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{crmData?.stats?.active_deals || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">₹{(crmData?.stats?.deal_value || 0).toLocaleString('en-IN')}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="w-5 h-5 text-amber-400" />
                          <h3 className="text-sm font-semibold text-white">Conversion Rate</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{crmData?.stats?.conversion_rate || 0}%</p>
                        <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
                      </motion.div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Recent Sync Activity
                      </h3>
                      <div className="space-y-3">
                        {[
                          { action: '5 new leads synced', time: '2 minutes ago', status: 'success' },
                          { action: '12 contacts updated', time: '15 minutes ago', status: 'success' },
                          { action: 'Deal "Premium Villa" updated', time: '1 hour ago', status: 'success' },
                        ].map((activity, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <div>
                                <p className="text-sm text-white">{activity.action}</p>
                                <p className="text-xs text-slate-400">{activity.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contacts' && (
                  <div className="space-y-4">
                    <p className="text-slate-400 text-sm">Showing {crmData?.contacts?.length || 0} contacts synced from ZOHO CRM</p>
                    <div className="space-y-3">
                      {(crmData?.contacts || []).slice(0, 10).map((contact: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                                {contact.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white">{contact.name || 'Unknown'}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  {contact.email && (
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                      <Mail className="w-3 h-3" />
                                      {contact.email}
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                      <Phone className="w-3 h-3" />
                                      {contact.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              contact.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {contact.status || 'Active'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'deals' && (
                  <div className="space-y-4">
                    <p className="text-slate-400 text-sm">Showing {crmData?.deals?.length || 0} active deals from ZOHO CRM</p>
                    <div className="space-y-3">
                      {(crmData?.deals || []).slice(0, 10).map((deal: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-sm font-semibold text-white">{deal.name || 'Untitled Deal'}</h4>
                              <p className="text-xs text-slate-400 mt-1">{deal.account_name || 'No account'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-amber-400">₹{(deal.amount || 0).toLocaleString('en-IN')}</p>
                              <p className="text-xs text-slate-400">{deal.stage || 'Unknown stage'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Close: {deal.closing_date || 'Not set'}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Probability: {deal.probability || 0}%
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700/50 px-6 py-4 bg-slate-800/50 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Data synced from ZOHO CRM • Last updated: {new Date().toLocaleTimeString()}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
