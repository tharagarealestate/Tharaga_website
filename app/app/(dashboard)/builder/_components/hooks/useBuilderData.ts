"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useBuilderAuth } from '../BuilderAuthProvider'
import { getSupabase } from '@/lib/supabase'

/**
 * Shared hook for real-time Supabase data fetching across all dashboard sections.
 * Handles admin vs builder context automatically.
 *
 * - Builder: sees only their own data (filtered by builder_id)
 * - Admin (tharagarealestate@gmail.com): sees ALL builders' data
 */

export interface BuilderDataContext {
  builderId: string | null
  userId: string | null
  isAdmin: boolean
  isAuthenticated: boolean
  isLoading: boolean
  companyName: string
  email: string | null
}

export function useBuilderDataContext(): BuilderDataContext {
  const { isAuthenticated, isLoading, builderId, userId, builderProfile } = useBuilderAuth()

  const email = builderProfile?.email || null
  const isAdmin = email === 'tharagarealestate@gmail.com'
  const companyName = builderProfile?.company_name || (isAdmin ? 'Tharaga Admin' : 'Builder')

  return {
    builderId,
    userId,
    isAdmin,
    isAuthenticated,
    isLoading,
    companyName,
    email,
  }
}

/**
 * Generic data fetcher with auto-refresh, error handling, and auth context.
 *
 * KEY DESIGN: Loading state ALWAYS resolves. Never hangs.
 * - If auth is not ready: isLoading = false, data = null (component shows empty state)
 * - If fetch fails: isLoading = false, error set, data = fallback
 * - Fetch timeout: 10 seconds max per request
 */
// ── localStorage stale-while-revalidate cache ─────────────────────────────────
// Key: derived from the URL with cache-busting params stripped (_r=..., _t=...).
// TTL: 10 minutes. On re-login the user sees the previous data INSTANTLY while
// fresh data loads in the background — eliminates Netlify cold-start wait.

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function cacheKey(url: string): string {
  // Strip cache-busting query params so the same endpoint always hits the same key
  try {
    const u = new URL(url, 'https://x')
    u.searchParams.delete('_r')
    u.searchParams.delete('_t')
    u.searchParams.delete('_ts')
    return `__tharaga_swr_${u.pathname}${u.search}`
  } catch {
    return `__tharaga_swr_${url}`
  }
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data as T
  } catch { return null }
}

function writeCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch {} // ignore QuotaExceededError silently
}

export function useRealtimeData<T>(
  url: string | null,
  options?: {
    refreshInterval?: number  // ms, default 0 (no auto-refresh)
    method?: 'GET' | 'POST'
    body?: any
    enabled?: boolean         // default true
    fallback?: T              // fallback value on error
  }
) {
  const { isAuthenticated, isLoading: authLoading } = useBuilderAuth()
  const [data, setData] = useState<T | null>(() => {
    // Seed from cache synchronously on mount — INSTANT content on re-login
    if (typeof window === 'undefined' || !url) return null
    return readCache<T>(cacheKey(url))
  })
  const [error, setError] = useState<string | null>(null)
  // If we already have cached data, start with isLoading=false so no spinner flicker
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined' || !url) return true
    return readCache<T>(cacheKey(url)) === null
  })
  const mountedRef = useRef(true)
  const fetchCountRef = useRef(0)
  const hasResolvedRef = useRef(false)

  const enabled = options?.enabled !== false
  const method = options?.method || 'GET'
  const refreshInterval = options?.refreshInterval || 0
  const bodyStr = options?.body ? JSON.stringify(options.body) : undefined

  const fetchData = useCallback(async () => {
    if (!url || !enabled) { setIsLoading(false); return }
    if (authLoading) return  // re-triggers when authLoading changes
    if (!isAuthenticated) { setIsLoading(false); return }

    const fetchId = ++fetchCountRef.current

    try {
      // Read access token from localStorage — instant, no network
      let accessToken: string | null = null
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        accessToken = session?.access_token || null
      } catch {}

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const fetchOptions: RequestInit = {
        method,
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        signal: controller.signal,
      }
      if (method === 'POST' && bodyStr) fetchOptions.body = bodyStr

      const res = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      if (!mountedRef.current || fetchId !== fetchCountRef.current) return
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()

      // Write to cache then update state
      if (url) writeCache(cacheKey(url), json)
      setData(json)
      setError(null)
      hasResolvedRef.current = true
    } catch (err: any) {
      if (!mountedRef.current || fetchId !== fetchCountRef.current) return
      if (err.name !== 'AbortError') {
        console.warn(`[useRealtimeData] ${url}: ${err.message}`)
      }
      setError(err.message)
      if (!hasResolvedRef.current && options?.fallback !== undefined) {
        setData(options.fallback as T)
      }
    } finally {
      if (mountedRef.current && fetchId === fetchCountRef.current) {
        setIsLoading(false)
      }
    }
  }, [url, isAuthenticated, authLoading, enabled, method, bodyStr])

  useEffect(() => {
    mountedRef.current = true
    // Only show loading spinner on initial load if there is no cached data
    if (!hasResolvedRef.current && data === null) setIsLoading(true)

    fetchData()

    let interval: ReturnType<typeof setInterval> | null = null
    if (refreshInterval > 0 && isAuthenticated && !authLoading) {
      interval = setInterval(fetchData, refreshInterval)
    }
    return () => {
      mountedRef.current = false
      if (interval) clearInterval(interval)
    }
  }, [fetchData, refreshInterval, isAuthenticated, authLoading])

  const refetch = useCallback(() => { fetchData() }, [fetchData])

  return { data, error, isLoading, refetch }
}

/**
 * Format Indian Rupee values for display
 */
export function formatINR(amount: number): string {
  if (!amount || isNaN(amount)) return '₹0'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Format relative time
 */
export function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}
