"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, Users, KanbanSquare, Settings } from 'lucide-react'

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/properties', icon: Building2, label: 'Properties' },
  { href: '/builder/leads', icon: Users, label: 'Leads' },
  { href: '/builder/leads/pipeline', icon: KanbanSquare, label: 'Pipeline' },
  { href: '/builder/settings', icon: Settings, label: 'Settings' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <li key={href} className="text-center">
              <Link href={href} className="flex flex-col items-center justify-center py-2">
                <Icon className={"h-5 w-5 " + (active ? 'text-[rgb(var(--gold-500))]' : 'text-gray-500')} />
                <span className={"text-[10px] font-medium " + (active ? 'text-[rgb(var(--gold-500))] font-bold' : 'text-gray-500')}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


