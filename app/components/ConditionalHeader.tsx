"use client"

import { usePathname } from 'next/navigation'
import StaticHeaderHTML from './StaticHeaderHTML'

export default function ConditionalHeader() {
  const pathname = usePathname()

  // Hide header on dashboard routes (builder, my-dashboard, admin, buyer)
  const isDashboardRoute = pathname.startsWith('/builder') ||
                          pathname.startsWith('/my-dashboard') ||
                          pathname.startsWith('/admin') ||
                          pathname.startsWith('/buyer')

  // Show header on all pages except dashboards
  if (!isDashboardRoute) {
    return <StaticHeaderHTML />
  }

  // Hide header on dashboard pages
  return null
}



