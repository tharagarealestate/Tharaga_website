'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import {
  ACQUISITION_BRIEFS,
  CATEGORY_LABELS,
  MANDATES,
  whatsappLink,
  type Mandate,
  type MandateCategory,
} from '@/lib/mandates'
import { FeatureMandate, MandateCard } from './MandateCard'
import { MandateDetail } from './MandateDetail'
import { EASE, EnquireLink, Eyebrow, Grain } from './primitives'

type Filter = 'all' | MandateCategory

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.9, ease: EASE },
}

export function PortfolioShowcase({ showBriefs = true }: { showBriefs?: boolean }) {
  const PREVIEW = 3
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Mandate | null>(null)
  const close = useCallback(() => setOpen(null), [])

  const filters = useMemo(() => {
    const present = Array.from(new Set(MANDATES.map(m => m.category)))
    return [
      { id: 'all' as Filter, label: 'All', count: MANDATES.length },
      ...present.map(c => ({ id: c as Filter, label: CATEGORY_LABELS[c], count: MANDATES.filter(m => m.category === c).length })),
    ]
  }, [])

  const featured = filter === 'all' ? MANDATES.filter(m => m.featured) : []
  const all = filter === 'all' ? MANDATES.filter(m => !m.featured) : MANDATES.filter(m => m.category === filter)
  const rest = all.slice(0, filter === 'all' ? PREVIEW : 6)

  return (
    <>
      <section id="projects" className="relative bg-[#F7F3EC] pt-24 sm:pt-32 pb-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          {/* Section masthead */}
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <motion.div {...reveal} className="lg:col-span-7">
              <Eyebrow numeral="I">The Portfolio</Eyebrow>
              <h2 className="mt-7 text-[#15213A]">
                <span className="block font-display text-[2.6rem] sm:text-6xl md:text-[4.4rem] leading-[1.02] tracking-[0.03em]">
                  Exclusively curated.
                </span>{' '}
                <span className="block font-serif italic font-light text-5xl sm:text-7xl md:text-[5.4rem] leading-[1] text-[#94643A]">
                  Privately offered.
                </span>
              </h2>
            </motion.div>
            <motion.p {...reveal} className="lg:col-span-5 font-serif text-[1.3rem] leading-[1.6] text-[#2E3648]">
              Every property here is a live mandate Tharaga represents directly. Locations, documents and pricing are
              released to buyers we have spoken to — never to the open market.
            </motion.p>
          </div>

          {/* Filter rail */}
          <motion.div {...reveal} className="mt-12 border-y border-[#B0834A]/30">
            <LayoutGroup>
              <ul className="flex gap-1 overflow-x-auto no-scrollbar py-3 -mx-1 px-1">
                {filters.map(f => {
                  const active = filter === f.id
                  return (
                    <li key={f.id} className="shrink-0">
                      <button
                        onClick={() => setFilter(f.id)}
                        className={`relative px-4 py-3 font-sans text-[10.5px] uppercase tracking-[0.26em] transition-colors duration-500 ${
                          active ? 'text-[#15213A]' : 'text-[#7D8292] hover:text-[#15213A]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="filter-rule"
                            className="absolute left-4 right-4 -bottom-[13px] h-[2px] bg-[#B0834A]"
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                          />
                        )}
                        <span className="relative">
                          {f.label}
                          <span className={`ml-2 ${active ? 'text-[#B0834A]' : 'text-[#A9A190]'}`}>{f.count}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </LayoutGroup>
          </motion.div>

          {/* Flagships */}
          {featured.length > 0 && (
            <div className="mt-20 space-y-24 sm:space-y-32">
              {featured.map((m, i) => (
                <FeatureMandate key={m.slug} mandate={m} index={i} onOpen={() => setOpen(m)} />
              ))}
            </div>
          )}

          {featured.length > 0 && (
            <motion.div {...reveal} className="mt-28 mb-14 flex items-end justify-between gap-6">
              <h3 className="text-[#15213A]">
                <span className="font-display text-2xl sm:text-[2rem] tracking-[0.03em]">Further mandates</span>{' '}
                <span className="font-serif italic font-light text-3xl sm:text-[2.5rem] text-[#94643A]">across Tamil Nadu</span>
              </h3>
              <span className="hidden sm:block font-sans text-[11px] uppercase tracking-[0.26em] text-[#7D8292]">
                A selection
              </span>
            </motion.div>
          )}

          {/* Editorial grid: staggered columns rather than a uniform box grid */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 ${featured.length ? '' : 'mt-16'}`}
            >
              {rest.map((m, i) => (
                <div key={m.slug} className={i % 3 === 1 ? 'lg:mt-20' : ''}>
                  <MandateCard mandate={m} index={i} tall={i % 3 === 1} onOpen={() => setOpen(m)} />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Gateway to the full portfolio page */}
          <motion.div {...reveal} className="mt-24 flex flex-col items-center text-center">
            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-px w-16 bg-[#B0834A]/60" />
              <span className="h-2 w-2 rotate-45 bg-[#B0834A]" />
              <span className="h-px w-16 bg-[#B0834A]/60" />
            </div>
            <p className="mt-8 font-serif italic text-2xl text-[#4A5163]">
              {MANDATES.length - featured.length - rest.length > 0
                ? `${MANDATES.length - featured.length - rest.length} more mandates in the full portfolio`
                : 'The full portfolio, with search, index view and your private shortlist'}
            </p>
            <Link
              href="/properties"
              className="group/all relative mt-8 overflow-hidden border border-[#15213A] px-10 py-4 font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#15213A] hover:text-[#15213A]"
            >
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-[#15213A] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/all:scale-y-100" />
              <span className="relative transition-colors duration-500 group-hover/all:text-[#F7F3EC]">
                Explore all {MANDATES.length} mandates
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {showBriefs && (
        <>
          <section id="acquiring" className="relative overflow-hidden bg-[#15213A] text-[#F7F3EC] py-24 sm:py-32 scroll-mt-20">
            <Grain opacity={0.1} />
            <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid gap-14 lg:grid-cols-12">
              <motion.div {...reveal} className="lg:col-span-4">
                <Eyebrow numeral="II" light>Currently Acquiring</Eyebrow>
                <h2 className="mt-7 text-[#F7F3EC]">
                  <span className="block font-display text-4xl sm:text-5xl tracking-[0.03em] leading-[1.08]">Our buyers</span>{' '}
                  <span className="block font-serif italic font-light text-5xl sm:text-6xl text-[#E6C9A0]">are waiting.</span>
                </h2>
                <p className="mt-7 font-serif text-[1.2rem] leading-[1.6] text-white/70">
                  Live briefs from the clients we represent. If you own an asset that fits, the conversation starts with
                  a single message — in confidence.
                </p>
              </motion.div>

              <ul className="relative lg:col-span-8 divide-y divide-[#E6C9A0]/15 border-y border-[#E6C9A0]/15">
                {ACQUISITION_BRIEFS.map((b, i) => (
                  <motion.li
                    key={b.slug}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
                    className="group grid gap-3 py-7 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
                  >
                    <span className="font-display text-xl text-[#D9AE78]">{['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</span>
                    <div>
                      <h3 className="font-display text-[1.35rem] tracking-[0.03em] text-[#F7F3EC] transition-transform duration-500 group-hover:translate-x-1.5">
                        {b.title}
                      </h3>
                      <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.26em] text-[#D9AE78]">{b.region}</p>
                      <p className="mt-3 font-serif text-[1.12rem] text-white/75">
                        {b.seeking} <span className="text-white/50">On behalf of {b.forWhom.charAt(0).toLowerCase() + b.forWhom.slice(1)}.</span>
                      </p>
                    </div>
                    <EnquireLink tone="light" href={whatsappLink(`Acquisition brief — ${b.title} (${b.region})`)}>I own one</EnquireLink>
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      <MandateDetail mandate={open} onClose={close} />
    </>
  )
}
