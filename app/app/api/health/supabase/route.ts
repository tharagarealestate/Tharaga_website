import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  const result: Record<string, any> = {
    env: {
      urlPresent: !!url,
      anonPresent: !!anon,
      servicePresent: !!service,
    },
    connectivity: {},
  }

  try {
    if (url && (anon || service)) {
      const client = createClient(url, service || anon)
      // Try a HEAD-like select to avoid returning data; report status/error
      try {
        const { error, status } = await client
          .from('notifications')
          .select('*', { head: true, count: 'exact' })
          .limit(0)
        result.connectivity.notificationsHeadStatus = status
        result.connectivity.notificationsError = error ? String(error.message || error) : null
      } catch (e) {
        result.connectivity.notificationsHeadException = String(e)
      }

      // Auth call: not expecting user on server; just checks client wiring
      try {
        const { data, error } = await client.auth.getUser()
        result.connectivity.authGetUserOk = !error
        result.connectivity.authGetUserError = error ? String(error.message || error) : null
        result.connectivity.hasUser = !!data?.user
      } catch (e) {
        result.connectivity.authGetUserException = String(e)
      }
    }
  } catch (e) {
    result.error = String(e)
  }

  return NextResponse.json(result, { status: 200 })
}


