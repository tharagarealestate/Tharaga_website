"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BellRing,
  Calendar,
  CheckCheck,
  Check,
  Flame,
  MessageCircle,
  Settings,
  Coins,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Settings2,
  Volume2,
  VolumeX,
  Monitor,
  MonitorX,
  Trash2,
  Loader2,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Home,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import type { Notification } from '@/contexts/NotificationContext'
import { getSupabase } from '@/lib/supabase'

const TYPE_META = {
  hot_lead: {
    icon: Flame,
    accent: 'from-rose-500/20 via-orange-500/20 to-amber-400/20',
    badge: 'Hot Lead',
  },
  new_lead: {
    icon: Sparkles,
    accent: 'from-primary-500/20 via-sky-500/20 to-indigo-500/20',
    badge: 'New Lead',
  },
  lead_interaction: {
    icon: MessageCircle,
    accent: 'from-purple-500/20 via-fuchsia-500/20 to-rose-500/20',
    badge: 'Interaction',
  },
  property_view: {
    icon: BellRing,
    accent: 'from-emerald-500/20 via-teal-400/20 to-lime-400/20',
    badge: 'Property View',
  },
  score_change: {
    icon: RefreshCw,
    accent: 'from-blue-500/20 via-sky-500/20 to-cyan-400/20',
    badge: 'Score Update',
  },
  meeting_scheduled: {
    icon: Calendar,
    accent: 'from-amber-500/20 via-orange-400/20 to-rose-400/20',
    badge: 'Meeting',
  },
  payment_received: {
    icon: Coins,
    accent: 'from-emerald-500/20 via-green-500/20 to-teal-500/20',
    badge: 'Payment',
  },
  message_received: {
    icon: MessageCircle,
    accent: 'from-indigo-500/20 via-sky-500/20 to-purple-500/20',
    badge: 'Message',
  },
  property_update: {
    icon: RefreshCw,
    accent: 'from-violet-500/20 via-purple-500/20 to-indigo-400/20',
    badge: 'Property Update',
  },
  system_alert: {
    icon: AlertTriangle,
    accent: 'from-red-500/25 via-amber-500/20 to-orange-500/20',
    badge: 'System Alert',
  },
} as const

const ICON_MAP: Record<Notification['type'], any> = {
  hot_lead: Flame,
  new_lead: Users,
  lead_interaction: MessageCircle,
  meeting_scheduled: Calendar,
  payment_received: DollarSign,
  score_change: TrendingUp,
  property_view: Eye,
  property_update: Home,
  message_received: MessageCircle,
  system_alert: AlertCircle,
}

