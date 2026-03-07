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
    <nav className="mobile-bottom-nav md:hidden">
      <ul>
        {tabs.map(({ href, icon: Icon, label }) => {
          // Check exact match first, then check if pathname starts with href
          // But prioritize more specific routes (e.g., /builder/leads/pipeline over /builder/leads)
          const exactMatch = pathname === href
          const startsWithMatch = href !== '/' && pathname.startsWith(href)
          // For nested routes, only match if no more specific route matches
          const moreSpecificMatch = tabs.some(t => 
            t.href !== href && 
            t.href.startsWith(href) && 
            pathname.startsWith(t.href)
          )
          const active = exactMatch || (startsWithMatch && !moreSpecificMatch)
          return (
            <li key={href}>
              <Link 
                href={href} 
                className={active ? 'active' : ''}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


