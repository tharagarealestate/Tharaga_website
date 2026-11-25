'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Grain, EASE } from './primitives'
import { Button } from '@/components/brand/Button'
import { CATEGORY_LABELS, MANDATES, PORTFOLIO_ACRES, type MandateCategory } from '@/lib/mandates'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2400&q=80'

const REGIONS = ['Chennai', 'Courtalam', 'Thoothukudi', 'Virudhunagar', 'Karur', 'Vellore', 'Tiruchirappalli', 'Ottapidaram', 'East Coast Road', 'GST Road']

const ORDER: MandateCategory[] = ['land', 'energy', 'quarry', 'commercial', 'residence']

export function CinematicHero({ onListProperty }: { onListProperty: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '14%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0.15])

  const counts = ORDER.map(c => ({ key: c, label: CATEGORY_LABELS[c], n: MANDATES.filter(m => m.category === c).length })).filter(c => c.n)

  return (
    <>
      <section ref={ref} className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#0E1729] text-[#F7F3EC]">
        {/* Photograph: revealed from a navy field, gently drifting on scroll */}
        <motion.div
          style={{ y: imgY }}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1.04 }}
          transition={{ duration: 2.2, ease: EASE }}
          className="absolute inset-0 -z-10 will-change-transform"
        >
          <Image
            src={HERO_IMAGE}
            alt="Farmland stretching to the horizon at first light"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[62%_center] tharaga-grade"
          />
        </motion.div>

        {/* Legibility: a deep wash on the text side and at the base; the light stays on the right */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,18,32,0.78)_0%,rgba(11,18,32,0.55)_45%,rgba(11,18,32,0.94)_100%)] lg:bg-[linear-gradient(90deg,rgba(11,18,32,0.94)_0%,rgba(11,18,32,0.8)_38%,rgba(11,18,32,0.35)_70%,rgba(11,18,32,0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-[#0B1220] to-transparent" />
        <Grain opacity={0.1} />
        <div aria-hidden className="pointer-events-none absolute inset-3 border border-[#E6C9A0]/15 sm:inset-5" />

        <motion.div
          style={{ opacity: fade }}
          className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-10 pt-[120px] sm:px-8 sm:pb-14 lg:justify-center lg:pb-16 lg:pt-[128px]"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
            className="inline-flex w-fit items-center gap-3 border border-[#E6C9A0]/35 bg-[#0B1220]/40 px-3.5 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-[#F0DDBF] backdrop-blur-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E6C9A0] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E6C9A0]" />
            </span>
            {MANDATES.length} properties open now<span className="hidden sm:inline">&nbsp;· Tamil Nadu</span>
          </motion.p>

          <h1 className="mt-6 max-w-[15ch] [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]">
            <span className="block overflow-hidden">
              <motion.span
                className="block font-display text-[3rem] font-normal leading-[1.02] tracking-[0.02em] text-[#FBF8F2] sm:text-[4rem] lg:text-[5rem]"
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
              >
                Land that
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-1">
              <motion.span
                className="block font-serif text-[3.5rem] font-normal italic leading-[1] text-[#EBCB9C] sm:text-[4.8rem] lg:text-[6rem]"
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
              >
                outlives us.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.8 }}
            className="mt-6 max-w-xl font-sans text-[16px] leading-[1.65] text-[#F7F3EC]/90 sm:text-[17.5px]"
          >
            Land banks, solar plants, quarries and city property across Tamil Nadu — each represented directly by our desk.
            <span className="hidden sm:inline"> Browse the pipeline, shortlist what fits, and speak to us privately. Prices are shared in conversation.</span>
          </motion.p>

          {/* Explore: one tap into the pipeline by type */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1 }}
            className="mt-8 w-full max-w-3xl border border-[#E6C9A0]/25 bg-[#0B1220]/55 p-4 backdrop-blur-md sm:p-5"
          >
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D9AE78]">Explore by type</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {counts.map(c => (
                <Link
                  key={c.key}
                  href={`/properties?cat=${c.key}`}
                  className="group/c inline-flex h-10 items-center gap-2.5 border border-white/20 bg-white/[0.04] px-3.5 font-sans text-[13px] text-[#F7F3EC] transition-colors hover:border-[#E6C9A0] hover:bg-[#F7F3EC] hover:text-[#15213A]"
                >
                  {c.label}
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E6C9A0]/20 px-1.5 text-[11px] font-semibold text-[#F0DDBF] group-hover/c:bg-[#15213A] group-hover/c:text-[#F7F3EC]">
                    {c.n}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="light" arrow href="/properties">
                View all {MANDATES.length} properties
              </Button>
              <button
                onClick={onListProperty}
                className="text-left font-sans text-[14px] text-[#F7F3EC]/85 underline decoration-[#D9AE78]/70 underline-offset-[6px] transition-colors hover:text-[#F7F3EC] sm:text-right"
              >
                Own land or property? <span className="font-semibold text-[#F0DDBF]">List it with us →</span>
              </button>
            </div>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-7 flex flex-wrap gap-x-8 gap-y-2 font-sans text-[13px] text-[#F7F3EC]/75"
          >
            {[
              [`${PORTFOLIO_ACRES.toLocaleString('en-IN')}+`, 'acres represented'],
              [String(counts.length), 'asset types'],
              ['Direct', 'owner mandates'],
            ].map(([v, k]) => (
              <div key={k} className="flex items-baseline gap-2">
                <dt className="sr-only">{k}</dt>
                <dd className="font-display text-[1.25rem] tracking-[0.02em] text-[#FBF8F2]">{v}</dd>
                <span>{k}</span>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </section>

      {/* Regions band */}
      <div className="relative overflow-hidden border-b border-[#B0834A]/25 bg-[#15213A] py-4" aria-label="Regions we represent">
        <div className="flex w-max animate-[tharaga-marquee_52s_linear_infinite] motion-reduce:animate-none">
          {[0, 1].map(k => (
            <ul key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {REGIONS.map(r => (
                <li key={r} className="flex items-center font-sans text-[12px] font-medium uppercase tracking-[0.24em] text-[#E6C9A0]/90">
                  <span className="px-7">{r}</span>
                  <span className="h-1 w-1 rotate-45 bg-[#B0834A]" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </>
  )
}
