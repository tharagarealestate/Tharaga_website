/**
 * Tharaga Estates wordmark.
 *
 * When the official logo artwork is committed (LOGO_SRC below), the header and footer
 * render that file. Until then this renders a vector lockup set in the logo's typeface:
 * Cinzel capitals with copper diamond accents, a ruled diamond divider and spaced
 * Montserrat "ESTATES", in navy and copper.
 */

/** Path to the official logo file in /public, or null to use the vector lockup. */
export const LOGO_SRC: string | null = null

type Tone = 'navy' | 'ivory'

export function TharagaWordmark({
  tone = 'navy',
  size = 'md',
  className = '',
}: {
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const ink = tone === 'navy' ? '#15213A' : '#F7F3EC'
  const copper = tone === 'navy' ? '#A8743F' : '#D9AE78'
  const s = {
    sm: { word: 'text-[17px] tracking-[0.2em]', sub: 'text-[7.5px] tracking-[0.62em]', rule: 'w-4' },
    md: { word: 'text-[21px] tracking-[0.22em]', sub: 'text-[8.5px] tracking-[0.66em]', rule: 'w-6' },
    lg: { word: 'text-[44px] tracking-[0.2em]', sub: 'text-[13px] tracking-[0.7em]', rule: 'w-12' },
  }[size]

  if (LOGO_SRC) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={LOGO_SRC} alt="Tharaga Estates" className={`h-12 w-auto ${className}`} />
  }

  return (
    <span className={`inline-flex flex-col items-center leading-none select-none ${className}`} aria-label="Tharaga Estates">
      <span className={`font-display font-semibold ${s.word} pl-[0.2em]`} style={{ color: ink }} aria-hidden>
        TH
        <Diamond color={copper} />
        R
        <Diamond color={copper} />
        G
        <Diamond color={copper} />
      </span>
      <span className="mt-[5px] flex items-center gap-1.5" aria-hidden>
        <span className={`h-px ${s.rule}`} style={{ background: copper }} />
        <span className="h-[4px] w-[4px] rotate-45" style={{ background: copper }} />
        <span className={`font-sans font-medium ${s.sub} pl-[0.6em]`} style={{ color: copper }}>
          ESTATES
        </span>
        <span className="h-[4px] w-[4px] rotate-45" style={{ background: copper }} />
        <span className={`h-px ${s.rule}`} style={{ background: copper }} />
      </span>
    </span>
  )
}

/** An "A" whose crossbar is a copper diamond, as in the logo. */
function Diamond({ color }: { color: string }) {
  return (
    <span className="relative inline-block">
      A
      <span
        className="absolute top-[64%] h-[0.15em] w-[0.15em] -translate-x-1/2 -translate-y-1/2 rotate-45"
        style={{ background: color, left: 'calc(50% - 0.1em)' }}
      />
    </span>
  )
}
