import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Returns entitlements for the current user, derived from Supabase session/profile
export async function GET(_req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  try {
    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    }
  } catch {}

  return NextResponse.json({
    tier: 'free',
    entitlements: {
      tier: 'free',
      listingLimit: null,
      monthlyLeadLimit: null,
      features: {
        admin_dashboard: isAdmin,
      },
    },
  })
}
