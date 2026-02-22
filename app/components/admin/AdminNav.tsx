'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BarChart3,
  Shield,
  Building2,
  Users,
  Settings,
  Mail,
  Lock,
  ChevronLeft,
  Sparkles,
  HelpCircle,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/properties', label: 'Properties', icon: Building2 },
      { href: '/admin/leads', label: 'Leads', icon: Users },
      { href: '/admin/verify', label: 'Verification', icon: Shield },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/security', label: 'Security', icon: Lock },
    ],
  },
]

const bottomItems: NavItem[] = [
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: HelpCircle },
]

export default function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname?.startsWith(href))

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-[100] w-56 bg-zinc-950 border-r border-zinc-800 hidden lg:flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-zinc-800/70">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-3 group"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Sparkles className="w-4 h-4 text-zinc-950" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-zinc-100 text-sm leading-tight">Tharaga</span>
            <span className="text-red-400/80 text-[10px] font-medium leading-tight">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className={cn(group.label && 'mt-5 first:mt-0')}>
            {group.label && (
              <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all duration-100 group',
                      active
                        ? 'bg-red-500/10 text-zinc-100 border-l-2 border-l-red-400 ml-[-1px]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-l-2 border-l-transparent'
                    )}
                  >
                    <Icon className={cn(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      active ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    )} />
                    <span className="flex-1 font-medium truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Newsletter, Settings, Help */}
      <div className="flex-shrink-0 border-t border-zinc-800/70 px-2 py-2 space-y-0.5">
        {bottomItems.map((item) => {
          const active = pathname?.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all duration-100 group',
                active
                  ? 'bg-red-500/10 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-red-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
              <span className="font-medium truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
