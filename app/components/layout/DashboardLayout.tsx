'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar, type SidebarGroup } from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  sidebarGroups: SidebarGroup[]
  portalLabel?: string
  showSearch?: boolean
  className?: string
}

/**
 * Shared dashboard shell: sidebar + scrollable main content area.
 * Used by builder, buyer, and admin dashboards.
 */
export function DashboardLayout({
  children,
  sidebarGroups,
  portalLabel = 'Dashboard',
  showSearch = true,
  className,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar
        groups={sidebarGroups}
        portalLabel={portalLabel}
        showSearch={showSearch}
      />

      {/* Main content — offset by sidebar width on desktop */}
      <main
        className={cn(
          'lg:ml-60 min-h-screen',
          'transition-[margin] duration-200 ease-out',
          className
        )}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
