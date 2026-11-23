'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Grain, EASE } from './primitives'
import { ACQUISITION_BRIEFS, MANDATES, PORTFOLIO_ACRES } from '@/lib/mandates'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2400&q=80'

export function CinematicHero({ onEnquire }: { onEnquire: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '22%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.08, reduce ? 1.08 : 1.2])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '40%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#1A1816] text-[#FAF8F5]"
    >
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0 will-change-transform">
        <Image
          src={HERO_IMAGE}
          alt="Golden farmland stretching to the horizon at sunrise"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Cinematic grade */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1816]/55 via-[#1A1816]/25 to-[#1A1816]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(197,160,89,0.18),transparent_70%)]" />
      <Grain opacity={0.18} />

      <motion.div
        style={{ y: textY, opacity: fade }}
        className="relative z-10 flex h-full flex-col justify-end max-w-7xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          className="mb-6 flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.34em] text-[#E9D3A4]"
        >
          <span className="h-px w-10 bg-[#C5A059]" />
          Tharaga · Private Mandates · Tamil Nadu
        </motion.p>

        <h1 className="font-serif text-[13vw] leading-[0.92] sm:text-7xl md:text-8xl lg:text-[8.5rem] tracking-[-0.02em]">
          {['Land that', 'outlives us.'].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className={`block ${i === 1 ? 'italic text-[#E9D3A4]' : ''}`}
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.2 + i * 0.12 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}
          className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end"
        >
          <p className="max-w-xl font-sans text-base sm:text-lg font-light leading-relaxed text-white/80">
            Hill estates, land banks, energy assets and city addresses — each represented privately, each shown only to
            buyers we have verified. Pricing is shared in conversation, never in public.
          </p>

          <div className="flex flex-col gap-6 md:items-end">
            <dl className="flex gap-8 sm:gap-10 font-sans">
              {[
                { k: 'Active mandates', v: MANDATES.length },
                { k: 'Acres represented', v: `${PORTFOLIO_ACRES.toLocaleString('en-IN')}+` },
                { k: 'Buyer briefs', v: ACQUISITION_BRIEFS.length },
              ].map(s => (
                <div key={s.k}>
                  <dt className="text-[10px] uppercase tracking-[0.24em] text-white/55">{s.k}</dt>
                  <dd className="mt-1 font-serif text-3xl sm:text-4xl text-[#FAF8F5]">{s.v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center gap-6">
              <a
                href="#projects"
                className="rounded-full bg-[#FAF8F5] px-7 py-3 font-sans text-[11px] uppercase tracking-[0.26em] text-[#1A1816] transition-colors hover:bg-[#E9D3A4]"
              >
                View the Portfolio
              </a>
              <button
                onClick={onEnquire}
                className="group/cta relative py-1.5 font-sans text-[11px] uppercase tracking-[0.26em] text-[#FAF8F5]"
              >
                Enquire Privately
                <span className="absolute left-0 -bottom-px h-px w-full origin-left scale-x-0 bg-[#C5A059] transition-transform duration-500 group-hover/cta:scale-x-100" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-[#C5A059]/40" />
    </section>
  )
}
