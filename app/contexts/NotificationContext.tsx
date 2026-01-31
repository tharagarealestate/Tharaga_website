'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Toaster, toast } from 'sonner'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

export type NotificationType =
  | 'hot_lead'
  | 'new_lead'
  | 'lead_interaction'
  | 'property_view'
  | 'score_change'
  | 'meeting_scheduled'
  | 'payment_received'
  | 'message_received'
  | 'property_update'
  | 'system_alert'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  lead_id?: string
  property_id?: string
  interaction_id?: string
  metadata?: Record<string, any>
  read: boolean
  read_at?: string | null
  created_at: string
  action_url?: string | null
  action_label?: string | null
}

interface NotificationPreferences {
  enabled: boolean
  sound_enabled: boolean
  desktop_enabled: boolean
  email_enabled: boolean
  hot_leads: boolean
  new_leads: boolean
  interactions: boolean
  score_changes: boolean
  meetings: boolean
  payments: boolean
  messages: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
}

export interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  userId: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
  preferences: NotificationPreferences
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  sound_enabled: true,
  desktop_enabled: true,
  email_enabled: true,
  hot_leads: true,
  new_leads: true,
  interactions: true,
  score_changes: true,
  meetings: true,
  payments: true,
  messages: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
}

type ToastVariant = 'default' | 'success' | 'info' | 'warning'

const toastByVariant: Record<ToastVariant, typeof toast> = {
  default: toast,
  success: toast.success,
  info: toast.info,
  warning: toast.warning,
}

function getPreferenceKeyForType(type: NotificationType): keyof NotificationPreferences {
  switch (type) {
    case 'hot_lead':
      return 'hot_leads'
    case 'new_lead':
      return 'new_leads'
    case 'lead_interaction':
    case 'property_view':
    case 'property_update':
      return 'interactions'
    case 'score_change':
      return 'score_changes'
    case 'meeting_scheduled':
      return 'meetings'
    case 'payment_received':
      return 'payments'
    case 'message_received':
      return 'messages'
    case 'system_alert':
    default:
      return 'enabled'
  }
}

