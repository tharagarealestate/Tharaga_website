'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, XCircle, RefreshCw, Link2, Clock, Loader2, AlertCircle } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

interface CalendarStatus {
  connected: boolean
  calendar_name?: string
  last_sync_at?: string
  total_events_synced?: number
}

export default function CalendarSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<CalendarStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check for success/error messages in URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      // Clear error from URL
      router.replace('/builder/settings/calendar', { scroll: false })
    }

    if (successParam) {
      setSuccess(successParam === 'connected' ? 'Calendar connected successfully!' : 'Operation successful!')
      // Clear success from URL
      router.replace('/builder/settings/calendar', { scroll: false })
      // Refresh status
      fetchStatus()
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    }
  }, [searchParams, router])

  // Fetch calendar status
  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/calendar/status', {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setStatus(data)
      } else {
        setError(data.error || 'Failed to fetch calendar status')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch calendar status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Connect calendar
  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError(null)
      const response = await fetch('/api/calendar/connect', {
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok && data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url
      } else {
        setError(data.error || data.message || 'Failed to get OAuth URL')
        setConnecting(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect calendar')
      setConnecting(false)
    }
  }

  // Sync calendar
  const handleSync = async () => {
    try {
      setSyncing(true)
      setError(null)
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setSuccess(`Synced ${data.synced} events successfully!`)
        // Refresh status
        await fetchStatus()
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(data.error || 'Failed to sync calendar')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync calendar')
    } finally {
      setSyncing(false)
    }
  }

  // Disconnect calendar
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your calendar? This will stop syncing events.')) {
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setSuccess('Calendar disconnected successfully!')
        // Refresh status
        await fetchStatus()
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(data.error || 'Failed to disconnect calendar')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect calendar')
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Glass Header */}
      <div className='bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-[60px] z-30'>
        <div className='max-w-7xl mx-auto px-6 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent'>
                Google Calendar Integration
              </h1>
              <p className='text-gray-600 mt-1'>Sync your calendar events and schedule site visits</p>
            </div>
            <div className='flex items-center gap-3'>
              {status.connected && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl text-gray-700 font-medium hover:bg-white/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {syncing ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className='w-4 h-4' />
                      Sync Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Success/Error Messages */}
        {success && (
          <div className='mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3'>
            <CheckCircle2 className='w-5 h-5 text-emerald-600' />
            <p className='text-emerald-800'>{success}</p>
          </div>
        )}

        {error && (
          <div className='mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3'>
            <AlertCircle className='w-5 h-5 text-rose-600' />
            <p className='text-rose-800'>{error}</p>
          </div>
        )}

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
          </div>
        ) : (
          <div className='grid lg:grid-cols-3 gap-8'>
            {/* Main Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Connection Status Card */}
              <div className='bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-8'>
                <div className='flex items-start justify-between mb-6'>
                  <div className='flex items-center gap-4'>
                    <div className='w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-2xl'>
                      <Calendar className='w-8 h-8' />
                    </div>
                    <div>
                      <h2 className='text-2xl font-bold text-gray-900'>Google Calendar</h2>
                      <p className='text-gray-600 mt-1'>
                        {status.connected ? 'Connected and syncing' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {status.connected ? (
                      <span className='px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4' />
                        Connected
                      </span>
                    ) : (
                      <span className='px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full flex items-center gap-2'>
                        <XCircle className='w-4 h-4' />
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {status.connected ? (
                  <div className='space-y-6'>
                    {/* Connection Info */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='p-4 bg-gray-50 rounded-xl'>
                        <div className='text-sm text-gray-600 mb-1'>Calendar Name</div>
                        <div className='text-lg font-semibold text-gray-900'>{status.calendar_name || 'Primary'}</div>
                      </div>
                      <div className='p-4 bg-gray-50 rounded-xl'>
                        <div className='text-sm text-gray-600 mb-1'>Events Synced</div>
                        <div className='text-lg font-semibold text-gray-900'>
                          {status.total_events_synced || 0}
                        </div>
                      </div>
                    </div>

                    {status.last_sync_at && (
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <Clock className='w-4 h-4' />
                        Last synced: {new Date(status.last_sync_at).toLocaleString()}
                      </div>
                    )}

                    {/* Actions */}
                    <div className='flex items-center gap-3 pt-6 border-t border-gray-200'>
                      <button
                        onClick={handleSync}
                        disabled={syncing}
                        className='px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                      >
                        {syncing ? (
                          <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className='w-4 h-4' />
                            Sync Events
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className='px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all'
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    {/* Benefits */}
                    <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6'>
                      <h3 className='text-lg font-bold text-gray-900 mb-4'>Benefits of connecting:</h3>
                      <ul className='space-y-3'>
                        <li className='flex items-start gap-3'>
                          <CheckCircle2 className='w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0' />
                          <span className='text-gray-700'>
                            Automatically sync site visit bookings to your Google Calendar
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <CheckCircle2 className='w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0' />
                          <span className='text-gray-700'>
                            Create Google Meet links for virtual site visits
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <CheckCircle2 className='w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0' />
                          <span className='text-gray-700'>
                            Check availability before scheduling appointments
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <CheckCircle2 className='w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0' />
                          <span className='text-gray-700'>
                            Get reminders 24 hours and 2 hours before site visits
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Connect Button */}
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className='w-full px-6 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      {connecting ? (
                        <>
                          <Loader2 className='w-5 h-5 animate-spin' />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className='w-5 h-5' />
                          Connect Google Calendar
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* How It Works */}
              {!status.connected && (
                <div className='bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-8'>
                  <h2 className='text-xl font-bold text-gray-900 mb-4'>How It Works</h2>
                  <div className='space-y-4'>
                    <div className='flex items-start gap-4'>
                      <div className='w-8 h-8 rounded-full bg-gradient-to-r from-gold-600 to-gold-500 text-white flex items-center justify-center font-bold flex-shrink-0'>
                        1
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900 mb-1'>Connect Your Calendar</h3>
                        <p className='text-gray-600'>
                          Click "Connect Google Calendar" and authorize Tharaga to access your calendar
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-4'>
                      <div className='w-8 h-8 rounded-full bg-gradient-to-r from-gold-600 to-gold-500 text-white flex items-center justify-center font-bold flex-shrink-0'>
                        2
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900 mb-1'>Automatic Sync</h3>
                        <p className='text-gray-600'>
                          Site visit bookings will automatically sync to your Google Calendar
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-4'>
                      <div className='w-8 h-8 rounded-full bg-gradient-to-r from-gold-600 to-gold-500 text-white flex items-center justify-center font-bold flex-shrink-0'>
                        3
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900 mb-1'>Manage Events</h3>
                        <p className='text-gray-600'>
                          View, edit, and manage all your site visits directly from your calendar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className='lg:col-span-1'>
              <div className='bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 sticky top-24'>
                <h3 className='text-lg font-bold text-gray-900 mb-4'>Quick Actions</h3>
                <div className='space-y-3'>
                  {status.connected ? (
                    <>
                      <button
                        onClick={handleSync}
                        disabled={syncing}
                        className='w-full px-4 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                      >
                        {syncing ? (
                          <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className='w-4 h-4' />
                            Sync Events
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className='w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all'
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className='w-full px-4 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      {connecting ? (
                        <>
                          <Loader2 className='w-4 h-4 animate-spin' />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className='w-4 h-4' />
                          Connect Calendar
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className='mt-6 pt-6 border-t border-gray-200'>
                  <h4 className='text-sm font-semibold text-gray-900 mb-2'>Need Help?</h4>
                  <p className='text-sm text-gray-600 mb-3'>
                    If you're having trouble connecting your calendar, check our documentation or contact
                    support.
                  </p>
                  <button className='w-full px-4 py-2 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors'>
                    View Documentation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

