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
      <div className="relative border-t border-[#C5A059]/30">
        <span className="absolute left-1/2 -top-[4px] -translate-x-1/2 w-2 h-2 rotate-45 bg-[#FAF8F5] border border-[#C5A059]/60" />
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
  const color = tone === 'dark' ? 'text-[#1A1816]' : 'text-[#FAF8F5]'
  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={`group/cta relative inline-flex items-center gap-2 py-1.5 font-sans text-[11px] uppercase tracking-[0.28em] ${color}`}
    >
      <span>{children}</span>
      <span aria-hidden className="transition-transform duration-500 group-hover/cta:translate-x-1">→</span>
      <span
        aria-hidden
        className="absolute left-0 -bottom-px h-px w-full origin-left scale-x-0 bg-[#C5A059] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:scale-x-100"
      />
    </a>
  )
}

export function BadgeTag({ badge, onDark = false }: { badge: Badge; onDark?: boolean }) {
  if (badge.kind === 'scarcity') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#1A1816]/85 backdrop-blur-sm px-3 py-1 text-[10px] font-sans uppercase tracking-[0.22em] text-[#E9D3A4]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C5A059] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
        </span>
        {badge.label}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-sans uppercase tracking-[0.22em] backdrop-blur-sm border ${
        onDark
          ? 'border-[#C5A059]/50 bg-[#1A1816]/40 text-[#F1E6CF]'
          : 'border-[#C5A059]/50 bg-[#FAF8F5]/85 text-[#7A5B32]'
      }`}
    >
      {badge.label}
    </span>
  )
}

export function StatPills({ stats, onDark = false }: { stats: string[]; onDark?: boolean }) {
  return (
    <ul className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
      {stats.map(s => (
        <li
          key={s}
          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-sans tracking-wide ${
            onDark ? 'border-white/25 text-white/85' : 'border-[#E8E2D6] bg-[#FAF8F5] text-[#5A564F]'
          }`}
        >
          {s}
        </li>
      ))}
    </ul>
  )
}

export const EASE = [0.22, 1, 0.36, 1] as const
