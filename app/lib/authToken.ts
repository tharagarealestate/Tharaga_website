'use client'

import { getSupabase } from '@/lib/supabase'

/**
 * Returns a usable access token without ever hanging the UI.
 * 1. A fresh cached token from storage (instant).
 * 2. Otherwise ask Supabase (which refreshes), capped at 6 seconds.
 */
export async function getAccessToken(): Promise<string> {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    const raw = key && localStorage.getItem(key)
    if (raw) {
      const s = JSON.parse(raw)
      if (s?.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now() + 60_000)) return s.access_token
    }
  } catch {}
  try {
    const res: any = await Promise.race([
      getSupabase().auth.getSession(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
    ])
    return res?.data?.session?.access_token || ''
  } catch {
    return ''
  }
}
