"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { requestDeduplicator } from '@/lib/utils/request-deduplication'
import {
  Users, Building2, Phone, Mail, Calendar, TrendingUp, Activity,
  CheckCircle2, Clock, DollarSign, X, XCircle, MapPin, Home, IndianRupee,
  Link2, RefreshCw, ExternalLink
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
  const [connecting, setConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const isFetchingRef = useRef(false) // OPTIMIZED: Track if fetch is in progress
  const hasInitialFetchRef = useRef(false) // OPTIMIZED: Track if initial fetch completed

  const fetchCRMData = async () => {
    // OPTIMIZED: Prevent duplicate concurrent requests
    if (isFetchingRef.current) {
      console.log('[CRMDashboard] Fetch already in progress, skipping duplicate call');
      return;
    }

    setLoading(true)
    try {
      // OPTIMIZED: Set fetching flag
      isFetchingRef.current = true;

      // CRITICAL: Get auth token - use window.supabase if available
      const supabaseClient = (typeof window !== 'undefined' && (window as any).supabase) || getSupabase()
      let token: string | null = null
      try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
        if (sessionError) {
          console.warn('[CRMDashboard] Session error:', sessionError.message)
        }
        token = session?.access_token || null
      } catch (err: any) {
        console.error('[CRMDashboard] Error getting session:', err.message)
      }
      
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      // OPTIMIZED: Use request deduplication to prevent duplicate API calls
      const response = await requestDeduplicator.deduplicateFetch('/api/crm/zoho/dashboard-data', {
        credentials: 'include',
        headers
      })
      const data = await response.json()

      // Set the CRM data directly - API now returns real state (no mock data)
      if (response.ok) {
        setCrmData(data)
      } else {
        // Set empty data structure with error
        setCrmData({
          connected: false,
          needs_connection: true,
          message: data.error || 'Failed to load CRM data',
          stats: { total_contacts: 0, new_contacts_this_month: 0, active_deals: 0, deal_value: 0, conversion_rate: 0 },
          contacts: [],
          deals: []
        })
      }
    } catch (error) {
      console.error('Failed to fetch CRM data:', error)
      // Set empty data structure on error
      setCrmData({
        connected: false,
        needs_connection: true,
        message: 'Unable to connect to CRM service',
        stats: { total_contacts: 0, new_contacts_this_month: 0, active_deals: 0, deal_value: 0, conversion_rate: 0 },
        contacts: [],
        deals: []
      })
    } finally {
      // OPTIMIZED: Reset fetching flag
      isFetchingRef.current = false;
      setLoading(false)
    }
  }

  // OPTIMIZED: Single initial fetch, prevent duplicate calls
  useEffect(() => {
    if (!hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
      fetchCRMData();
    }
  }, []) // Only run once on mount

  // Handle Connect to Zoho CRM
  const handleConnectZoho = async () => {
    setConnecting(true)
    setConnectionError(null)

    try {
      // CRITICAL: Get auth token - use window.supabase if available
      const supabaseClient = (typeof window !== 'undefined' && (window as any).supabase) || getSupabase()
      let token: string | null = null
      try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
        if (sessionError) {
          console.warn('[CRMDashboard] Connect session error:', sessionError.message)
        }
        token = session?.access_token || null
      } catch (err: any) {
        console.error('[CRMDashboard] Connect error getting session:', err.message)
      }
      
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/crm/zoho/connect', {
        credentials: 'include',
        headers
      })
          const data = await response.json()

      if (data.success && data.auth_url) {
        // OPTIMIZED: Redirect directly to Zoho OAuth (no popup)
        // This provides a smoother experience and avoids popup blockers
        // The callback will redirect back to this page automatically
        window.location.href = data.auth_url
        // Don't set connecting to false - let the redirect happen
        return
      } else if (data.already_connected) {
        setConnectionError('Zoho CRM is already connected!')
        // Refresh data
        await fetchCRMData()
      } else {
        // Enhanced error display with troubleshooting
        let errorMsg = data.error || data.message || 'Failed to initiate connection'
        
        if (data.help) {
          errorMsg += '\n\nConfiguration Required:'
          if (data.help.step1) errorMsg += `\n${data.help.step1}`
          if (data.help.step2) errorMsg += `\n${data.help.step2}`
          if (data.help.step3) errorMsg += `\n${data.help.step3}`
          if (data.help.step4) errorMsg += `\n${data.help.step4}`
          if (data.help.step5) errorMsg += `\n${data.help.step5}`
        }
        
        if (data.troubleshooting) {
          errorMsg += '\n\nTroubleshooting:'
          if (data.troubleshooting.ifInvalidClient) {
            errorMsg += `\n${data.troubleshooting.ifInvalidClient}`
          }
          if (data.troubleshooting.steps) {
            data.troubleshooting.steps.forEach((step: string) => {
              errorMsg += `\n${step}`
            })
          }
        }
        
        setConnectionError(errorMsg)
      }
    } catch (error: any) {
      console.error('Failed to connect Zoho:', error)
      setConnectionError(error.message || 'Failed to connect to Zoho CRM')
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    )
  }

  // Always show dashboard, even with empty data
  if (!crmData) {
    // Fallback to empty structure
    const emptyData = {
      connected: false,
      needs_connection: true,
      stats: { total_contacts: 0, new_contacts_this_month: 0, active_deals: 0, deal_value: 0, conversion_rate: 0 },
      contacts: [],
      deals: []
    }
    setCrmData(emptyData)
    return null // Will re-render with data
  }

  const isConnected = crmData.connected === true
  const needsConnection = crmData.needs_connection || crmData.needs_reconnection || !isConnected
  const stats = crmData.stats || {}
  const contacts = crmData.contacts || []
  const deals = crmData.deals || []
  const statusMessage = crmData.message || ''

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
              {isConnected
                ? (crmData.account?.name || 'Connected & Synced')
                : 'Not Connected - Connect to see your CRM data'}
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

              {/* Connection Status Card - Always show when not connected or needs reconnection */}
              {needsConnection && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Link2 className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {crmData.needs_reconnection ? 'Reconnect Zoho CRM' : 'Connect Zoho CRM'}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {statusMessage || 'Connect your Zoho CRM account to sync leads and deals in real-time.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleConnectZoho}
                      disabled={connecting}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-900 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      {connecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          {crmData.needs_reconnection ? 'Reconnect' : 'Connect Now'}
                        </>
                      )}
                    </button>
                  </div>
                  {connectionError && (
                    <div className={`mt-4 p-4 rounded-lg text-sm whitespace-pre-line ${
                      connectionError.includes('already connected') || connectionError.includes('popup') || connectionError.includes('Please complete')
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      <div className="font-semibold mb-2">⚠️ {connectionError.split('\n')[0]}</div>
                      {connectionError.includes('\n') && (
                        <div className="text-xs mt-2 opacity-90">
                          {connectionError.split('\n').slice(1).join('\n')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Connected Status */}
              {isConnected && !needsConnection && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Zoho CRM Connected</h3>
                      <p className="text-sm text-slate-400">
                        {crmData.account?.name || 'Your CRM account is connected'}
                        {crmData.last_sync && ` • Last synced: ${new Date(crmData.last_sync).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
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
