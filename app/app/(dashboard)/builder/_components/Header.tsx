"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronDown, CreditCard, LogOut, Search, User } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui'

interface Notification {
  id: string
  title: string
  read?: boolean
  created_at?: string
}

function NotificationPanel({ notifications }: { notifications: Notification[] | undefined }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-600">No new notifications</div>
    )
  }
  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((n) => (
        <div key={n.id} className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-medium text-gray-900">{n.title}</div>
          <div className="text-xs text-gray-500">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
        </div>
      ))}
    </div>
  )
}

export function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [company, setCompany] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/builder/notifications?unread=true', { next: { revalidate: 0 } as any })
        if (res.ok) {
          const data = (await res.json()) as Notification[]
          if (!cancelled) setNotifications(data)
        }
      } catch (_) { /* ignore */ }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  useEffect(() => {
    // Fallback user info via localStorage (since Supabase auth context isn't wired here)
    try {
      const n = localStorage.getItem('thg.userName')
      const c = localStorage.getItem('thg.company')
      if (n) setUserName(n)
      if (c) setCompany(c)
    } catch (_) {}
  }, [])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const initial = (userName || 'B').charAt(0).toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Search className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">Search...</span>
          <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-500">⌘K</kbd>
        </button>

        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <NotificationPanel notifications={notifications} />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-white font-semibold">
                {initial}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-semibold text-gray-900">{userName || 'Builder'}</div>
                <div className="text-xs text-gray-500">{company || 'Company'}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/builder/settings/profile">
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/builder/settings/billing">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { /* signOut placeholder */ localStorage.removeItem('thg.userName'); location.href = '/' }}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
