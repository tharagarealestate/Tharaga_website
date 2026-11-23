'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { EASE, EnquireLink, GoldDivider } from './primitives'

type Filter = 'all' | MandateCategory

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.9, ease: EASE },
}

export function PortfolioShowcase({ showBriefs = true }: { showBriefs?: boolean }) {
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
  const rest = filter === 'all' ? MANDATES.filter(m => !m.featured) : MANDATES.filter(m => m.category === filter)

  return (
    <>
      <section id="projects" className="relative bg-[#FAF8F5] pt-24 sm:pt-32 pb-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          {/* Section masthead */}
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <motion.div {...reveal} className="lg:col-span-7">
              <p className="flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.34em] text-[#9E7B4F]">
                <span className="h-px w-10 bg-[#C5A059]" /> The Portfolio
              </p>
              <h2 className="mt-5 font-serif text-5xl sm:text-6xl md:text-7xl leading-[0.98] tracking-[-0.015em] text-[#1A1816]">
                Exclusively curated.
                <br />
                <span className="italic text-[#9E7B4F]">Privately offered.</span>
              </h2>
            </motion.div>
            <motion.p {...reveal} className="lg:col-span-5 font-sans text-base font-light leading-relaxed text-[#5A564F]">
              Every property here is a live mandate Tharaga represents directly. Locations, documents and pricing are
              released to buyers we have spoken to — never to the open market.
            </motion.p>
          </div>

          {/* Filter rail */}
          <motion.div {...reveal} className="mt-12 border-y border-[#C5A059]/30">
            <LayoutGroup>
              <ul className="flex gap-1 overflow-x-auto no-scrollbar py-3 -mx-1 px-1">
                {filters.map(f => {
                  const active = filter === f.id
                  return (
                    <li key={f.id} className="shrink-0">
                      <button
                        onClick={() => setFilter(f.id)}
                        className={`relative rounded-full px-4 py-2 font-sans text-[11px] uppercase tracking-[0.22em] transition-colors ${
                          active ? 'text-[#FAF8F5]' : 'text-[#5A564F] hover:text-[#1A1816]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="filter-pill"
                            className="absolute inset-0 rounded-full bg-[#1A1816]"
                            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                          />
                        )}
                        <span className="relative">
                          {f.label}
                          <span className={`ml-2 ${active ? 'text-[#C5A059]' : 'text-[#B5AC9C]'}`}>{f.count}</span>
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
              <h3 className="font-serif text-3xl sm:text-4xl text-[#1A1816]">
                Further mandates <span className="italic text-[#9E7B4F]">across Tamil Nadu</span>
              </h3>
              <span className="hidden sm:block font-sans text-[11px] uppercase tracking-[0.26em] text-[#8E887E]">
                {rest.length} properties
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
        </div>
      </section>

      {showBriefs && (
        <>
          <GoldDivider />
          <section id="acquiring" className="bg-[#FAF8F5] py-24 sm:py-28 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 grid gap-14 lg:grid-cols-12">
              <motion.div {...reveal} className="lg:col-span-4">
                <p className="flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.34em] text-[#9E7B4F]">
                  <span className="h-px w-10 bg-[#C5A059]" /> Currently Acquiring
                </p>
                <h2 className="mt-5 font-serif text-4xl sm:text-5xl leading-[1.02] text-[#1A1816]">
                  Our buyers are <span className="italic text-[#9E7B4F]">waiting.</span>
                </h2>
                <p className="mt-6 font-sans text-sm font-light leading-relaxed text-[#5A564F]">
                  Live briefs from the clients we represent. If you own an asset that fits, the conversation starts with
                  a single message — in confidence.
                </p>
              </motion.div>

              <ul className="lg:col-span-8 divide-y divide-[#C5A059]/25 border-y border-[#C5A059]/25">
                {ACQUISITION_BRIEFS.map((b, i) => (
                  <motion.li
                    key={b.slug}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
                    className="group grid gap-3 py-7 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
                  >
                    <span className="font-serif text-2xl text-[#C5A059]">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#1A1816] transition-transform duration-500 group-hover:translate-x-1">
                        {b.title}
                      </h3>
                      <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.22em] text-[#9E7B4F]">{b.region}</p>
                      <p className="mt-2 font-sans text-sm font-light text-[#5A564F]">
                        {b.seeking} <span className="text-[#8E887E]">On behalf of: {b.forWhom}.</span>
                      </p>
                    </div>
                    <EnquireLink href={whatsappLink(`Acquisition brief — ${b.title} (${b.region})`)}>I own one</EnquireLink>
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
