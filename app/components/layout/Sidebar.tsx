'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
} from 'lucide-react'

export interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string | null
  onClick?: (e: React.MouseEvent) => void
}

export interface SidebarGroup {
  label?: string
  items: SidebarItem[]
}

interface SidebarProps {
  groups: SidebarGroup[]
  portalLabel?: string
  showSearch?: boolean
  collapsible?: boolean
  className?: string
}

export function Sidebar({
  groups,
  portalLabel = 'Dashboard',
  showSearch = false,
  collapsible = true,
  className,
}: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isActive = useCallback(
    (href: string) => {
      const clean = pathname.replace(/\/$/, '')
      const target = href.replace(/\/$/, '')
      if (clean === target) return true
      // Match section query params
      if (href.includes('?section=')) {
        const section = href.split('?section=')[1]?.split('&')[0]
        if (typeof window !== 'undefined') {
          const current = new URLSearchParams(window.location.search).get('section')
          return current === section
        }
      }
      return false
    },
    [pathname]
  )

  const filteredGroups = searchQuery.trim()
    ? groups
        .map((g) => ({
          ...g,
          items: g.items.filter((i) =>
            i.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((g) => g.items.length > 0)
    : groups

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-[100] flex flex-col',
        'bg-zinc-950 border-r border-zinc-800',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-60',
        'hidden lg:flex',
        className
      )}
    >
      {/* Header */}
      <div className={cn('flex-shrink-0 border-b border-zinc-800', collapsed ? 'px-2 py-3' : 'px-4 py-4')}>
        <Link href="/" className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-zinc-950" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-zinc-100 leading-tight">Tharaga</span>
              <span className="text-[10px] font-medium text-amber-400 leading-tight">{portalLabel}</span>
            </div>
          )}
        </Link>

        {/* Search */}
        {showSearch && !collapsed && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
        {filteredGroups.map((group, gi) => (
          <div key={gi} className={cn(group.label && 'mb-2')}>
            {group.label && !collapsed && (
              <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-100',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-amber-500/10 text-zinc-100 border-l-2 border-amber-500'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border-l-2 border-transparent'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      active ? 'text-amber-400' : 'text-zinc-500'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      {item.badge != null && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      {collapsible && (
        <div className="flex-shrink-0 border-t border-zinc-800 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  )
}
