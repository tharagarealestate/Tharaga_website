import Image from 'next/image'

/**
 * Official Tharaga logo (ornamental emblem, THARAGA wordmark, roots; full lockup adds the
 * ruled diamond and GROUP). Cut out from the master artwork onto transparent backgrounds:
 *   navy  — navy wordmark + copper line-art, for ivory surfaces
 *   ivory — ivory wordmark + light-copper line-art, for navy / photographic surfaces
 */
const SRC = {
  mark: { navy: '/brand/tharaga-mark-navy.png', ivory: '/brand/tharaga-mark-ivory.png', w: 900, h: 648 },
  full: { navy: '/brand/tharaga-full-navy.png', ivory: '/brand/tharaga-full-ivory.png', w: 1000, h: 918 },
}

type Tone = 'navy' | 'ivory'

/**
 * Renders the logo at a given height. Both tones are stacked and the active one fades in,
 * so the header can switch from ivory (over the hero) to navy (on scroll) without a flash.
 */
export function TharagaWordmark({
  tone = 'navy',
  variant = 'mark',
  height = 56,
  priority = false,
  className = '',
}: {
  tone?: Tone
  variant?: 'mark' | 'full'
  height?: number
  priority?: boolean
  className?: string
}) {
  const s = SRC[variant]
  const width = Math.round((s.w / s.h) * height)
  return (
    <span
      className={`relative inline-block transition-[width,height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      style={{ width, height }}
    >
      {(['navy', 'ivory'] as const).map(t => (
        <Image
          key={t}
          src={s[t]}
          alt={t === tone ? 'Tharaga Estates' : ''}
          aria-hidden={t !== tone}
          fill
          priority={priority}
          sizes={`${width * 2}px`}
          className={`object-contain transition-opacity duration-700 ${t === tone ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </span>
  )
}
