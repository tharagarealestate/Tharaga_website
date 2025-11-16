'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Play, Pause, Edit, Trash2, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Automation {
  id: string
  name: string
  description?: string
  is_active: boolean
  total_executions: number
  successful_executions: number
  failed_executions: number
  last_execution_at?: string
  tags?: string[]
}

interface Stats {
  total: number
  active: number
  today_executions: number
  success_rate: number
  pending_jobs: number
}

interface AutomationDashboardProps {
  builderId: string
}

export function AutomationDashboard({ builderId }: AutomationDashboardProps) {
  const router = useRouter()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchAutomations()
    fetchStats()
    const interval = setInterval(() => {
      fetchAutomations()
      fetchStats()
    }, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [builderId, filter])

  const fetchAutomations = async () => {
    try {
      const params = new URLSearchParams({
        builder_id: builderId,
        ...(filter !== 'all' && { status: filter }),
        ...(search && { search }),
      })
      const response = await fetch(`/api/automations?${params}`)
      const data = await response.json()
      setAutomations(data.data || [])
    } catch (error) {
      console.error('Failed to fetch automations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/automations/stats?builder_id=${builderId}`)
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })
      if (response.ok) {
        fetchAutomations()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchAutomations()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const successRate = stats
    ? stats.total > 0
      ? ((stats.success_rate || 0) / 100) * 100
      : 0
    : 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400 mt-1">Total Automations</div>
          </div>
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-3xl font-bold text-emerald-400">{stats.active}</div>
            <div className="text-sm text-gray-400 mt-1">Active</div>
          </div>
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-3xl font-bold text-blue-400">{stats.today_executions}</div>
            <div className="text-sm text-gray-400 mt-1">Today&apos;s Executions</div>
          </div>
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-3xl font-bold text-gold-400">{successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">Success Rate</div>
          </div>
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-3xl font-bold text-orange-400">{stats.pending_jobs}</div>
            <div className="text-sm text-gray-400 mt-1">Pending Jobs</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Automations</h1>
        <button
          onClick={() => router.push(`/builder/automations/new?builder_id=${builderId}`)}
          className="px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Automation
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search automations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Automations List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : automations.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
          <div className="text-gray-400 mb-4">No automations found</div>
          <button
            onClick={() => router.push(`/builder/automations/new?builder_id=${builderId}`)}
            className="px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200"
          >
            Create Your First Automation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{automation.name}</h3>
                    <button
                      onClick={() => handleToggleStatus(automation.id, automation.is_active)}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        automation.is_active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {automation.is_active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {automation.description && (
                    <p className="text-gray-400 mb-3">{automation.description}</p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>Executions: {automation.total_executions}</span>
                    <span>Success: {automation.successful_executions}</span>
                    <span>Failed: {automation.failed_executions}</span>
                    {automation.last_execution_at && (
                      <span>
                        Last: {new Date(automation.last_execution_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {automation.tags && automation.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {automation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/builder/automations/${automation.id}?builder_id=${builderId}`)}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(automation.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


