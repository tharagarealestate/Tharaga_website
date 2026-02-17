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
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/verify', label: 'Verification', icon: Shield },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/security', label: 'Security', icon: Lock },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-[100] w-56 bg-zinc-950 border-r border-zinc-800 hidden lg:flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-zinc-800">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>HOME</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-zinc-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-100 leading-tight">Tharaga</span>
            <span className="text-[10px] font-medium text-red-400 leading-tight">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-100',
                isActive
                  ? 'bg-amber-500/10 text-zinc-100 border-l-2 border-amber-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border-l-2 border-transparent'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-amber-400' : 'text-zinc-500')} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
