'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'
import ZohoCRMIntegration from './_components/ZohoCRMIntegration'

function IntegrationsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean
    calendar_name?: string
    last_sync_at?: string
    total_events_synced?: number
  } | null>(null)
  const [calendarMessage, setCalendarMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [zohoStatus, setZohoStatus] = useState<{
    connected: boolean
    account_name?: string
    last_sync_at?: string
    total_synced?: number
  } | null>(null)
  const [loadingZoho, setLoadingZoho] = useState(true)
  const [showZohoIntegration, setShowZohoIntegration] = useState(false)

  // Check for calendar and Zoho callback messages
  useEffect(() => {
    const calendarError = searchParams.get('calendar_error')
    const calendarConnected = searchParams.get('calendar_connected')
    const zohoError = searchParams.get('zoho_error')
    const zohoConnected = searchParams.get('zoho_connected')
    const zohoDescription = searchParams.get('description')
    const zohoMessage = searchParams.get('message')

    if (calendarError) {
      setCalendarMessage({
        type: 'error',
        message: decodeURIComponent(calendarError),
      })
      router.replace('/builder/integrations', { scroll: false })
      setTimeout(() => setCalendarMessage(null), 5000)
    }

    if (calendarConnected) {
      setCalendarMessage({
        type: 'success',
        message: 'Calendar connected successfully!',
      })
      fetchCalendarStatus()
      router.replace('/builder/integrations', { scroll: false })
      setTimeout(() => setCalendarMessage(null), 5000)
    }

    if (zohoError) {
      const errorMsg = zohoDescription || zohoMessage || zohoError
      setCalendarMessage({
        type: 'error',
        message: `Zoho CRM: ${decodeURIComponent(errorMsg)}`,
      })
      router.replace('/builder/integrations', { scroll: false })
      setTimeout(() => setCalendarMessage(null), 8000)
    }

    if (zohoConnected === 'true') {
      setCalendarMessage({
        type: 'success',
        message: 'Zoho CRM connected successfully!',
      })
      router.replace('/builder/integrations', { scroll: false })
      setTimeout(() => setCalendarMessage(null), 5000)
    }
  }, [searchParams, router])

  // Fetch calendar status
  const fetchCalendarStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setCalendarStatus(data)
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error)
    }
  }

  // Fetch Zoho status
  useEffect(() => {
    const fetchZohoStatus = async () => {
      try {
        setLoadingZoho(true)
        const response = await fetch('/api/crm/zoho/status', {
          credentials: 'include',
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }))
            if (errorData.error && errorData.error === 'Unauthorized. Please log in.' && errorData.success === false) {
              console.warn('Authentication error when fetching Zoho status')
            }
          }
          setZohoStatus({ connected: false })
          return
        }

        const data = await response.json()
        
        if (data.success !== false) {
          setZohoStatus({
            connected: data.connected || false,
            account_name: data.account?.name || data.account_name || null,
            last_sync_at: data.sync?.last_sync || data.last_sync_at || null,
            total_synced: data.statistics?.total_syncs || data.total_synced || 0,
          })
        } else {
          setZohoStatus({ connected: false })
        }
      } catch (error) {
        console.error('Error fetching Zoho status:', error)
        setZohoStatus({ connected: false })
      } finally {
        setLoadingZoho(false)
      }
    }
    fetchZohoStatus()
  }, [])

  // Fetch calendar status on mount
  useEffect(() => {
    fetchCalendarStatus()
  }, [])

  const isCalendarConnected = calendarStatus?.connected || false

  const integrations = [
    {
      name: 'Google Calendar',
      desc: 'Sync your calendar events and schedule site visits',
      status: isCalendarConnected ? 'connected' : 'available',
      icon: '📅',
      href: '/builder/settings/calendar',
      calendarStatus,
    },
    {
      name: 'Zoho CRM',
      desc: 'Sync leads and deals with Zoho CRM for seamless management',
      status: zohoStatus?.connected ? 'connected' : 'available',
      icon: '🔗',
      href: '/builder/integrations',
      zohoStatus,
    },
    {
      name: 'WhatsApp Business',
      desc: 'Send automated messages and notifications via WhatsApp',
      status: 'connected',
      icon: '💬',
      href: '/builder/messaging',
    },
  ]

  // Handle calendar connect
  const handleCalendarConnect = async () => {
    try {
      setConnecting(true)
      const response = await fetch('/api/calendar/connect', {
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok && data.auth_url) {
        window.location.href = data.auth_url
      } else {
        alert(data.error || data.message || 'Failed to connect calendar')
        setConnecting(false)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to connect calendar')
      setConnecting(false)
    }
  }

  // Handle calendar sync
  const handleCalendarSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        alert(`Synced ${data.synced} events successfully!`)
        fetchCalendarStatus()
      } else {
        alert(data.error || 'Failed to sync calendar')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to sync calendar')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <BuilderPageWrapper 
      title="Integrations" 
      description="Connect your favorite tools and services"
      noContainer
    >
      <div className="space-y-6">

        {/* Status Message - Design System Alert */}
        {calendarMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border flex items-center justify-between ${
              calendarMessage.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100'
                : 'bg-rose-500/20 border-rose-400/50 text-rose-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {calendarMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-300" />
              )}
              <p className="font-medium">{calendarMessage.message}</p>
            </div>
            <button
              onClick={() => setCalendarMessage(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Integrations Grid - Design System Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {integrations.map((integration, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6 overflow-hidden group cursor-pointer"
            >
            {/* Hover Glow Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"
            />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{integration.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{integration.desc}</p>
                    {/* Calendar Status Info */}
                    {integration.name === 'Google Calendar' && integration.calendarStatus?.connected && (
                      <div className="mt-2 text-xs text-slate-500">
                        {integration.calendarStatus.calendar_name && (
                          <div>Calendar: {integration.calendarStatus.calendar_name}</div>
                        )}
                        {integration.calendarStatus.total_events_synced !== undefined && (
                          <div>Events synced: {integration.calendarStatus.total_events_synced}</div>
                        )}
                      </div>
                    )}
                    {/* Zoho Status Info */}
                    {integration.name === 'Zoho CRM' && integration.zohoStatus?.connected && (
                      <div className="mt-2 text-xs text-slate-500">
                        {integration.zohoStatus.account_name && (
                          <div>Account: {integration.zohoStatus.account_name}</div>
                        )}
                        {integration.zohoStatus.total_synced !== undefined && (
                          <div>Records synced: {integration.zohoStatus.total_synced}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    integration.status === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                  }`}
                >
                  {integration.status === 'connected' ? 'Connected' : 'Available'}
                </span>
                {integration.name === 'Google Calendar' ? (
                  <div className="flex items-center gap-2">
                    {integration.status === 'connected' ? (
                      <>
                        <button
                          onClick={handleCalendarSync}
                          disabled={syncing}
                          className="px-3 py-2 text-xs font-medium bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                        >
                          {syncing ? 'Syncing...' : 'Sync'}
                        </button>
                        <Link
                          href={integration.href}
                          className="px-4 py-2 text-sm font-medium bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all"
                        >
                          Manage
                        </Link>
                      </>
                    ) : (
                      <button
                        onClick={handleCalendarConnect}
                        disabled={connecting}
                        className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
                      >
                        {connecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                ) : integration.name === 'Zoho CRM' ? (
                  <button
                    onClick={() => setShowZohoIntegration(!showZohoIntegration)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      integration.status === 'connected'
                        ? 'bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700'
                        : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold'
                    }`}
                  >
                    {integration.status === 'connected' ? 'Manage' : 'Connect'}
                  </button>
                ) : (
                  <Link
                    href={integration.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      integration.status === 'connected'
                        ? 'bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700'
                        : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold'
                    }`}
                  >
                    {integration.status === 'connected' ? 'Manage' : 'Connect'}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

        {/* Zoho CRM Integration Component */}
        {showZohoIntegration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ZohoCRMIntegration />
          </motion.div>
        )}

      </div>
    </BuilderPageWrapper>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <BuilderPageWrapper title="Integrations" description="Connect your favorite tools and services">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-2 border-amber-300 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400">Loading integrations...</p>
          </div>
        </div>
      </BuilderPageWrapper>
    }>
      <IntegrationsPageContent />
    </Suspense>
  )
}

