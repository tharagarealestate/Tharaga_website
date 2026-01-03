'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'high_priority' | 'score_increase' | 'new_interaction' | 'crm_sync' | 'ai_insight'
  title: string
  message: string
  lead_id?: string
  lead_name?: string
  timestamp: string
  read: boolean
  action_url?: string
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = getSupabase()

  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('lead-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: 'score=gte.8',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const lead = payload.new as any
            if (lead.score >= 8) {
              addNotification({
                id: `notification-${Date.now()}`,
                type: 'high_priority',
                title: 'High-Priority Lead Alert',
                message: `${lead.name || lead.email} has a score of ${lead.score.toFixed(1)}/10`,
                lead_id: lead.id,
                lead_name: lead.name || lead.email,
                timestamp: new Date().toISOString(),
                read: false,
                action_url: `/builder/leads/${lead.id}`,
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_interactions',
        },
        (payload) => {
          const interaction = payload.new as any
          addNotification({
            id: `notification-${Date.now()}`,
            type: 'new_interaction',
            title: 'New Interaction',
            message: `New ${interaction.interaction_type} interaction recorded`,
            lead_id: interaction.lead_id,
            timestamp: new Date().toISOString(),
            read: false,
            action_url: interaction.lead_id ? `/builder/leads/${interaction.lead_id}` : undefined,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/leads')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 20)) // Keep last 20
    setUnreadCount(prev => prev + 1)
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
      })
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'high_priority':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'score_increase':
        return <TrendingUp className="w-5 h-5 text-green-400" />
      case 'new_interaction':
        return <Clock className="w-5 h-5 text-blue-400" />
      case 'crm_sync':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'ai_insight':
        return <Sparkles className="w-5 h-5 text-purple-400" />
      default:
        return <Bell className="w-5 h-5 text-slate-400" />
    }
  }

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-96 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl shadow-2xl z-50 max-h-[600px] overflow-hidden"
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-500/5' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.action_url) {
                          window.location.href = notification.action_url
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

