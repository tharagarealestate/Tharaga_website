"use client"

import * as React from 'react'
import { Bell } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  metadata: Record<string, any> | null
  created_at: string
}

export default function NotificationPanel() {
  const supabase = React.useMemo(() => getSupabase(), [])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<NotificationRow[]>([])
  const unreadCount = React.useMemo(() => items.reduce((n, it) => n + (it.read ? 0 : 1), 0), [items])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const uid = data.user?.id || null
        if (!cancelled) setUserId(uid)
        if (!uid) return
        setLoading(true)
        const { data: rows } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(10)
        if (!cancelled && rows) setItems(rows as unknown as NotificationRow[])
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [supabase])

  // Realtime subscription for new notifications
  React.useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        const row = payload.new as NotificationRow
        setItems((prev) => [row, ...prev].slice(0, 10))
      })
      .subscribe()
    return () => { try { supabase.removeChannel(channel) } catch {} }
  }, [supabase, userId])

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      if (!error) setItems((prev) => prev.map((it) => it.id === id ? { ...it, read: true } : it))
    } catch {}
  }

  // Register service worker and save push subscription (if permitted)
  React.useEffect(() => {
    if (!userId) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) return

    function urlBase64ToUint8Array(base64String: string) {
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
        const reg = await navigator.serviceWorker.register('/sw.js')
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        try {
          await supabase.from('push_subscriptions').insert({
            user_id: userId,
            subscription: sub as unknown as Record<string, any>,
          })
        } catch (_) { /* ignore duplicate errors */ }
      } catch (_) { /* noop */ }
    })()
  }, [userId, supabase])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-2 text-gray-700 hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] rounded-full bg-primary-600 px-1.5 text-center text-[10px] leading-4 text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-medium">Notifications</div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!userId) return
                  try {
                    await supabase.from('notifications').insert({
                      user_id: userId,
                      type: 'site_visit',
                      title: 'Test notification',
                      message: 'This is a test notification.',
                      metadata: { via: 'panel-test' },
                    })
                  } catch {}
                }}
                className="rounded border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Test
              </button>
              <div className="text-xs text-gray-500">{unreadCount} unread</div>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            {loading && <div className="px-3 py-3 text-sm text-gray-500">Loading...</div>}
            {!loading && items.length === 0 && (
              <div className="px-3 py-3 text-sm text-gray-500">No notifications</div>
            )}
            {!loading && items.map((it) => (
              <button
                key={it.id}
                onClick={() => markAsRead(it.id)}
                className={
                  "block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 " +
                  (it.read ? "text-gray-600" : "text-gray-900")
                }
              >
                <div className="flex items-start gap-2">
                  <div className={"mt-1 h-2 w-2 rounded-full " + (it.read ? 'bg-gray-300' : 'bg-primary-600')}></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.title}</div>
                    <div className="truncate text-xs text-gray-600">{it.message}</div>
                    <div className="mt-0.5 text-[11px] text-gray-400">{new Date(it.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


