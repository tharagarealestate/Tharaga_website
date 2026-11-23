'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { TharagaWordmark } from './TharagaWordmark'
import { Grain } from '@/components/portfolio/primitives'
import { DESK_PHONE_DISPLAY, telLink, whatsappLink } from '@/lib/mandates'

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Portfolio', href: '/properties' },
  { label: 'Acquiring', href: '/#acquiring' },
  { label: 'About', href: '/about' },
]

/** Header for inner pages: transparent over a navy masthead, ivory once scrolled. */
export function SiteHeader() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 48))
  const dark = !scrolled && !open

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          dark ? 'bg-transparent border-b border-transparent py-4' : 'bg-[#F7F3EC]/95 border-b border-[#B0834A]/25 py-2'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="hidden lg:flex items-center gap-8">
            {NAV.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className={`group/nav relative font-sans text-[10px] uppercase tracking-[0.3em] transition-colors duration-500 ${
                  dark ? 'text-[#F7F3EC]/80 hover:text-[#F7F3EC]' : 'text-[#4A5163] hover:text-[#15213A]'
                }`}
              >
                {l.label}
                <span className="absolute left-0 -bottom-1.5 h-px w-full origin-left scale-x-0 bg-[#B0834A] transition-transform duration-500 group-hover/nav:scale-x-100" />
              </Link>
            ))}
          </div>
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="lg:hidden justify-self-start flex flex-col gap-[5px] p-2 -ml-2"
          >
            {[0, 1].map(i => (
              <span
                key={i}
                className={`block h-px w-6 transition-all duration-500 ${dark ? 'bg-[#F7F3EC]' : 'bg-[#15213A]'} ${
                  open ? (i === 0 ? 'translate-y-[3px] rotate-45' : '-translate-y-[3px] -rotate-45') : ''
                }`}
              />
            ))}
          </button>
          <Link href="/" aria-label="Tharaga Estates — home" className="justify-self-center">
            <TharagaWordmark tone={dark ? 'ivory' : 'navy'} height={scrolled ? 56 : 80} priority />
          </Link>
          <div className="justify-self-end flex items-center gap-6">
            <a
              href={telLink}
              className={`hidden md:block font-sans text-[10px] uppercase tracking-[0.28em] transition-colors ${
                dark ? 'text-[#F7F3EC]/80 hover:text-[#F7F3EC]' : 'text-[#4A5163] hover:text-[#15213A]'
              }`}
            >
              {DESK_PHONE_DISPLAY}
            </a>
            <a
              href={whatsappLink('the Tharaga portfolio')}
              target="_blank"
              rel="noreferrer"
              className={`group/e relative overflow-hidden border px-5 py-2.5 font-sans text-[10px] uppercase tracking-[0.28em] transition-colors duration-500 ${
                dark ? 'border-[#E6C9A0]/70 text-[#F7F3EC] hover:text-[#F7F3EC]' : 'border-[#15213A] text-[#15213A] hover:text-[#15213A]'
              }`}
            >
              <span className={`absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 group-hover/e:scale-y-100 ${dark ? 'bg-[#F7F3EC]' : 'bg-[#15213A]'}`} />
              <span className={`relative transition-colors duration-500 ${dark ? 'group-hover/e:text-[#15213A]' : 'group-hover/e:text-[#F7F3EC]'}`}>Enquire</span>
            </a>
          </div>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-[#15213A] text-[#F7F3EC] flex flex-col justify-center px-8 lg:hidden"
          >
            <Grain opacity={0.1} />
            <ul className="relative space-y-6">
              {NAV.map((l, i) => (
                <li key={l.label}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="flex items-baseline gap-5 text-[#F7F3EC] hover:text-[#F7F3EC]">
                    <span className="font-display text-sm text-[#D9AE78]">{['I', 'II', 'III', 'IV'][i]}</span>
                    <span className="font-display text-3xl tracking-[0.06em]">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <a href={telLink} className="relative mt-14 border-t border-[#E6C9A0]/20 pt-8 font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#E6C9A0]">
              {DESK_PHONE_DISPLAY}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-[#0E1729] text-white/60 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
        <TharagaWordmark tone="ivory" variant="full" height={190} />
        <p className="mt-8 font-serif italic text-xl text-white/60">Land, energy and commercial assets · Tamil Nadu</p>
        <div className="mt-12 w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E6C9A0]/15 pt-8 font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">
          <span>© {new Date().getFullYear()} Tharaga Estates · Chennai, Tamil Nadu</span>
          <a href={telLink} className="text-white/40 hover:text-[#E6C9A0] transition-colors">{DESK_PHONE_DISPLAY} · tharaga.in</a>
        </div>
      </div>
    </footer>
  )
}
