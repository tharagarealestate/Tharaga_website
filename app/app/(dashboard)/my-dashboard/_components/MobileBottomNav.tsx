"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, CalendarDays, User2 } from 'lucide-react'
import { listSaved } from '@/lib/saved'
import { getSupabase } from '@/lib/supabase'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const savedCount = useSavedCount()
  const visitsCount = useVisitsCount()

  const tabs = [
    { href: '/my-dashboard', label: 'Home', icon: Home },
    { href: '/property-listing/', label: 'Search', icon: Search },
    { href: '/saved', label: 'Saved', icon: Heart },
    { href: '#', label: 'Visits', icon: CalendarDays },
    { href: '/login', label: 'Profile', icon: User2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white/95 px-2 py-1 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <li key={href} className="relative">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center rounded-md px-2 py-1 text-[11px] ${active ? 'text-primary-600' : 'text-gray-600'}`}
              >
                <Icon className={`h-5 w-5 ${label === 'Saved' ? 'text-gold-500' : ''}`} />
                <span>{label}</span>
                {label === 'Saved' && savedCount > 0 && (
                  <span className="absolute -top-1 right-4 min-w-[1.1rem] rounded-full bg-primary-600 px-1.5 text-center text-[10px] leading-4 text-white">{savedCount}</span>
                )}
                {label === 'Visits' && visitsCount > 0 && (
                  <span className="absolute -top-1 right-4 min-w-[1.1rem] rounded-full bg-primary-600 px-1.5 text-center text-[10px] leading-4 text-white">{visitsCount}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function useSavedCount() {
  const [count, setCount] = React.useState<number>(() => (typeof window !== 'undefined' ? listSaved().length : 0))
  React.useEffect(() => {
    function refresh() {
      try { setCount(listSaved().length) } catch {}
    }
    const onStorage = (e: StorageEvent) => { if (e.key === 'thg_saved_v1') refresh() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    const id = window.setInterval(refresh, 3000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
      window.clearInterval(id)
    }
  }, [])
  return count
}

function useVisitsCount() {
  const [count, setCount] = React.useState<number>(0)
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (!cancelled) setCount(0); return }
        const nowISO = new Date().toISOString()
        let c = 0
        try {
          const { count: c1, error: e1 } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gt('start_time', nowISO)
          if (!e1 && typeof c1 === 'number') c = c1
        } catch {}
        if (c === 0) {
          try {
            const { count: c2, error: e2 } = await supabase
              .from('site_visits')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .gt('visit_date', nowISO)
            if (!e2 && typeof c2 === 'number') c = c2
          } catch {}
        }
        if (!cancelled) setCount(c)
      } catch { if (!cancelled) setCount(0) }
    }
    load()
    const id = window.setInterval(load, 30000)
    return () => { cancelled = true; window.clearInterval(id) }
  }, [])
  return count
}
