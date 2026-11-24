'use client'

import type { ReactNode } from 'react'
import type { Badge } from '@/lib/mandates'

/** SVG fractal-noise grain. Sits above imagery for analogue depth. */
const NOISE_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export function Grain({ opacity = 0.14 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{ backgroundImage: NOISE_SVG, opacity }}
    />
  )
}

/** Thin gold rule used between sections. */
export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`max-w-7xl mx-auto px-5 sm:px-8 ${className}`}>
      <div className="relative border-t border-[#B0834A]/30">
        <span className="absolute left-1/2 -top-[4px] -translate-x-1/2 w-2 h-2 rotate-45 bg-[#F7F3EC] border border-[#B0834A]/60" />
      </div>
    </div>
  )
}

/** Minimal ghost CTA with a gold underline that slides in on hover. */
export function EnquireLink({
  href,
  children = 'Enquire',
  tone = 'dark',
  onClick,
  external = true,
}: {
  href: string
  children?: ReactNode
  tone?: 'dark' | 'light'
  onClick?: (e: React.MouseEvent) => void
  external?: boolean
}) {
  const color = tone === 'dark' ? 'text-[#15213A] hover:text-[#15213A]' : 'text-[#F7F3EC] hover:text-[#F7F3EC]'
  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={`group/cta relative inline-flex items-center gap-2 py-1.5 font-sans text-[10.5px] uppercase tracking-[0.3em] ${color}`}
    >
      <span>{children}</span>
      <span aria-hidden className="transition-transform duration-500 group-hover/cta:translate-x-1">→</span>
      <span
        aria-hidden
        className="absolute left-0 -bottom-px h-px w-full origin-left scale-x-0 bg-[#B0834A] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:scale-x-100"
      />
    </a>
  )
}

export function BadgeTag({ badge, onDark = false }: { badge: Badge; onDark?: boolean }) {
  if (badge.kind === 'scarcity') {
    return (
      <span className="inline-flex items-center gap-2 bg-[#B0834A] px-3 py-[5px] text-[9.5px] font-sans font-medium uppercase tracking-[0.24em] text-[#FBF7F0]">
        <span className="h-1.5 w-1.5 rotate-45 bg-[#FBF7F0]" />
        {badge.label}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-[5px] text-[9.5px] font-sans uppercase tracking-[0.24em] ${
        onDark ? 'border-[#E6C9A0]/60 bg-[#0E1729]/45 text-[#F0E2CC]' : 'border-[#B0834A]/50 bg-[#F7F3EC] text-[#7C5230]'
      }`}
    >
      {badge.label}
    </span>
  )
}

/** Section eyebrow: a roman numeral, a copper rule and a spaced label. */
export function Eyebrow({ numeral, children, light = false }: { numeral?: string; children: ReactNode; light?: boolean }) {
  return (
    <p className={`flex items-center gap-4 font-sans text-[10.5px] uppercase tracking-[0.36em] ${light ? 'text-[#E6C9A0]' : 'text-[#94643A]'}`}>
      {numeral && <span className="font-display text-[13px] tracking-[0.1em]">{numeral}<span className="sr-only">. </span></span>}
      <span className={`h-px w-10 ${light ? 'bg-[#E6C9A0]/70' : 'bg-[#B0834A]'}`} />
      {children}
    </p>
  )
}

export function StatPills({ stats, onDark = false }: { stats: string[]; onDark?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {stats.map(s => (
        <li
          key={s}
          className={`shrink-0 whitespace-nowrap border px-3 py-[5px] text-[10px] font-sans uppercase tracking-[0.16em] ${
            onDark ? 'border-white/25 text-white/85' : 'border-[#D6CAB5] text-[#4A5163]'
          }`}
        >
          {s}
        </li>
      ))}
    </ul>
  )
}

export const EASE = [0.22, 1, 0.36, 1] as const
