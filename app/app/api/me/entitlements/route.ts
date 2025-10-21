import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // Dev stub: grant basic entitlements so UI doesn't 404
  return NextResponse.json({
    tier: 'free',
    entitlements: {
      tier: 'free',
      listingLimit: null,
      monthlyLeadLimit: null,
      features: {
        admin_dashboard: true,
      },
    },
  })
}
