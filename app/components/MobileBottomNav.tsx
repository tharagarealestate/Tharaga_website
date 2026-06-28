"use client"
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Home, Building2, Users, Megaphone, Settings } from 'lucide-react'

// Builder dashboard tabs — all link to ?section=X (single-page dashboard pattern)
const BUILDER_TABS = [
  { section: 'overview',    icon: Home,      label: 'Overview'   },
  { section: 'properties',  icon: Building2, label: 'Properties' },
  { section: 'leads',       icon: Users,     label: 'Leads'      },
  { section: 'marketing',   icon: Megaphone, label: 'Marketing'  },
  { section: 'settings',    icon: Settings,  label: 'Settings'   },
]

function MobileBottomNavInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSection = searchParams.get('section') || 'overview'

  // Only render on builder routes
  if (!pathname.startsWith('/builder')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {BUILDER_TABS.map(({ section, icon: Icon, label }) => {
          const isActive = currentSection === section
          return (
            <Link
              key={section}
              href={`/builder?section=${section}`}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-all active:scale-95 touch-manipulation ${
                isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-500 rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  )
}


