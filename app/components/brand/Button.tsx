import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Tharaga Estates button system.
 *
 * Principles (taken from the products we benchmarked):
 *  - Supabase / GitHub: one unmistakable primary per view, a quiet secondary, fast
 *    (200ms) colour transitions on a single easing curve, visible keyboard focus.
 *  - Luxury maisons: square corners, tall tap targets, wide-tracked uppercase labels,
 *    hairline borders rather than shadows.
 *  - Architecture practices: restraint — the only ornament is a copper fill that
 *    rises from the base and an arrow that steps forward.
 *
 * Variants: primary (navy), secondary (navy outline), light (ivory, for dark
 * surfaces), outline-light (ivory outline, for dark surfaces), copper (accent).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'light' | 'outline-light' | 'copper'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE =
  'group/btn relative isolate inline-flex select-none items-center justify-center gap-3 overflow-hidden whitespace-nowrap font-sans font-semibold uppercase ' +
  'transition-[color,border-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#B0834A] ' +
  'disabled:pointer-events-none disabled:opacity-40'

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-10 px-5 text-[11px] tracking-[0.18em]',
  md: 'h-12 px-7 text-[11.5px] tracking-[0.18em]',
  lg: 'h-14 px-9 text-[12px] tracking-[0.18em]',
}

// [resting classes, fill colour that rises on hover, label colour on hover]
const VARIANTS: Record<ButtonVariant, [string, string, string]> = {
  primary: ['bg-[#15213A] text-[#F7F3EC] border border-[#15213A] hover:text-[#F7F3EC]', 'bg-[#94643A]', 'group-hover/btn:text-[#F7F3EC]'],
  secondary: ['bg-transparent text-[#15213A] border-[1.5px] border-[#15213A] hover:text-[#15213A]', 'bg-[#15213A]', 'group-hover/btn:text-[#F7F3EC]'],
  light: ['bg-[#F7F3EC] text-[#15213A] border border-[#F7F3EC] hover:text-[#15213A]', 'bg-[#E6C9A0]', 'group-hover/btn:text-[#15213A]'],
  'outline-light': ['bg-transparent text-[#F7F3EC] border-[1.5px] border-[#E6C9A0]/80 hover:text-[#F7F3EC]', 'bg-[#F7F3EC]', 'group-hover/btn:text-[#15213A]'],
  copper: ['bg-[#B0834A] text-[#FBF7F0] border border-[#B0834A] hover:text-[#FBF7F0]', 'bg-[#15213A]', 'group-hover/btn:text-[#F7F3EC]'],
}

type Common = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  arrow?: boolean
  full?: boolean
  className?: string
}

type AsLink = Common & { href: string; external?: boolean; onClick?: () => void }
type AsButton = Common & { href?: undefined; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; ariaLabel?: string }

export function Button(props: AsLink | AsButton) {
  const { children, variant = 'primary', size = 'md', arrow = false, full = false, className = '' } = props
  const [rest, fill, hoverText] = VARIANTS[variant]
  const cls = `${BASE} ${SIZES[size]} ${rest} ${full ? 'w-full' : ''} ${className}`

  const inner = (
    <>
      <span
        aria-hidden
        className={`absolute inset-0 -z-10 origin-bottom scale-y-0 ${fill} transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:scale-y-100`}
      />
      <span className={`relative transition-colors duration-200 ${hoverText}`}>{children}</span>
      {arrow && (
        <span
          aria-hidden
          className={`relative text-[13px] leading-none transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-1 ${hoverText}`}
        >
          →
        </span>
      )}
    </>
  )

  if ('href' in props && props.href) {
    const { href, external, onClick } = props
    const isExternal = external ?? /^(https?:|tel:|mailto:)/.test(href)
    if (isExternal) {
      return (
        <a
          href={href}
          onClick={onClick}
          className={cls}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {inner}
        </a>
      )
    }
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {inner}
      </Link>
    )
  }
  const b = props as AsButton
  return (
    <button type={b.type ?? 'button'} onClick={b.onClick} disabled={b.disabled} aria-label={b.ariaLabel} className={cls}>
      {inner}
    </button>
  )
}
