"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Building2, Phone, Mail, Calendar, TrendingUp, Activity,
  CheckCircle2, Clock, DollarSign, X, MapPin, Home, IndianRupee
} from 'lucide-react'

interface CRMDashboardProps {
  onClose?: () => void
  embedded?: boolean
}

/**
 * CRM Dashboard Component - Full Page View
 * Displays real Zoho CRM data with tabs: Overview | Contacts | Deals
 * No modal - integrates with main layout
 */
export function CRMDashboard({ onClose, embedded = false }: CRMDashboardProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    )
  }

  if (!crmData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load CRM Data</h3>
        <p className="text-sm text-slate-400">Please check your connection and try again</p>
      </div>
    )
  }

  const isConnected = crmData.connected && !crmData.mock
  const stats = crmData.stats || {}
  const contacts = crmData.contacts || []
  const deals = crmData.deals || []

  return (
    <div className="w-full h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Zoho CRM Dashboard</h2>
            <p className="text-sm text-slate-400">
              {isConnected ? 'Connected & Synced' : 'Not Connected - Showing Sample Data'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 px-6 py-4 border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-900'
              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'contacts'
              ? 'bg-amber-500 text-slate-900'
              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('deals')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'deals'
              ? 'bg-amber-500 text-slate-900'
              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Deals ({deals.length})
        </button>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-400">Total Contacts</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.total_contacts || 0}</div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-slate-400">New This Month</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.new_contacts_this_month || 0}</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-slate-400">Active Deals</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.active_deals || 0}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <IndianRupee className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-slate-400">Deal Value</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ₹{((stats.deal_value || 0) / 100000).toFixed(1)}L
                  </div>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Conversion Rate</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-amber-400">{stats.conversion_rate || 0}%</div>
                  <div className="text-sm text-slate-400">
                    Deals successfully closed from total opportunities
                  </div>
                </div>
              </div>

              {!isConnected && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-sm text-amber-300">
                    <strong>Note:</strong> This is sample data. Connect your Zoho CRM account to see real data.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No contacts found</p>
                </div>
              ) : (
                contacts.map((contact: any) => (
                  <div
                    key={contact.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold">
                          {contact.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{contact.name}</h4>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{contact.email}</span>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.preferred_location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{contact.preferred_location}</span>
                              </div>
                            )}
                          </div>
                          {(contact.budget_min || contact.property_type) && (
                            <div className="flex gap-2 mt-2">
                              {contact.budget_min && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                  Budget: ₹{(contact.budget_min / 100000).toFixed(1)}L - ₹{((contact.budget_max || contact.budget_min) / 100000).toFixed(1)}L
                                </span>
                              )}
                              {contact.property_type && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                  {contact.property_type}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {contact.lead_score && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-400">{contact.lead_score}</div>
                          <div className="text-xs text-slate-400">Score</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'deals' && (
            <motion.div
              key="deals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {deals.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No deals found</p>
                </div>
              ) : (
                deals.map((deal: any) => (
                  <div
                    key={deal.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{deal.name}</h4>
                        <p className="text-sm text-slate-400 mt-1">{deal.account_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-amber-400">
                          ₹{((deal.amount || 0) / 100000).toFixed(1)}L
                        </div>
                        <div className="text-xs text-slate-400">Deal Value</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Stage</div>
                        <div className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold text-center">
                          {deal.stage}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Probability</div>
                        <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold text-center">
                          {deal.probability}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Closing Date</div>
                        <div className="flex items-center gap-1 text-xs text-white">
                          <Calendar className="w-3 h-3" />
                          {new Date(deal.closing_date).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {(deal.property_name || deal.property_location) && (
                      <div className="flex gap-2 text-xs text-slate-400">
                        {deal.property_name && (
                          <div className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            <span>{deal.property_name}</span>
                          </div>
                        )}
                        {deal.property_location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{deal.property_location}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
