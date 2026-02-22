'use client'

import BuilderDashboardClient from './BuilderDashboardClient'

/**
 * Builder Dashboard - Direct Render (No Blocking)
 *
 * CRITICAL: Removed dynamic import and Suspense to prevent delays
 * The component itself has guaranteed timeout - renders in ≤2 seconds
 */
export default function BuilderDashboardPage() {
  return <BuilderDashboardClient />
}
