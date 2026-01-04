"use client"

import { useEffect, useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { getSupabase } from '@/lib/supabase'
import { format, subDays } from 'date-fns'
import { AlertTriangle, Shield, Lock, Activity, Eye, Search, Filter, Download } from 'lucide-react'

// ---------- Types ----------

type AuditLog = {
  id: string
  action: string
  resource_type: string
  user_id: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: any
  created_at: string
}

type AuditLogResponse = {
  success: boolean
  data: {
    logs: AuditLog[]
    pagination: {
      page: number
      limit: number
      total: number
      total_pages: number
    }
    summary: {
      last_7_days: {
        total_events: number
        action_counts: Record<string, number>
        resource_counts: Record<string, number>
      }
    }
    filters_applied: any
  }
}

type SecurityAlert = {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  metadata: any
  created_at: string
  acknowledged: boolean
}

// ---------- Data Fetchers ----------

async function fetchAuditLogs(params: {
  page?: number
  limit?: number
  action?: string
  resource_type?: string
  user_id?: string
  start_date?: string
  end_date?: string
  ip_address?: string
  search?: string
}): Promise<AuditLogResponse> {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.set('page', params.page.toString())
  if (params.limit) queryParams.set('limit', params.limit.toString())
  if (params.action) queryParams.set('action', params.action)
  if (params.resource_type) queryParams.set('resource_type', params.resource_type)
  if (params.user_id) queryParams.set('user_id', params.user_id)
  if (params.start_date) queryParams.set('start_date', params.start_date)
  if (params.end_date) queryParams.set('end_date', params.end_date)
  if (params.ip_address) queryParams.set('ip_address', params.ip_address)
  if (params.search) queryParams.set('search', params.search)

  const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
    cache: 'no-store',
    credentials: 'include'
  })
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.status}`)
  return res.json()
}

async function fetchSecurityAlerts(): Promise<{ success: boolean; data: SecurityAlert[] }> {
  const res = await fetch('/api/admin/security/alerts', {
    cache: 'no-store',
    credentials: 'include'
  })
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`)
  return res.json()
}

async function fetchSecurityMetrics(): Promise<{
  success: boolean
  data: {
    failed_logins_24h: number
    suspicious_ips: number
    account_lockouts: number
    security_events_24h: number
    top_failed_ips: Array<{ ip: string; count: number }>
    recent_alerts: SecurityAlert[]
  }
}> {
  const res = await fetch('/api/admin/security/metrics', {
    cache: 'no-store',
    credentials: 'include'
  })
  if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.status}`)
  return res.json()
}

function useRealtime(table: string, onChange: () => void) {
  useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel(`security_${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        () => {
          onChange()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onChange])
}

// ---------- Component ----------

