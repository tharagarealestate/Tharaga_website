'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Grain, EASE } from './primitives'
import { Button } from '@/components/brand/Button'
import { ACQUISITION_BRIEFS, MANDATES, PORTFOLIO_ACRES } from '@/lib/mandates'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2400&q=80'

const REGIONS = ['Chennai', 'Courtalam', 'Thoothukudi', 'Virudhunagar', 'Karur', 'Ottapidaram', 'East Coast Road', 'Old Mahabalipuram Road']

export function CinematicHero({ onEnquire }: { onEnquire: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '20%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, reduce ? 1.06 : 1.16])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '30%'])
  const fade = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  return (
    <>
      <section ref={ref} className="relative h-[100svh] min-h-[660px] w-full overflow-hidden bg-[#0E1729] text-[#F7F3EC]">
        {/* Opening curtain: the image is revealed from a navy field */}
        <motion.div
          style={{ y: imgY, scale: imgScale }}
          initial={{ clipPath: 'inset(18% 14% 18% 14%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.8, ease: EASE }}
          className="absolute inset-0 will-change-transform"
        >
          <Image
            src={HERO_IMAGE}
            alt="Farmland stretching to the horizon at first light"
            fill
            priority
            sizes="100vw"
            className="object-cover tharaga-grade"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-[#0E1729]/70 via-[#0E1729]/20 to-[#0E1729]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_70%_35%,rgba(217,174,120,0.22),transparent_70%)]" />
        <Grain opacity={0.16} />

        {/* Fine frame rule, inset from the edges */}
        <div aria-hidden className="pointer-events-none absolute inset-4 sm:inset-6 border border-[#E6C9A0]/20" />

        <motion.div
          style={{ y: textY, opacity: fade }}
          className="relative z-10 flex h-full flex-col justify-end max-w-7xl mx-auto px-6 sm:px-10 pb-16 sm:pb-24"
        >
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.9 }}
            className="mb-8 flex items-center gap-4 font-sans text-[10.5px] uppercase tracking-[0.4em] text-[#E6C9A0]"
          >
            <span className="h-px w-10 bg-[#D9AE78]" />
            <span className="sm:hidden">Tharaga Estates · Tamil Nadu</span>
            <span className="hidden sm:inline">Tharaga Estates · Land & Property Advisors · Tamil Nadu</span>
          </motion.p>

          <h1 className="leading-[0.95]">
            <span className="block overflow-hidden">
              <motion.span
                className="block font-display font-normal text-[12.5vw] sm:text-7xl md:text-8xl lg:text-[7.6rem] tracking-[0.04em]"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.3, ease: EASE, delay: 0.5 }}
              >
                Land that
              </motion.span>
            </span>{' '}
            <span className="block overflow-hidden pb-2">
              <motion.span
                className="block font-serif italic font-light text-[15vw] sm:text-8xl md:text-[7.5rem] lg:text-[9.4rem] text-[#E6C9A0] -mt-1 sm:-mt-3"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.3, ease: EASE, delay: 0.65 }}
              >
                outlives us.
              </motion.span>
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 1.1 }}
            className="mt-10 grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-end"
          >
            <p className="max-w-xl font-serif text-[1.15rem] leading-[1.5] text-white/80 sm:text-[1.45rem]">
              Land, energy and city property across Tamil Nadu — represented privately
              <span className="hidden sm:inline">, and shown only to buyers we have verified. Pricing is shared in conversation, never in public</span>.
            </p>

            <div className="flex flex-col gap-8 md:items-end">
              <dl className="flex divide-x divide-[#E6C9A0]/25 font-sans">
                {[
                  { k: 'Properties', v: MANDATES.length },
                  { k: 'Acres', v: `${PORTFOLIO_ACRES.toLocaleString('en-IN')}+` },
                  { k: 'Buyer requests', v: ACQUISITION_BRIEFS.length },
                ].map((s, i) => (
                  <div key={s.k} className={`flex flex-col-reverse ${i === 0 ? 'pr-7' : 'px-7 last:pr-0'}`}>
                    <dt className="mt-2 text-[9.5px] uppercase tracking-[0.3em] text-white/55">{s.k}</dt>
                    <dd className="font-display text-3xl sm:text-[2.4rem] text-[#F7F3EC]">{s.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button variant="light" arrow href="/properties">
                  View properties
                </Button>
                <Button variant="outline-light" onClick={onEnquire}>
                  Enquire privately
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3"
        >
          <span className="h-12 w-px overflow-hidden bg-white/15">
            <motion.span
              className="block h-1/2 w-px bg-[#D9AE78]"
              animate={reduce ? undefined : { y: ['-100%', '200%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </motion.div>
      </section>

      {/* Regions band */}
      <div className="relative overflow-hidden border-b border-[#B0834A]/25 bg-[#15213A] py-5" aria-label="Regions we represent">
        <div className="flex w-max animate-[tharaga-marquee_48s_linear_infinite] motion-reduce:animate-none">
          {[0, 1].map(k => (
            <ul key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {REGIONS.map(r => (
                <li key={r} className="flex items-center font-display text-[13px] tracking-[0.34em] text-[#E6C9A0]/85 uppercase">
                  <span className="px-8">{r}</span>
                  <span className="h-1.5 w-1.5 rotate-45 bg-[#B0834A]" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </>
  )
}
