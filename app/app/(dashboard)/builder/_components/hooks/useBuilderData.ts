"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useBuilderAuth } from '../BuilderAuthProvider'

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
 * Pass a URL and it fetches data with credentials, handles errors gracefully.
 */
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
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)
  const fetchCountRef = useRef(0)

  const enabled = options?.enabled !== false
  const method = options?.method || 'GET'
  const refreshInterval = options?.refreshInterval || 0

  const fetchData = useCallback(async () => {
    if (!url || !isAuthenticated || authLoading || !enabled) return

    const fetchId = ++fetchCountRef.current

    try {
      const fetchOptions: RequestInit = {
        method,
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }

      if (method === 'POST' && options?.body) {
        fetchOptions.body = JSON.stringify(options.body)
      }

      const res = await fetch(url, fetchOptions)

      // Only update if this is still the latest fetch
      if (!mountedRef.current || fetchId !== fetchCountRef.current) return

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      if (!mountedRef.current || fetchId !== fetchCountRef.current) return
      console.error(`[useRealtimeData] ${url}:`, err.message)
      setError(err.message)
      if (options?.fallback !== undefined) {
        setData(options.fallback as T)
      }
    } finally {
      if (mountedRef.current && fetchId === fetchCountRef.current) {
        setIsLoading(false)
      }
    }
  }, [url, isAuthenticated, authLoading, enabled, method, options?.body, options?.fallback])

  useEffect(() => {
    mountedRef.current = true
    setIsLoading(true)
    fetchData()

    let interval: ReturnType<typeof setInterval> | null = null
    if (refreshInterval > 0) {
      interval = setInterval(fetchData, refreshInterval)
    }

    return () => {
      mountedRef.current = false
      if (interval) clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  const refetch = useCallback(() => {
    setIsLoading(true)
    fetchData()
  }, [fetchData])

  return { data, error, isLoading: isLoading || authLoading, refetch }
}

/**
 * Format Indian Rupee values for display
 */
export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Format relative time
 */
export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
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
