import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const LISTING_BUCKET = 'listing-media'
export const MAX_FILES = 15
export const MAX_FILE_BYTES = 100 * 1024 * 1024

export const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf',
]

export const STAGES = [
  { key: 'received', label: 'Listing received' },
  { key: 'in_review', label: 'Desk review & title check' },
  { key: 'verified', label: 'Verified' },
  { key: 'buyer_matching', label: 'Private buyer matching' },
  { key: 'visits', label: 'Site visits & negotiation' },
  { key: 'closed', label: 'Closed' },
] as const

/** Service-role client: server only. Never fall back to the anon key for writes. */
export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) throw new Error('Listing service is not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Resolve the signed-in user from a Bearer token, or null. */
export async function userFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  if (!token) return null
  try {
    const { data, error } = await serviceClient().auth.getUser(token)
    if (error) return null
    return data.user
  } catch {
    return null
  }
}

export function safeFileName(name: string) {
  const dot = name.lastIndexOf('.')
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) : ''
  const base = (dot > -1 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file'
  return ext ? `${base}.${ext}` : base
}

export function makeReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = ''
  for (let i = 0; i < 6; i++) r += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `TH-${r}`
}