export default function SecurityMonitoringPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    search: '',
    start_date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  })

  // Real-time subscriptions
  useRealtime('audit_logs', () => {
    qc.invalidateQueries({ queryKey: ['audit-logs'] })
    qc.invalidateQueries({ queryKey: ['security-metrics'] })
    qc.invalidateQueries({ queryKey: ['security-alerts'] })
  })

  useRealtime('security_alerts', () => {
    qc.invalidateQueries({ queryKey: ['security-alerts'] })
    qc.invalidateQueries({ queryKey: ['security-metrics'] })
  })

  // Queries
  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs', page, limit, filters],
    queryFn: () => fetchAuditLogs({ page, limit, ...filters }),
    refetchInterval: 30000,
    placeholderData: (prev) => prev
  })

  const metricsQuery = useQuery({
    queryKey: ['security-metrics'],
    queryFn: fetchSecurityMetrics,
    refetchInterval: 30000,
    placeholderData: (prev) => prev
  })

  const alertsQuery = useQuery({
    queryKey: ['security-alerts'],
    queryFn: fetchSecurityAlerts,
    refetchInterval: 15000,
    placeholderData: (prev) => prev
  })

  const auditLogs = auditLogsQuery.data?.data?.logs || []
  const pagination = auditLogsQuery.data?.data?.pagination
  const summary = auditLogsQuery.data?.data?.summary
  const metrics = metricsQuery.data?.data
  const alerts = alertsQuery.data?.data || []

  const criticalAlerts = useMemo(() => 
    alerts.filter(a => a.severity === 'critical' && !a.acknowledged),
    [alerts]
  )

  const getActionColor = (action: string) => {
    if (action.includes('failed') || action.includes('delete')) return 'text-red-400'
    if (action.includes('login') || action.includes('create')) return 'text-green-400'
    if (action.includes('update') || action.includes('change')) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Security Monitoring</h1>
          <p className="text-gray-400 mt-1">Monitor security events, audit logs, and alerts</p>
        </div>
        <Button
          onClick={() => {
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([k, v]) => v && params.set(k, v))
            window.open(`/api/admin/audit-logs?${params.toString()}`, '_blank')
          }}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/50">
          <div className="flex items-center gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="flex-1">
              <div className="font-semibold text-red-400">
                {criticalAlerts.length} Critical Security Alert{criticalAlerts.length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {criticalAlerts[0]?.title}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '#alerts'}
            >
              View All
            </Button>
          </div>
        </Card>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Failed Logins (24h)</div>
              <div className="text-2xl font-semibold text-gray-100 mt-1">
                {metricsQuery.isLoading ? '—' : metrics?.failed_logins_24h || 0}
              </div>
            </div>
            <Lock className="w-8 h-8 text-red-400/50" />
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Suspicious IPs</div>
              <div className="text-2xl font-semibold text-gray-100 mt-1">
                {metricsQuery.isLoading ? '—' : metrics?.suspicious_ips || 0}
              </div>
            </div>
            <Shield className="w-8 h-8 text-orange-400/50" />
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Account Lockouts</div>
              <div className="text-2xl font-semibold text-gray-100 mt-1">
                {metricsQuery.isLoading ? '—' : metrics?.account_lockouts || 0}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400/50" />
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Security Events (24h)</div>
              <div className="text-2xl font-semibold text-gray-100 mt-1">
                {metricsQuery.isLoading ? '—' : metrics?.security_events_24h || 0}
              </div>
            </div>
            <Activity className="w-8 h-8 text-blue-400/50" />
          </div>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card id="alerts">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Security Alerts</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ['security-alerts'] })}
          >
            Refresh
          </Button>
        </div>
        <div className="space-y-2">
          {alertsQuery.isLoading ? (
            <div className="text-gray-400 text-center py-8">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No security alerts</div>
          ) : (
            alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{alert.title}</div>
                    <div className="text-sm mt-1 opacity-80">{alert.message}</div>
                    <div className="text-xs mt-2 opacity-60">
                      {format(new Date(alert.created_at), 'PPp')}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await fetch('/api/admin/security/alerts', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ alert_id: alert.id, acknowledged: true }),
                          credentials: 'include'
                        })
                        qc.invalidateQueries({ queryKey: ['security-alerts'] })
                      }}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Audit Logs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Audit Logs</h2>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <Select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All Actions</option>
            <option value="login_failed">Failed Logins</option>
            <option value="login">Successful Logins</option>
            <option value="role_change">Role Changes</option>
            <option value="user_delete">Account Deletions</option>
            <option value="property_create">Property Creation</option>
            <option value="lead_update">Lead Updates</option>
          </Select>

          <Select
            value={filters.resource_type}
            onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
          >
            <option value="">All Resources</option>
            <option value="auth">Authentication</option>
            <option value="lead">Leads</option>
            <option value="property">Properties</option>
            <option value="user">Users</option>
            <option value="admin">Admin</option>
          </Select>

          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100"
          />

          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100"
          />
        </div>

        {/* Logs Table */}
        {auditLogsQuery.isLoading ? (
          <div className="text-gray-400 text-center py-8">Loading audit logs...</div>
        ) : auditLogs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No audit logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Action</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Resource</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">IP Address</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                      </td>
                      <td className={`py-3 px-4 text-sm font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">{log.resource_type}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Anonymous'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400 font-mono text-xs">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            alert(JSON.stringify(log.metadata, null, 2))
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-400">
                  Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.total_pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Summary Stats */}
      {summary && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Last 7 Days Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-400">Total Events</div>
              <div className="text-2xl font-semibold text-gray-100 mt-1">
                {summary.last_7_days.total_events}
              </div>
            </div>
            {Object.entries(summary.last_7_days.action_counts).slice(0, 3).map(([action, count]) => (
              <div key={action}>
                <div className="text-sm text-gray-400">{action}</div>
                <div className="text-2xl font-semibold text-gray-100 mt-1">{count}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

