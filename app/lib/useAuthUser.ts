'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { getSupabase } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string
  initials: string
  raw: any
}

/* One shared auth store for the whole app, so the header, owner panel, shortlist and
   enquiry forms all see the same signed-in state without each subscribing separately. */

type State = { user: AuthUser | null; ready: boolean }
let state: State = { user: null, ready: false }
const listeners = new Set<() => void>()
let started = false

function toUser(u: any): AuthUser | null {
  if (!u) return null
  const name: string =
    u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? String(u.email).split('@')[0] : 'Member')
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'T'
  return {
    id: u.id,
    email: u.email || '',
    name,
    avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
    initials,
    raw: u,
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach(l => l())
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  // Instant paint from the cached session, then confirm with Supabase.
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    const raw = key && localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      const fresh = !parsed?.expires_at || parsed.expires_at * 1000 > Date.now()
      if (fresh && parsed?.user) set({ user: toUser(parsed.user) })
    }
  } catch {}
  try {
    const supabase = getSupabase()
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        set({ user: toUser(data.session?.user), ready: true })
        // The cached session can hold a bare user (no name/photo) — fetch the full profile.
        if (data.session) {
          const { data: full } = await supabase.auth.getUser()
          if (full?.user) set({ user: toUser(full.user) })
        }
      })
      .catch(() => set({ ready: true }))
    supabase.auth.onAuthStateChange((_e, session) => set({ user: toUser(session?.user), ready: true }))
  } catch {
    set({ ready: true })
  }
}

const subscribe = (l: () => void) => {
  start()
  listeners.add(l)
  return () => listeners.delete(l)
}
const getSnapshot = () => state
const getServerSnapshot = () => state

export function useAuthUser() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useEffect(() => start(), [])
  const signOut = useCallback(async () => {
    set({ user: null })
    try {
      await getSupabase().auth.signOut()
    } catch {}
  }, [])
  return { user: s.user, ready: s.ready, signOut }
}

/** Non-hook access for stores that need the current user (e.g. shortlist sync). */
export function currentAuthUser() {
  start()
  return state.user
}
export function onAuthChange(l: () => void) {
  return subscribe(l)
}
