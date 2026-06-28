'use client'

/**
 * PropertySectionNav — Supabase-inspired sticky section navigation
 * Anchored scroll navigation with IntersectionObserver active tracking.
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'details',      label: 'Details'          },
  { id: 'intelligence', label: 'AI Intelligence'  },
  { id: 'finance',      label: 'Finance'          },
  { id: 'location',     label: 'Location'         },
  { id: 'reviews',      label: 'Builder & Reviews'},
]

export default function PropertySectionNav() {
  const [active, setActive] = useState(SECTIONS[0].id)

  useEffect(() => {
    const els = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    )

    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="sticky top-16 z-30 backdrop-blur-xl bg-zinc-950/88 border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="flex gap-0.5 overflow-x-auto py-1.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SECTIONS.map(s => {
            const isActive = s.id === active
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  'relative flex-shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-amber-300 bg-amber-500/10'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]',
                )}
              >
                {s.label}
                {isActive && (
                  <span className="absolute bottom-[3px] left-3.5 right-3.5 h-[2px] bg-amber-500/50 rounded-full" />
                )}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
