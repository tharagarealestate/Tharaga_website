/**
 * Shared auth utility for all builder API routes.
 *
 * PROBLEM: The frontend stores Supabase sessions in localStorage (via getSupabase()).
 * Server-side `createRouteHandlerClient({ cookies })` reads HTTP cookies — a different
 * storage mechanism — so it always returns null, causing 401s for all builder APIs.
 *
 * SOLUTION: Frontend sends `Authorization: Bearer <token>` header with every request.
 * This utility validates the Bearer token using the service role client (no cookie needed).
 * Falls back to cookie-based auth for any legacy callers.
 */

import { NextRequest } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const ADMIN_EMAIL = 'tharagarealestate@gmail.com'

export function getServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export interface AuthedUser {
  user: { id: string; email: string | undefined }
  isAdmin: boolean
  serviceClient: SupabaseClient
}

/**
 * Resolves the authenticated user from either:
 * 1. `Authorization: Bearer <token>` header  (localStorage-based sessions — primary)
 * 2. HTTP cookie session                      (cookie-based sessions — fallback)
 *
 * Returns null if neither method yields a valid user.
 */
export async function getBuilderUser(req: NextRequest): Promise<AuthedUser | null> {
  const serviceClient = getServiceSupabase()

  // ── 1. Bearer token (localStorage sessions sent by useRealtimeData) ──────────
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearerToken) {
    try {
      const { data: { user }, error } = await serviceClient.auth.getUser(bearerToken)
      if (!error && user) {
        return {
          user: { id: user.id, email: user.email },
          isAdmin: (user.email || '') === ADMIN_EMAIL,
          serviceClient,
        }
      }
    } catch {
      // fall through to cookie auth
    }
  }

  // ── 2. Cookie-based auth (fallback for SSR / legacy callers) ─────────────────
  try {
    const cookieClient = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await cookieClient.auth.getUser()
    if (!error && user) {
      return {
        user: { id: user.id, email: user.email },
        isAdmin: (user.email || '') === ADMIN_EMAIL,
        serviceClient,
      }
    }
  } catch {
    // both methods failed
  }

  return null
}
