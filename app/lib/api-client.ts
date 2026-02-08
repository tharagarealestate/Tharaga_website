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
    const { data: { session }, error } = await supabase.auth.getSession()
    
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
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
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