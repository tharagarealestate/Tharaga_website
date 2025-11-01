"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Heart } from 'lucide-react'
import { listSaved } from '@/lib/saved'
import { getSupabase } from '@/lib/supabase'
import NotificationPanel from '../../_components/NotificationPanel'

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
        // Try primary table name
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

export default function TopNav() {
  const router = useRouter()
  const savedCount = useSavedCount()
  const visitsCount = useVisitsCount()
  const [query, setQuery] = React.useState('')
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        setUserEmail(user?.email ?? null)
      } catch { setUserEmail(null) }
    })()
  }, [])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    try {
      const key = 'thg_recent_searches'
      const raw = localStorage.getItem(key)
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      const next = [q, ...arr.filter((s) => s !== q)].slice(0, 8)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
    router.push(`/property-listing/?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="sticky top-0 z-40 border-b border-gray-300 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex items-center gap-3 px-4 py-2">
        <Link href="/" className="shrink-0 font-semibold text-gray-900">Tharaga</Link>
        <form onSubmit={handleSearchSubmit} className="flex-1 md:w-2/5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search properties, locations, specs..."
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-600 focus:outline-none"
            aria-label="Search"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/saved" className="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-2 text-gray-700 hover:bg-gray-50">
            <Heart className="h-5 w-5 text-gold-500" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] rounded-full bg-primary-600 px-1.5 text-center text-[10px] leading-4 text-white">{savedCount}</span>
            )}
            <span className="sr-only">Saved</span>
          </Link>
          <Link href="#" className="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-2 text-gray-700 hover:bg-gray-50">
            <CalendarDays className="h-5 w-5" />
            {visitsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] rounded-full bg-primary-600 px-1.5 text-center text-[10px] leading-4 text-white">{visitsCount}</span>
            )}
            <span className="sr-only">Visits</span>
          </Link>
          <NotificationPanel />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {(userEmail || 'U').slice(0, 1).toUpperCase()}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
                <div className="px-3 py-2 text-xs text-gray-500">{userEmail ?? 'Guest'}</div>
                <Link href="/my-dashboard" className="block px-3 py-2 text-sm hover:bg-gray-50">My dashboard</Link>
                <Link href="/saved" className="block px-3 py-2 text-sm hover:bg-gray-50">Saved</Link>
                <button
                  onClick={async () => { try { await getSupabase().auth.signOut() } catch {}; window.location.reload() }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
