import type { ReactNode } from 'react'

export const runtime = 'nodejs'

export default function BuyerDashboardLayout({ children }: { children: ReactNode }) {
  // Authentication handled by middleware - no server-side redirects needed
  return <>{children}</>
}

