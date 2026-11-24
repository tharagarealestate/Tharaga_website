import Link from 'next/link'
import { TharagaWordmark } from './TharagaWordmark'
import { DESK_PHONE_DISPLAY, telLink } from '@/lib/mandates'
import { Button } from './Button'

/** Full-screen branded message used by the 404 and error pages. */
export function BrandedMessage({
  numeral,
  title,
  italic,
  body,
  action,
}: {
  numeral: string
  title: string
  italic: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#15213A] text-[#F7F3EC] flex flex-col items-center justify-center px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-4 sm:inset-6 border border-[#E6C9A0]/15" />
      <Link href="/" aria-label="Tharaga Estates — home">
        <TharagaWordmark tone="ivory" height={96} priority />
      </Link>
      <p className="mt-14 font-display text-sm tracking-[0.4em] text-[#D9AE78]">{numeral}</p>
      <h1 className="mt-6">
        <span className="block font-display text-4xl sm:text-6xl tracking-[0.04em]">{title}</span>{' '}
        <span className="block font-serif italic font-light text-4xl sm:text-6xl text-[#E6C9A0]">{italic}</span>
      </h1>
      <p className="mt-8 max-w-md font-serif text-xl leading-relaxed text-white/70">{body}</p>
      <div className="mt-12 flex flex-col sm:flex-row items-center gap-6">
        {action}
        <Button variant="light" arrow href="/properties">
          View properties
        </Button>
        <a href={telLink} className="font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#E6C9A0] hover:text-[#F7F3EC]">
          {DESK_PHONE_DISPLAY}
        </a>
      </div>
    </main>
  )
}
