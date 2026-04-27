import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cache client instances to avoid multiple GoTrueClient instances
let clientInstance: SupabaseClient | null = null

// The canonical Supabase project URL — used to validate window.supabase
const EXPECTED_SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co'

export function getSupabase(): SupabaseClient {
  if (typeof window !== 'undefined') {
    // ONLY reuse window.supabase if it was created for OUR project URL.
    // auth-gate.js and other legacy scripts set window.supabase using a CDN
    // supabase-js client. If that client is misconfigured, has stale auth state,
    // or different options, it can cause silent auth hangs in the dashboard.
    // We validate the URL to prevent a poisoned CDN client from being used.
    const winSupa = (window as any).supabase
    if (
      winSupa &&
      winSupa.auth &&
      typeof winSupa.supabaseUrl === 'string' &&
      winSupa.supabaseUrl.startsWith(EXPECTED_SUPABASE_URL)
    ) {
      return winSupa
    }

    // Return our own cached instance if already created
    if (clientInstance) {
      return clientInstance
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  // Prefer anon/public keys. On server, gracefully fall back to service role if anon is missing.
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!key && typeof window === 'undefined') {
    key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
  }

  if (!url || !key) {
    const missingVars = []
    if (!url) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!key) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.error(`[Supabase Init Error] Missing environment variables: ${missingVars.join(', ')}`)
    throw new Error(`Supabase initialization failed: Missing ${missingVars.join(', ')}`)
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })

  // Cache on client-side and expose as window.supabase for auth-gate.js compatibility
  if (typeof window !== 'undefined') {
    clientInstance = client
    // Expose as window.supabase so auth-gate.js reuses OUR properly configured client
    // instead of creating its own CDN-loaded instance
    ;(window as any).supabase = client
  }

  return client
}
