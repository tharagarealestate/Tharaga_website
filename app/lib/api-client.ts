/**
 * API Client Utility - Handles authentication for API requests
 *
 * CRITICAL: Supabase client-side uses localStorage, not cookies.
 * We need to extract the session token and send it as Authorization header.
 */

import { getSupabase } from './supabase'

/**
 * Get the current session token from Supabase
 * Returns null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = getSupabase()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.access_token) {
      console.warn('[API Client] No session token available:', error?.message)
      return null
    }

    return session.access_token
  } catch (error) {
    console.error('[API Client] Error getting auth token:', error)
    return null
  }
}

/**
 * Fetch with automatic authentication
 * Automatically includes Authorization header if user is authenticated
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get auth token
  const token = await getAuthToken()

  // Prepare headers
  const headers = new Headers(options.headers || {})

  // Add auth token if available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Ensure Content-Type is set for POST/PUT requests
  if (!headers.has('Content-Type') && (options.method === 'POST' || options.method === 'PUT')) {
    headers.set('Content-Type', 'application/json')
  }

  // Merge with existing options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Still include cookies (for other cookies)
  }

  return fetch(url, fetchOptions)
}

/**
 * Create authenticated fetch wrapper for specific endpoints
 */
export function createAuthenticatedFetcher(baseUrl: string = '') {
  return async (endpoint: string, options: RequestInit = {}) => {
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint
    return authenticatedFetch(url, options)
  }
}

/**
 * Read a cookie value in the browser safely
 * Returns null on the server or if the cookie does not exist.
 * 
 * @param name - Cookie name to read
 * @returns Cookie value or null if not found or on server
 */
export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    // Server-side render: cookies are not available in this utility
    return null
  }

  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${encodeURIComponent(name)}=`))

  if (!match) return null

  try {
    return decodeURIComponent(match.split('=')[1] ?? '')
  } catch {
    return null
  }
}

/**
 * Client-side helper for fetching property recommendations.
 * Used by the RecommendationsCarousel for a single retry on the client.
 * 
 * @param params - Recommendation request parameters
 * @param params.session_id - Session ID for tracking
 * @param params.num_results - Optional number of results to fetch
 * @returns Promise resolving to recommendations data
 */
export async function fetchRecommendationsClient(params: {
  session_id: string
  num_results?: number
}): Promise<{ items: unknown[] }> {
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.status}`)
  }

  return response.json()
}

// Explicit re-exports to ensure webpack can resolve them during build
export { readCookie, fetchRecommendationsClient }

