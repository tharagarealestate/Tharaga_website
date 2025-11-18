'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Link2, 
  Settings, 
  Activity,
  ArrowLeft,
  Loader2,
  Plus,
  Edit,
  Trash2,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface ZohoStatus {
  connected: boolean
  active?: boolean
  health?: 'excellent' | 'good' | 'fair' | 'poor'
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
    mapped_records?: number
    field_mappings?: number
  }
  last_error?: string
  account_name?: string
  last_sync_at?: string
  total_synced?: number
}

export default function ZohoCRMPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<ZohoStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [deleteMappings, setDeleteMappings] = useState(false)
  const [syncType, setSyncType] = useState<'to_crm' | 'from_crm' | 'bidirectional'>('bidirectional')
  const [recordType, setRecordType] = useState<'lead' | 'deal' | 'all'>('all')
  const [syncResults, setSyncResults] = useState<any>(null)
  const [fieldMappings, setFieldMappings] = useState<any[]>([])
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [showMappingForm, setShowMappingForm] = useState(false)
  const [editingMapping, setEditingMapping] = useState<any>(null)
  const [mappingForm, setMappingForm] = useState({
    tharaga_field: '',
    crm_field: '',
    transform_type: 'direct',
    sync_direction: 'bidirectional',
    transform_config: {},
  })
  const [syncLogs, setSyncLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logFilters, setLogFilters] = useState({
    sync_type: '',
    sync_direction: '',
    status: '',
  })
  const [logPagination, setLogPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false,
  })
  const [logStatistics, setLogStatistics] = useState<any>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Check for URL parameters
  useEffect(() => {
    const connected = searchParams.get('zoho_connected')
    const error = searchParams.get('zoho_error')

    if (connected === 'true') {
      setMessage({
        type: 'success',
        text: 'Zoho CRM connected successfully!',
      })
      // Clear URL param
      router.replace('/builder/settings/zoho', { scroll: false })
      setTimeout(() => setMessage(null), 5000)
      fetchStatus()
    }

    if (error) {
      setMessage({
        type: 'error',
        text: decodeURIComponent(error),
      })
      router.replace('/builder/settings/zoho', { scroll: false })
      setTimeout(() => setMessage(null), 5000)
    }
  }, [searchParams, router])

  // Fetch connection status
  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/crm/zoho/status', {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setStatus({
          connected: data.connected || false,
          active: data.active,
          health: data.health,
          account: data.account,
          sync: data.sync,
          statistics: data.statistics,
          last_error: data.last_error,
          account_name: data.account?.name || data.account_name,
          last_sync_at: data.sync?.last_sync || data.last_sync_at,
          total_synced: data.statistics?.mapped_records || data.total_synced,
        })
      } else {
        setStatus({ connected: false })
      }
    } catch (error: any) {
      console.error('Error fetching status:', error)
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    if (status?.connected) {
      fetchFieldMappings()
    }
  }, [])

  // Fetch field mappings
  const fetchFieldMappings = async () => {
    if (!status?.connected) return
    try {
      setLoadingMappings(true)
      const response = await fetch('/api/crm/zoho/field-mappings', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setFieldMappings(data.mappings || [])
      }
    } catch (error: any) {
      console.error('Error fetching field mappings:', error)
    } finally {
      setLoadingMappings(false)
    }
  }

  // Handle create/update mapping
  const handleSaveMapping = async () => {
    try {
      const url = '/api/crm/zoho/field-mappings'
      const method = editingMapping ? 'PATCH' : 'POST'
      const body = editingMapping
        ? { mapping_id: editingMapping.id, ...mappingForm }
        : mappingForm

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: editingMapping ? 'Field mapping updated' : 'Field mapping created',
        })
        setShowMappingForm(false)
        setEditingMapping(null)
        setMappingForm({
          tharaga_field: '',
          crm_field: '',
          transform_type: 'direct',
          sync_direction: 'bidirectional',
          transform_config: {},
        })
        fetchFieldMappings()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to save mapping',
        })
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save mapping',
      })
    }
  }

  // Handle delete mapping
  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to delete this field mapping?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/crm/zoho/field-mappings?mapping_id=${mappingId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Field mapping deleted',
        })
        fetchFieldMappings()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to delete mapping',
        })
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete mapping',
      })
    }
  }

  // Handle edit mapping
  const handleEditMapping = (mapping: any) => {
    setEditingMapping(mapping)
    setMappingForm({
      tharaga_field: mapping.tharaga_field,
      crm_field: mapping.crm_field,
      transform_type: mapping.transform_type,
      sync_direction: mapping.sync_direction,
      transform_config: mapping.transform_rule || mapping.transform_config || {},
    })
    setShowMappingForm(true)
  }

  // Fetch field mappings when status changes
  useEffect(() => {
    if (status?.connected) {
      fetchFieldMappings()
    }
  }, [status?.connected])

  // Fetch sync logs
  const fetchSyncLogs = async (resetOffset = false) => {
    if (!status?.connected) return
    try {
      setLoadingLogs(true)
      const offset = resetOffset ? 0 : logPagination.offset
      const params = new URLSearchParams({
        limit: logPagination.limit.toString(),
        offset: offset.toString(),
      })
      
      if (logFilters.sync_type) params.append('sync_type', logFilters.sync_type)
      if (logFilters.sync_direction) params.append('sync_direction', logFilters.sync_direction)
      if (logFilters.status) params.append('status', logFilters.status)

      const response = await fetch(`/api/crm/zoho/sync-logs?${params.toString()}`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setSyncLogs(data.logs || [])
        setLogPagination(data.pagination)
        setLogStatistics(data.statistics)
      }
    } catch (error: any) {
      console.error('Error fetching sync logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Handle log filter change
  const handleLogFilterChange = (key: string, value: string) => {
    setLogFilters({ ...logFilters, [key]: value })
    setLogPagination({ ...logPagination, offset: 0 })
  }

  // Apply filters effect
  useEffect(() => {
    if (showLogs && status?.connected) {
      fetchSyncLogs(true)
    }
  }, [logFilters, showLogs, status?.connected])

  // Handle connect
  const handleConnect = async () => {
    try {
      setConnecting(true)
      const response = await fetch('/api/crm/zoho/connect', {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success && data.auth_url) {
        // Redirect to Zoho OAuth
        window.location.href = data.auth_url
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to initiate connection',
        })
        setConnecting(false)
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to connect',
      })
      setConnecting(false)
    }
  }

  // Handle disconnect
  const handleDisconnect = async () => {
    setShowDisconnectDialog(true)
  }

  const confirmDisconnect = async () => {
    try {
      setDisconnecting(true)
      const response = await fetch('/api/crm/zoho/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delete_mappings: deleteMappings,
        }),
      })
      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Zoho CRM disconnected successfully',
        })
        setShowDisconnectDialog(false)
        setDeleteMappings(false)
        fetchStatus()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to disconnect',
        })
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to disconnect',
      })
    } finally {
      setDisconnecting(false)
    }
  }

  // Handle sync
  const handleSync = async () => {
    try {
      setSyncing(true)
      setSyncResults(null)
      const response = await fetch('/api/crm/zoho/sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_type: syncType,
          record_type: recordType,
          force: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSyncResults(data.results)
        setMessage({
          type: 'success',
          text: `Sync completed! ${data.results.total_synced} records synced successfully.`,
        })
        fetchStatus()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to sync',
        })
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to sync',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/builder/settings?tab=integrations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Integrations
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Zoho CRM Integration</h1>
        <p className="text-sm text-gray-600">
          Sync your leads and deals with Zoho CRM for seamless customer management
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Connection Status Card */}
      <div className="bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connection Status</h2>
              <p className="text-sm text-gray-600">Manage your Zoho CRM connection</p>
            </div>
          </div>
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : status?.connected ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
              {status.health && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  status.health === 'excellent'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status.health === 'good'
                    ? 'bg-blue-100 text-blue-700'
                    : status.health === 'fair'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {status.health.charAt(0).toUpperCase() + status.health.slice(1)} Health
                </span>
              )}
            </div>
          ) : (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              Not Connected
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading status...</p>
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            {status.account?.name && (
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Account</span>
                <span className="text-sm font-medium text-gray-900">{status.account.name}</span>
              </div>
            )}
            {status.sync?.last_sync && (
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Last Sync</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(status.sync.last_sync).toLocaleString()}
                </span>
              </div>
            )}
            {status.sync?.success_rate !== undefined && (
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className={`text-sm font-medium ${
                  status.sync.success_rate >= 95
                    ? 'text-emerald-600'
                    : status.sync.success_rate >= 80
                    ? 'text-blue-600'
                    : status.sync.success_rate >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {status.sync.success_rate}%
                </span>
              </div>
            )}
            {status.sync?.recent_syncs !== undefined && (
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Recent Syncs (24h)</span>
                <span className="text-sm font-medium text-gray-900">{status.sync.recent_syncs}</span>
              </div>
            )}
            {status.statistics && (
              <>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total Syncs</span>
                  <span className="text-sm font-medium text-gray-900">{status.statistics.total_syncs || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Successful</span>
                  <span className="text-sm font-medium text-emerald-600">{status.statistics.successful_syncs || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="text-sm font-medium text-red-600">{status.statistics.failed_syncs || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Mapped Records</span>
                  <span className="text-sm font-medium text-gray-900">{status.statistics.mapped_records || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Field Mappings</span>
                  <span className="text-sm font-medium text-gray-900">{status.statistics.field_mappings || 0}</span>
                </div>
              </>
            )}
            {status.last_error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xs font-medium text-red-800 mb-1">Last Error</div>
                <div className="text-xs text-red-700">{status.last_error}</div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <select
                    value={syncType}
                    onChange={(e) => setSyncType(e.target.value as any)}
                    disabled={syncing}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 disabled:opacity-50"
                  >
                    <option value="to_crm">To Zoho</option>
                    <option value="from_crm">From Zoho</option>
                    <option value="bidirectional">Bidirectional</option>
                  </select>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value as any)}
                    disabled={syncing}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 disabled:opacity-50"
                  >
                    <option value="all">All Records</option>
                    <option value="lead">Leads Only</option>
                    <option value="deal">Deals Only</option>
                  </select>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Sync Now
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 mb-4">
              Connect your Zoho CRM account to start syncing leads and deals
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Connect Zoho CRM
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Features Table - Matching Pricing Design */}
      {status?.connected && (
        <div className="bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sync Features</h2>
          <div className="overflow-auto border border-gray-200 rounded">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Feature</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="p-3 font-medium">Lead Sync</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">Automatically sync leads to Zoho Contacts</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-3 font-medium">Deal Sync</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">Sync property deals to Zoho Deals</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-3 font-medium">Bidirectional Sync</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">Sync changes from Zoho back to Tharaga</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-3 font-medium">Field Mapping</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      Configured
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">Custom field mappings available</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-3 font-medium">Real-time Webhooks</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      Available
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">Webhook endpoint ready for Zoho configuration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sync Activity */}
      {status?.connected && (
        <div className="bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Sync Activity</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Last Sync</p>
                <p className="text-xs text-gray-600">
                  {status.sync?.last_sync || status.last_sync_at
                    ? new Date(status.sync?.last_sync || status.last_sync_at!).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <button
                onClick={fetchStatus}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Records Synced</p>
                <p className="text-xs text-gray-600">{status.statistics?.mapped_records || status.total_synced || 0} records</p>
              </div>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Webhook Configuration</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/crm/zoho/webhook`}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono"
                    />
                    <button
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/crm/zoho/webhook`;
                        navigator.clipboard.writeText(url);
                        setMessage({
                          type: 'success',
                          text: 'Webhook URL copied to clipboard!',
                        });
                        setTimeout(() => setMessage(null), 3000);
                      }}
                      className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>1. Copy the webhook URL above</p>
                  <p>2. Go to Zoho CRM → Settings → Developer Space → Webhooks</p>
                  <p>3. Create a new webhook and paste this URL</p>
                  <p>4. Select events: Contacts (insert, update), Deals (insert, update)</p>
                  <p>5. Save the webhook secret and add it to <code className="px-1 py-0.5 bg-gray-200 rounded">ZOHO_WEBHOOK_SECRET</code> environment variable</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-1">Security Note</p>
                  <p className="text-xs text-blue-700">
                    Webhook signature verification is enabled. Make sure to set <code className="px-1 py-0.5 bg-blue-100 rounded">ZOHO_WEBHOOK_SECRET</code> in your environment variables for production.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Field Mappings Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Field Mappings</h3>
              <button
                onClick={() => {
                  setEditingMapping(null)
                  setMappingForm({
                    tharaga_field: '',
                    crm_field: '',
                    transform_type: 'direct',
                    sync_direction: 'bidirectional',
                    transform_config: {},
                  })
                  setShowMappingForm(true)
                }}
                className="px-3 py-1.5 text-xs font-medium bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Mapping
              </button>
            </div>

            {loadingMappings ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-600">Loading mappings...</p>
              </div>
            ) : (
              <div className="overflow-auto border border-gray-200 rounded">
                <table className="min-w-[720px] w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Tharaga Field</th>
                      <th className="text-left p-3 font-medium text-gray-700">Zoho Field</th>
                      <th className="text-left p-3 font-medium text-gray-700">Transform</th>
                      <th className="text-left p-3 font-medium text-gray-700">Direction</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldMappings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500 text-sm">
                          No field mappings configured. Click "Add Mapping" to create one.
                        </td>
                      </tr>
                    ) : (
                      fieldMappings.map((mapping) => (
                        <tr key={mapping.id} className="border-t border-gray-200">
                          <td className="p-3 font-medium">{mapping.tharaga_field}</td>
                          <td className="p-3">{mapping.crm_field}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                              {mapping.transform_type}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              {mapping.sync_direction}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              mapping.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {mapping.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditMapping(mapping)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMapping(mapping.id)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mapping Form Modal */}
          {showMappingForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {editingMapping ? 'Edit Field Mapping' : 'Add Field Mapping'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowMappingForm(false)
                        setEditingMapping(null)
                        setMappingForm({
                          tharaga_field: '',
                          crm_field: '',
                          transform_type: 'direct',
                          sync_direction: 'bidirectional',
                          transform_config: {},
                        })
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tharaga Field
                      </label>
                      <input
                        type="text"
                        value={mappingForm.tharaga_field}
                        onChange={(e) => setMappingForm({ ...mappingForm, tharaga_field: e.target.value })}
                        placeholder="e.g., email, full_name, budget_min"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Zoho Field
                      </label>
                      <input
                        type="text"
                        value={mappingForm.crm_field}
                        onChange={(e) => setMappingForm({ ...mappingForm, crm_field: e.target.value })}
                        placeholder="e.g., Email, Full_Name, Budget_Min"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Transform Type
                      </label>
                      <select
                        value={mappingForm.transform_type}
                        onChange={(e) => setMappingForm({ ...mappingForm, transform_type: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
                      >
                        <option value="direct">Direct</option>
                        <option value="json_path">JSON Path</option>
                        <option value="custom_function">Custom Function</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sync Direction
                      </label>
                      <select
                        value={mappingForm.sync_direction}
                        onChange={(e) => setMappingForm({ ...mappingForm, sync_direction: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
                      >
                        <option value="bidirectional">Bidirectional</option>
                        <option value="to_crm">To Zoho Only</option>
                        <option value="from_crm">From Zoho Only</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowMappingForm(false)
                          setEditingMapping(null)
                        }}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveMapping}
                        className="flex-1 px-4 py-2 bg-gold-600 text-white font-medium rounded-lg hover:bg-gold-700 transition-all"
                      >
                        {editingMapping ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Results Table - Matching Pricing Design */}
          {syncResults && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Last Sync Results</h3>
              <div className="overflow-auto border border-gray-200 rounded">
                <table className="min-w-[720px] w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Record Type</th>
                      <th className="text-left p-3 font-medium text-gray-700">Successful</th>
                      <th className="text-left p-3 font-medium text-gray-700">Failed</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="p-3 font-medium">Leads</td>
                      <td className="p-3">{syncResults.leads.successful}</td>
                      <td className="p-3">{syncResults.leads.failed}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          syncResults.leads.failed === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : syncResults.leads.successful > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {syncResults.leads.failed === 0 ? 'Success' : 'Partial'}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="p-3 font-medium">Deals</td>
                      <td className="p-3">{syncResults.deals.successful}</td>
                      <td className="p-3">{syncResults.deals.failed}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          syncResults.deals.failed === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : syncResults.deals.successful > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {syncResults.deals.failed === 0 ? 'Success' : 'Partial'}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="p-3 font-bold">Total</td>
                      <td className="p-3 font-bold">{syncResults.total_synced}</td>
                      <td className="p-3 font-bold">{syncResults.total_failed}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          syncResults.total_failed === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : syncResults.total_synced > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {syncResults.total_failed === 0 ? 'Success' : 'Partial'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {syncResults.leads.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {syncResults.leads.errors.slice(0, 5).map((error: string, idx: number) => (
                      <li key={idx}>• {error}</li>
                    ))}
                    {syncResults.leads.errors.length > 5 && (
                      <li className="text-red-600">... and {syncResults.leads.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              {syncResults.deals.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-800 mb-2">Deal Errors:</p>
                  <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {syncResults.deals.errors.slice(0, 5).map((error: string, idx: number) => (
                      <li key={idx}>• {error}</li>
                    ))}
                    {syncResults.deals.errors.length > 5 && (
                      <li className="text-red-600">... and {syncResults.deals.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sync Logs Section */}
      {status?.connected && (
        <div className="bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Sync History & Logs</h2>
            </div>
            <button
              onClick={() => {
                setShowLogs(!showLogs)
                if (!showLogs) {
                  fetchSyncLogs(true)
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {showLogs ? 'Hide Logs' : 'View Logs'}
            </button>
          </div>

          {showLogs && (
            <>
              {/* Statistics */}
              {logStatistics && (
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Total Syncs</div>
                    <div className="text-lg font-bold text-gray-900">{logStatistics.total}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-xs text-emerald-700 mb-1">Successful</div>
                    <div className="text-lg font-bold text-emerald-900">{logStatistics.successful}</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-xs text-red-700 mb-1">Failed</div>
                    <div className="text-lg font-bold text-red-900">{logStatistics.failed}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-700 mb-1">Success Rate</div>
                    <div className="text-lg font-bold text-blue-900">
                      {logStatistics.total > 0
                        ? `${Math.round((logStatistics.successful / logStatistics.total) * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="mb-4 flex gap-3 flex-wrap">
                <select
                  value={logFilters.sync_type}
                  onChange={(e) => handleLogFilterChange('sync_type', e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
                >
                  <option value="">All Types</option>
                  <option value="lead">Leads</option>
                  <option value="deal">Deals</option>
                </select>
                <select
                  value={logFilters.sync_direction}
                  onChange={(e) => handleLogFilterChange('sync_direction', e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
                >
                  <option value="">All Directions</option>
                  <option value="to_crm">To Zoho</option>
                  <option value="from_crm">From Zoho</option>
                </select>
                <select
                  value={logFilters.status}
                  onChange={(e) => handleLogFilterChange('status', e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
                >
                  <option value="">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="partial">Partial</option>
                </select>
                <button
                  onClick={() => {
                    setLogFilters({ sync_type: '', sync_direction: '', status: '' })
                    setLogPagination({ ...logPagination, offset: 0 })
                  }}
                  className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Clear Filters
                </button>
              </div>

              {/* Logs Table */}
              {loadingLogs ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Loading logs...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-auto border border-gray-200 rounded">
                    <table className="min-w-[720px] w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 font-medium text-gray-700">Time</th>
                          <th className="text-left p-3 font-medium text-gray-700">Type</th>
                          <th className="text-left p-3 font-medium text-gray-700">Direction</th>
                          <th className="text-left p-3 font-medium text-gray-700">Status</th>
                          <th className="text-left p-3 font-medium text-gray-700">Records</th>
                          <th className="text-left p-3 font-medium text-gray-700">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-500 text-sm">
                              No sync logs found. Sync operations will appear here.
                            </td>
                          </tr>
                        ) : (
                          syncLogs.map((log) => (
                            <tr key={log.id} className="border-t border-gray-200 hover:bg-gray-50">
                              <td className="p-3 text-gray-600">
                                {log.sync_started_at
                                  ? new Date(log.sync_started_at).toLocaleString()
                                  : '—'}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                  {log.sync_type}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                  {log.sync_direction}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  log.status === 'success'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : log.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="p-3 text-gray-600">
                                {log.records_processed > 0 ? (
                                  <div className="text-xs">
                                    <div>Total: {log.records_processed}</div>
                                    {log.records_successful > 0 && (
                                      <div className="text-emerald-600">✓ {log.records_successful}</div>
                                    )}
                                    {log.records_failed > 0 && (
                                      <div className="text-red-600">✗ {log.records_failed}</div>
                                    )}
                                  </div>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="p-3">
                                {log.error_message ? (
                                  <div className="max-w-xs">
                                    <div className="text-xs text-red-600 truncate" title={log.error_message}>
                                      {log.error_message}
                                    </div>
                                    {log.error_code && (
                                      <div className="text-xs text-gray-500">Code: {log.error_code}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {logPagination.total > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        Showing {logPagination.offset + 1} to {Math.min(logPagination.offset + logPagination.limit, logPagination.total)} of {logPagination.total} logs
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newOffset = Math.max(0, logPagination.offset - logPagination.limit)
                            setLogPagination({ ...logPagination, offset: newOffset })
                            fetchSyncLogs()
                          }}
                          disabled={logPagination.offset === 0}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Previous
                        </button>
                        <button
                          onClick={() => {
                            const newOffset = logPagination.offset + logPagination.limit
                            setLogPagination({ ...logPagination, offset: newOffset })
                            fetchSyncLogs()
                          }}
                          disabled={!logPagination.has_more}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          Next
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      {showDisconnectDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Disconnect Zoho CRM?</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to disconnect your Zoho CRM integration? This will stop all syncing between Tharaga and Zoho CRM.
              </p>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteMappings}
                    onChange={(e) => setDeleteMappings(e.target.checked)}
                    className="mt-1 w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Delete field mappings
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Remove all custom field mappings. Record mappings will be kept for historical reference.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisconnectDialog(false)
                    setDeleteMappings(false)
                  }}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisconnect}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

