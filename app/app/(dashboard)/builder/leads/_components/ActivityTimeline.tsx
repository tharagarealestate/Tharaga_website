'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Zap,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'interaction' | 'behavior' | 'score_change' | 'status_change' | 'crm_sync'
  timestamp: string
  title: string
  description: string
  status?: 'completed' | 'pending' | 'failed' | 'cancelled'
  metadata?: Record<string, any>
  user?: {
    name: string
    avatar?: string
  }
}

interface ActivityTimelineProps {
  leadId: string
  compact?: boolean
}

export function ActivityTimeline({ leadId, compact = false }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true)
        const response = await fetch(`/api/leads/${leadId}/activities`)
        if (response.ok) {
          const data = await response.json()
          setActivities(data.activities || [])
        } else {
          setError('Failed to load activities')
        }
      } catch (err) {
        console.error('Error fetching activities:', err)
        setError('Failed to load activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [leadId])

  const getActivityIcon = (type: string, status?: string) => {
    const iconClass = 'w-5 h-5'
    
    switch (type) {
      case 'interaction':
        if (status === 'completed') return <CheckCircle2 className={`${iconClass} text-green-400`} />
        if (status === 'pending') return <Clock className={`${iconClass} text-amber-400`} />
        if (status === 'failed') return <XCircle className={`${iconClass} text-red-400`} />
        return <MessageCircle className={`${iconClass} text-blue-400`} />
      case 'behavior':
        return <Eye className={`${iconClass} text-purple-400`} />
      case 'score_change':
        return <TrendingUp className={`${iconClass} text-amber-400`} />
      case 'status_change':
        return <Zap className={`${iconClass} text-cyan-400`} />
      case 'crm_sync':
        return <CheckCircle2 className={`${iconClass} text-green-400`} />
      default:
        return <FileText className={`${iconClass} text-slate-400`} />
    }
  }

  const getActivityColor = (type: string, status?: string) => {
    if (status === 'failed') return 'border-red-500/50 bg-red-500/10'
    if (status === 'pending') return 'border-amber-500/50 bg-amber-500/10'
    if (status === 'completed') return 'border-green-500/50 bg-green-500/10'
    
    switch (type) {
      case 'interaction':
        return 'border-blue-500/50 bg-blue-500/10'
      case 'behavior':
        return 'border-purple-500/50 bg-purple-500/10'
      case 'score_change':
        return 'border-amber-500/50 bg-amber-500/10'
      case 'status_change':
        return 'border-cyan-500/50 bg-cyan-500/10'
      case 'crm_sync':
        return 'border-green-500/50 bg-green-500/10'
      default:
        return 'border-slate-500/50 bg-slate-500/10'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-200">{error}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-8 text-center">
        <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">No Activity Yet</h3>
        <p className="text-slate-400 text-sm">Activity timeline will appear here as interactions occur</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className={`relative border-l-2 ${getActivityColor(activity.type, activity.status)} pl-6 pb-6 ${
              index < activities.length - 1 ? 'border-l-2' : ''
            }`}
          >
            {/* Timeline dot */}
            <div className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 ${getActivityColor(activity.type, activity.status)} -translate-x-[9px] flex items-center justify-center`}>
              <div className="w-2 h-2 rounded-full bg-current opacity-60" />
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${getActivityColor(activity.type, activity.status)} flex items-center justify-center flex-shrink-0`}>
                {getActivityIcon(activity.type, activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white">{activity.title}</h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-2">{activity.description}</p>
                
                {activity.metadata && Object.keys(activity.metadata).length > 0 && !compact && (
                  <div className="mt-2 space-y-1">
                    {activity.metadata.property_title && (
                      <div className="text-xs text-slate-400">
                        Property: <span className="text-slate-300">{activity.metadata.property_title}</span>
                      </div>
                    )}
                    {activity.metadata.duration && (
                      <div className="text-xs text-slate-400">
                        Duration: <span className="text-slate-300">{activity.metadata.duration}</span>
                      </div>
                    )}
                    {activity.metadata.score_change && (
                      <div className="text-xs text-slate-400">
                        Score: <span className="text-slate-300">{activity.metadata.score_change > 0 ? '+' : ''}{activity.metadata.score_change}</span>
                      </div>
                    )}
                  </div>
                )}

                {activity.user && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-xs text-slate-300">
                        {activity.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{activity.user.name}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