function formatRelativeTime(date?: string | null) {
  if (!date) return ''
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export default function NotificationPanel() {
  const {
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
  } = useNotifications()

  const supabase = useMemo(() => getSupabase(), [])
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [showSettings, setShowSettings] = useState(false)

  const topNotifications = useMemo(() => notifications.slice(0, 20), [notifications])
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return topNotifications.filter((n) => !n.read)
    }
    return topNotifications
  }, [filter, topNotifications])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return
      const panel = panelRef.current
      const button = buttonRef.current
      if (!panel || !button) return
      if (panel.contains(event.target as Node) || button.contains(event.target as Node)) {
        return
      }
      setIsOpen(false)
    }

    function handleEscape(event: KeyboardEvent) {
      if (!isOpen) return
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, setIsOpen])

  const togglePreference = (key: 'sound_enabled' | 'desktop_enabled' | 'enabled') =>
    updatePreferences({ [key]: !preferences[key] })

  useEffect(() => {
    if (!userId) return
    if (!preferences.desktop_enabled) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) return

    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
      const rawData = atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }
      return outputArray
    }

    ;(async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        try {
          await supabase.from('push_subscriptions').insert({
            user_id: userId,
            subscription: subscription as unknown as Record<string, any>,
          })
        } catch (error) {
          // ignore duplicate rows
          if (process.env.NODE_ENV !== 'production') {
            console.debug('Push subscription registration skipped:', error)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('Push subscription registration failed:', error)
        }
      }
    })()
  }, [preferences.desktop_enabled, supabase, userId])

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white shadow-lg shadow-primary-900/20 transition-transform hover:-translate-y-0.5 hover:shadow-primary-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80"
        whileTap={{ scale: 0.92 }}
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[1.3rem] rounded-full bg-gradient-to-r from-gold-500 to-amber-400 px-1.5 text-center text-[10px] font-semibold leading-4 text-primary-950 shadow-sm shadow-amber-500/50"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            role="menu"
            key="dropdown"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="absolute right-0 z-50 mt-4 w-[380px] origin-top-right rounded-3xl border border-white/15 bg-white/90 p-3 shadow-2xl shadow-primary-900/25 backdrop-blur-xl"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 p-5 text-white">
              <div className="absolute inset-0 opacity-60">
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/40 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gold-500/30 blur-3xl" />
              </div>
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/70">
                    <BellRing className="h-4 w-4" />
                    Live Alerts
                  </div>
                  <h3 className="mt-1 text-xl font-semibold">Notification Center</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Stay on top of leads, meetings, payments and system alerts as they happen.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {unreadCount} unread
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-white/25"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-3 px-1">
              <div className="flex items-center justify-between rounded-2xl bg-white/90 p-3 shadow-inner shadow-white/30 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 via-amber-500/20 to-primary-500/20">
                    <Settings2 className="h-5 w-5 text-primary-700" />
                    <div className="absolute inset-0 animate-ping rounded-full border border-gold-400/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-950">Smart preferences</p>
                    <p className="text-xs text-primary-700/80">
                      Tailor how and when you want to be notified.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary-700">
                  <button
                    onClick={() => togglePreference('sound_enabled')}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${
                      preferences.sound_enabled
                        ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/30'
                        : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                    }`}
                    title={preferences.sound_enabled ? 'Sound enabled' : 'Sound muted'}
                  >
                    {preferences.sound_enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => togglePreference('desktop_enabled')}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${
                      preferences.desktop_enabled
                        ? 'border-sky-500/70 bg-sky-500/10 text-sky-600 shadow-sm shadow-sky-500/30'
                        : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                    }`}
                    title={preferences.desktop_enabled ? 'Desktop push on' : 'Desktop push off'}
                  >
                    {preferences.desktop_enabled ? <Monitor className="h-4 w-4" /> : <MonitorX className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => togglePreference('enabled')}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${
                      preferences.enabled
                        ? 'border-gold-500 bg-gradient-to-r from-gold-500/20 to-amber-400/20 text-gold-600'
                        : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                    }`}
                    title={preferences.enabled ? 'Notifications enabled' : 'Notifications paused'}
                  >
                    {preferences.enabled ? <Bell className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-primary-100/60 bg-primary-50/50 px-3 py-2 text-sm text-primary-700">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Focus view</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/70 p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setFilter('all')}
                    className={`rounded-full px-3 py-1 transition ${
                      filter === 'all' ? 'bg-primary-600 text-white shadow' : 'text-primary-700'
                    }`}
                  >
                    All ({topNotifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`rounded-full px-3 py-1 transition ${
                      filter === 'unread' ? 'bg-primary-600 text-white shadow' : 'text-primary-700'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {loading && (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary-200/70 bg-white/70 px-4 py-6 text-primary-700 backdrop-blur">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing notifications...
                  </div>
                )}

                {!loading && filteredNotifications.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-primary-200/60 bg-white/70 p-6 text-center backdrop-blur">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-primary-900">You're all caught up!</p>
                    <p className="mt-1 text-xs text-primary-700/80">
                      {filter === 'unread'
                        ? 'No unread alerts right now — great job staying on top of things!'
                        : 'New notifications will appear here instantly.'}
                    </p>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-primary-900/5 px-4 py-3 text-xs font-medium text-primary-800">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Managing {notifications.length} notifications
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-900 shadow-sm transition hover:bg-white/80"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Preferences
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-900 transition hover:bg-primary-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm font-semibold text-primary-700 shadow-inner shadow-white/20">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2 text-white shadow-lg shadow-primary-600/30 transition hover:-translate-y-0.5 hover:shadow-primary-600/50"
                >
                  View all updates
                </Link>
                <span className="text-xs font-medium text-primary-500/80">Stay in flow</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && <NotificationSettings key="settings-modal" onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const Icon = ICON_MAP[notification.type] ?? AlertCircle
  const meta = TYPE_META[notification.type] ?? TYPE_META.system_alert
  const isUnread = !notification.read

  const handleNavigate = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.action_url) {
      try {
        window.location.href = notification.action_url
      } catch (error) {
        console.error('Failed to navigate for notification action:', error)
      }
    }
  }

  return (
    <motion.div
      layout
      key={notification.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-br ${meta.accent} p-4 shadow-lg shadow-primary-900/10 transition hover:-translate-y-0.5 hover:shadow-primary-900/30`}
      onClick={handleNavigate}
    >
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-500">
        <div className="absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -top-14 -left-12 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      </div>
      {notification.priority === 'urgent' && (
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-orange-500" />
      )}
      <div className="relative flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-primary-950">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-900">
              {meta.badge}
            </span>
            {isUnread && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                New
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>
          <h4 className="mt-2 line-clamp-1 text-[15px] font-semibold text-primary-950">{notification.title}</h4>
          <p className="mt-1 line-clamp-2 text-[13px] text-primary-900/80">{notification.message}</p>

          {notification.metadata && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-primary-900/70">
              {notification.metadata.lead_name && <span>👤 {notification.metadata.lead_name}</span>}
              {typeof notification.metadata.lead_score === 'number' && (
                <span>⭐ Score {notification.metadata.lead_score}</span>
              )}
              {notification.metadata.property_title && <span>🏠 {notification.metadata.property_title}</span>}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-[12px] text-primary-900/60">
            <span>{formatRelativeTime(notification.created_at)}</span>
            <div className="flex items-center gap-2">
              {notification.action_url && (
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onMarkAsRead(notification.id)
                    try {
                      window.location.href = notification.action_url as string
                    } catch (error) {
                      console.error('Action navigation failed:', error)
                    }
                  }}
                  className="rounded-full bg-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-950 transition hover:bg-white/40"
                >
                  {notification.action_label || 'View'}
                </button>
              )}
              {!notification.read && (
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-900 transition hover:bg-white/30"
                >
                  <Check className="h-3.5 w-3.5" />
                  Read
                </button>
              )}
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(notification.id)
                }}
                className="inline-flex items-center justify-center rounded-full bg-white/10 p-1 text-primary-950 transition hover:bg-white/25"
                aria-label="Delete notification"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function NotificationSettings({ onClose }: { onClose: () => void }) {
  const { preferences, updatePreferences } = useNotifications()
  const [localPrefs, setLocalPrefs] = useState(preferences)

  useEffect(() => {
    setLocalPrefs(preferences)
  }, [preferences])

  const handleSave = async () => {
    await updatePreferences(localPrefs)
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
        className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-white/95 shadow-2xl shadow-primary-900/20 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 px-6 py-5 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">Control Center</p>
            <h3 className="mt-1 text-xl font-semibold">Notification Settings</h3>
            <p className="mt-1 text-sm text-white/70">
              Tune channels, quiet hours and alert priorities to match your workflow.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close notification settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-8 overflow-y-auto px-6 py-6">
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-primary-900">General</h4>
            <ToggleSetting
              label="Enable notifications"
              checked={localPrefs.enabled}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, enabled: checked })}
            />
            <ToggleSetting
              label="Sound effects"
              checked={localPrefs.sound_enabled}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, sound_enabled: checked })}
            />
            <ToggleSetting
              label="Desktop notifications"
              checked={localPrefs.desktop_enabled}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, desktop_enabled: checked })}
            />
            <ToggleSetting
              label="Email notifications"
              checked={localPrefs.email_enabled}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, email_enabled: checked })}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-primary-900">Notification types</h4>
            <ToggleSetting
              label="🔥 Hot leads (Score 9-10)"
              checked={localPrefs.hot_leads}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, hot_leads: checked })}
            />
            <ToggleSetting
              label="✨ New leads"
              checked={localPrefs.new_leads}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, new_leads: checked })}
            />
            <ToggleSetting
              label="💬 Lead interactions"
              checked={localPrefs.interactions}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, interactions: checked })}
            />
            <ToggleSetting
              label="📊 Score changes"
              checked={localPrefs.score_changes}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, score_changes: checked })}
            />
            <ToggleSetting
              label="📅 Meetings"
              checked={localPrefs.meetings}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, meetings: checked })}
            />
            <ToggleSetting
              label="💰 Payments"
              checked={localPrefs.payments}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, payments: checked })}
            />
            <ToggleSetting
              label="💬 Messages"
              checked={localPrefs.messages}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, messages: checked })}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-primary-900">Quiet hours</h4>
            <ToggleSetting
              label="Enable quiet hours"
              checked={localPrefs.quiet_hours_enabled}
              onChange={(checked) => setLocalPrefs({ ...localPrefs, quiet_hours_enabled: checked })}
            />
            {localPrefs.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-primary-50/70 p-4">
                <div>
                  <label className="text-xs font-medium text-primary-700">Start time</label>
                  <input
                    type="time"
                    value={localPrefs.quiet_hours_start}
                    onChange={(event) =>
                      setLocalPrefs({ ...localPrefs, quiet_hours_start: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-900 shadow-inner shadow-primary-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">End time</label>
                  <input
                    type="time"
                    value={localPrefs.quiet_hours_end}
                    onChange={(event) =>
                      setLocalPrefs({ ...localPrefs, quiet_hours_end: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-900 shadow-inner shadow-primary-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center gap-3 border-t border-white/60 bg-white/80 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/40 transition hover:-translate-y-0.5 hover:shadow-primary-500/60"
          >
            Save changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ToggleSetting({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-white/70 px-4 py-3 text-sm text-primary-800 shadow-inner shadow-primary-100">
      <span>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
        aria-pressed={checked}
        type="button"
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow"
          style={{ x: checked ? 20 : 0 }}
        />
      </button>
    </div>
  )
}
