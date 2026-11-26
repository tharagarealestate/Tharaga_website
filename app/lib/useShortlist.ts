'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { getSupabase } from '@/lib/supabase'
import { currentAuthUser, onAuthChange } from '@/lib/useAuthUser'
import { requireSignInToSave } from '@/lib/propertyAccess'

const KEY = 'tharaga.shortlist.v1'

/* A single shortlist store shared by every component on the page (header badge, cards,
   drawer). It lives in localStorage, follows other tabs, and — when the visitor is signed
   in — is merged into their account so it follows them to any device. */

let items: string[] = []
let loaded = false
let syncedFor: string | null = null
const listeners = new Set<() => void>()

const emit = () => listeners.forEach(l => l())

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) items = JSON.parse(raw)
  } catch {}
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return
    try {
      items = e.newValue ? JSON.parse(e.newValue) : []
      emit()
    } catch {}
  })
  onAuthChange(syncWithAccount)
  syncWithAccount()
}

function persist(push = true) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
  emit()
  if (push) pushToAccount()
}

async function pushToAccount() {
  const u = currentAuthUser()
  if (!u) return
  try {
    await getSupabase().auth.updateUser({ data: { shortlist: items } })
  } catch {}
}

/** On sign-in: union the account's saved list with this browser's, then save both ways. */
function syncWithAccount() {
  const u = currentAuthUser()
  if (!u || syncedFor === u.id) return
  syncedFor = u.id
  const remote: string[] = Array.isArray(u.raw?.user_metadata?.shortlist) ? u.raw.user_metadata.shortlist : []
  const merged = Array.from(new Set([...items, ...remote]))
  const changed = merged.length !== items.length || merged.length !== remote.length
  items = merged
  persist(changed)
}

const subscribe = (l: () => void) => {
  load()
  listeners.add(l)
  return () => listeners.delete(l)
}
const snap = () => items
const EMPTY: string[] = []
const serverSnap = () => EMPTY

export function useShortlist() {
  const list = useSyncExternalStore(subscribe, snap, serverSnap)
  const toggle = useCallback((slug: string) => {
    // Adding needs an account (removing never does).
    if (!items.includes(slug) && !requireSignInToSave()) return
    items = items.includes(slug) ? items.filter(s => s !== slug) : [...items, slug]
    persist()
  }, [])
  const clear = useCallback(() => {
    items = []
    persist()
  }, [])
  return { items: list, has: (slug: string) => list.includes(slug), toggle, clear }
}