function isInsideQuietHours(prefs: NotificationPreferences) {
  if (!prefs.quiet_hours_enabled) return false
  const [startH, startM] = prefs.quiet_hours_start.split(':').map((v) => parseInt(v, 10))
  const [endH, endM] = prefs.quiet_hours_end.split(':').map((v) => parseInt(v, 10))
  if (
    Number.isNaN(startH) ||
    Number.isNaN(startM) ||
    Number.isNaN(endH) ||
    Number.isNaN(endM)
  ) {
    return false
  }
  const toMinutes = (h: number, m: number) => h * 60 + m
  const start = toMinutes(startH, startM)
  const end = toMinutes(endH, endM)
  const now = new Date()
  const current = toMinutes(now.getHours(), now.getMinutes())
  if (start === end) {
    // Quiet all day if both times equal
    return true
  }
  if (start < end) {
    return current >= start && current < end
  }
  // Overnight quiet hours (e.g., 22:00 - 08:00)
  return current >= start || current < end
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<SupabaseClient | null>(null)
  if (!supabaseRef.current) {
    supabaseRef.current = getSupabase()
  }
  const supabase = supabaseRef.current

  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isOpen, setIsOpen] = useState(false)
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFS)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const subscriptionRef = useRef<ReturnType<SupabaseClient['channel']> | null>(null)

  useEffect(() => {
    if (typeof Audio === 'undefined') return
    const audio = new Audio('/sounds/notification.mp3')
    audio.preload = 'auto'
    audio.volume = 0.5
    audio.addEventListener('error', () => {
      audioRef.current = null
    })
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  const loadPreferences = useCallback(
    (uid: string) => {
      try {
        const stored = localStorage.getItem(`notification_prefs_${uid}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          setPreferences({ ...DEFAULT_PREFS, ...parsed })
          return
        }
      } catch (_) {
        /* noop */
      }
      setPreferences(DEFAULT_PREFS)
    },
    []
  )

  const fetchNotifications = useCallback(
    async (uid: string, { initial }: { initial?: boolean } = {}) => {
      if (!uid) return
      if (initial) setLoading(true)
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) throw error
        setNotifications((data || []) as Notification[])
      } catch (err) {
        console.error('Error fetching notifications:', err)
      } finally {
        if (initial) setLoading(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!active) return
        const uid = data.user?.id ?? null
        setUserId(uid)
        if (uid) {
          loadPreferences(uid)
          await fetchNotifications(uid, { initial: true })
        } else {
          setNotifications([])
          setLoading(false)
        }
      } catch (error) {
        console.error('Error resolving user for notifications:', error)
        if (active) {
          setUserId(null)
          setNotifications([])
          setLoading(false)
        }
      }
    })()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextId = session?.user?.id ?? null
        setUserId(nextId)
        if (nextId) {
          loadPreferences(nextId)
          await fetchNotifications(nextId, { initial: true })
        } else {
          setNotifications([])
        }
      }
    )

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [fetchNotifications, loadPreferences, supabase])

  const shouldDisplayNotification = useCallback(
    (notification: Notification) => {
      if (!preferences.enabled) return false
      if (isInsideQuietHours(preferences)) return false
      const key = getPreferenceKeyForType(notification.type)
      return Boolean(preferences[key as keyof NotificationPreferences])
    },
    [preferences]
  )

  const showNotification = useCallback(
    (notification: Notification) => {
      if (preferences.sound_enabled && audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current
          .play()
          .catch(() => {
            /* autoplay restrictions */
          })
      }

      const toastConfig = getToastConfig(notification)
      const emitter = toastByVariant[toastConfig.variant]
      emitter(toastConfig.title, {
        description: toastConfig.description,
        duration: toastConfig.duration,
        action:
          notification.action_url && notification.action_url.length > 0
            ? {
                label: notification.action_label || 'View',
                onClick: () => {
                  try {
                    window.location.href = notification.action_url as string
                  } catch (error) {
                    console.error('Failed to navigate to notification action:', error)
                  }
                },
              }
            : undefined,
      })

      if (
        preferences.desktop_enabled &&
        typeof window !== 'undefined' &&
        'Notification' in window
      ) {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            tag: notification.id,
            requireInteraction: notification.priority === 'urgent',
          })
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/icon-192x192.png',
              })
            }
          })
        }
      }
    },
    [preferences]
  )

  useEffect(() => {
    if (!userId) return

    if (subscriptionRef.current) {
      try {
        supabase.removeChannel(subscriptionRef.current)
      } catch (_) {
        /* noop */
      }
      subscriptionRef.current = null
    }

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as Notification
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === incoming.id)
            const next = exists ? prev : [incoming, ...prev]
            return next.slice(0, 50)
          })
          if (shouldDisplayNotification(incoming)) {
            showNotification(incoming)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          )
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (_) {
        /* noop */
      }
      subscriptionRef.current = null
    }
  }, [supabase, userId, shouldDisplayNotification, showNotification])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('id', notificationId)
        if (error) throw error
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          )
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
        toast.error('Failed to update notification')
      }
    },
    [supabase]
  )

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    try {
      const timestamp = new Date().toISOString()
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: timestamp })
        .eq('user_id', userId)
        .eq('read', false)
      if (error) throw error
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          read_at: timestamp,
        }))
      )
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all as read')
    }
  }, [supabase, userId])

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
        if (error) throw error
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        toast.success('Notification deleted')
      } catch (error) {
        console.error('Error deleting notification:', error)
        toast.error('Failed to delete notification')
      }
    },
    [supabase]
  )

  const clearAll = useCallback(async () => {
    if (!userId) return
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
      if (error) throw error
      setNotifications([])
      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }, [supabase, userId])

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...prefs }
        if (userId) {
          try {
            localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(next))
          } catch (_) {
            /* noop */
          }
        }
        return next
      })
      toast.success('Notification preferences updated')
    },
    [userId]
  )

  const unreadCount = useMemo(
    () => notifications.reduce((count, n) => count + (n.read ? 0 : 1), 0),
    [notifications]
  )

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
       userId,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      preferences,
      updatePreferences,
      isOpen,
      setIsOpen,
    }),
    [
      notifications,
      unreadCount,
      loading,
      userId,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      preferences,
      updatePreferences,
      isOpen,
    ]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster richColors position="top-right" closeButton expand />
    </NotificationContext.Provider>
  )
}

function getToastConfig(notification: Notification): {
  variant: ToastVariant
  title: string
  description: string
  duration: number
} {
  const description = notification.message || 'You have a new update'
  switch (notification.type) {
    case 'hot_lead':
      return {
        variant: 'success',
        title: '🔥 Hot Lead Alert',
        description,
        duration: 8000,
      }
    case 'new_lead':
      return {
        variant: 'default',
        title: '✨ New Lead',
        description,
        duration: 6000,
      }
    case 'lead_interaction':
      return {
        variant: 'default',
        title: '💬 Lead Interaction',
        description,
        duration: 6000,
      }
    case 'property_view':
      return {
        variant: 'default',
        title: '👀 Property Viewed',
        description,
        duration: 5000,
      }
    case 'score_change':
      return {
        variant: 'info',
        title: '📊 Lead Score Updated',
        description,
        duration: 6000,
      }
    case 'meeting_scheduled':
      return {
        variant: 'default',
        title: '📅 Meeting Scheduled',
        description,
        duration: 6500,
      }
    case 'payment_received':
      return {
        variant: 'success',
        title: '💰 Payment Received',
        description,
        duration: 7000,
      }
    case 'message_received':
      return {
        variant: 'default',
        title: '💬 New Message',
        description,
        duration: 6000,
      }
    case 'property_update':
      return {
        variant: 'info',
        title: '🏠 Property Update',
        description,
        duration: 6000,
      }
    case 'system_alert':
    default:
      return {
        variant: 'warning',
        title: '⚠️ System Alert',
        description,
        duration: 7000,
      }
  }
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}


