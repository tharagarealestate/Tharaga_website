'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { ACQUISITION_BRIEFS, MANDATES, whatsappLink, type Mandate } from '@/lib/mandates'
import { useShortlist } from '@/lib/useShortlist'
import { Button } from '@/components/brand/Button'
import { MandateCard } from './MandateCard'
import { MandateDetail } from './MandateDetail'
import { EASE, EnquireLink, Eyebrow, Grain } from './primitives'

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.9, ease: EASE },
}

/** Homepage: three featured properties in one row, then what our buyers are looking for. */
export function PortfolioShowcase() {
  const [open, setOpen] = useState<Mandate | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const shortlist = useShortlist()
  const featured = MANDATES.filter(m => m.featured).slice(0, 3)

  return (
    <>
      <section id="projects" className="scroll-mt-20 bg-[#F7F3EC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <motion.div {...reveal} className="lg:col-span-7">
              <Eyebrow numeral="I">Featured properties</Eyebrow>
              <h2 className="mt-6 text-[#15213A]">
                <span className="block font-display text-[2.2rem] leading-[1.06] tracking-[0.03em] sm:text-5xl md:text-[3.6rem]">
                  Our finest properties,
                </span>{' '}
                <span className="block font-serif text-[2.6rem] font-light italic leading-[1.05] text-[#94643A] sm:text-6xl md:text-[4.4rem]">
                  available now.
                </span>
              </h2>
            </motion.div>
            <motion.div {...reveal} className="space-y-6 lg:col-span-5">
              <p className="font-serif text-[1.25rem] leading-[1.6] text-[#2E3648]">
                Every property here is represented by us directly. Location details, documents and prices are shared with
                verified buyers.
              </p>
              <div className="hidden sm:block">
                <Button variant="secondary" arrow href="/properties">
                  View all {MANDATES.length} properties
                </Button>
              </div>
            </motion.div>
          </div>

          {/* One row on desktop; a swipeable rail on phones */}
          <div className="-mx-5 mt-12 flex snap-x snap-mandatory scroll-pl-5 gap-5 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {featured.map((m, i) => (
              <div key={m.slug} className="w-[84%] shrink-0 snap-start sm:w-auto">
                <MandateCard
                  mandate={m}
                  index={i}
                  tall
                  onOpen={() => setOpen(m)}
                  saved={shortlist.has(m.slug)}
                  onToggleSave={() => shortlist.toggle(m.slug)}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 sm:hidden">
            <Button variant="primary" arrow full href="/properties">
              View all {MANDATES.length} properties
            </Button>
          </div>
        </div>
      </section>

      <section id="acquiring" className="relative scroll-mt-20 overflow-hidden bg-[#15213A] py-20 text-[#F7F3EC] sm:py-24">
        <Grain opacity={0.1} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12">
          <motion.div {...reveal} className="lg:col-span-4">
            <Eyebrow numeral="II" light>
              Properties we are buying
            </Eyebrow>
            <h2 className="mt-6 text-[#F7F3EC]">
              <span className="block font-display text-[2rem] leading-[1.1] tracking-[0.03em] sm:text-[2.6rem]">Our buyers</span>{' '}
              <span className="block font-serif text-[2.5rem] font-light italic leading-[1.05] text-[#E6C9A0] sm:text-[3.2rem]">
                are looking for these.
              </span>
            </h2>
            <p className="mt-6 font-serif text-[1.15rem] leading-[1.6] text-white/70">
              Own one of these? Tell us — we will introduce you to a buyer who is ready.
            </p>
          </motion.div>

          <ul className="divide-y divide-[#E6C9A0]/15 border-y border-[#E6C9A0]/15 lg:col-span-8">
            {ACQUISITION_BRIEFS.map((b, i) => (
              <motion.li
                key={b.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
                className="group grid gap-3 py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center"
              >
                <span className="font-display text-lg text-[#D9AE78]">{['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</span>
                <div>
                  <h3 className="font-display text-[1.2rem] tracking-[0.03em] text-[#F7F3EC] transition-transform duration-500 group-hover:translate-x-1.5">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 font-sans text-[10px] uppercase tracking-[0.24em] text-[#D9AE78]">{b.region}</p>
                  <p className="mt-2 font-serif text-[1.05rem] text-white/70">
                    {b.seeking} <span className="text-white/50">For {b.forWhom.charAt(0).toLowerCase() + b.forWhom.slice(1)}.</span>
                  </p>
                </div>
                <EnquireLink tone="light" href={whatsappLink(`I own a property for your brief: ${b.title} (${b.region})`)}>
                  I own one
                </EnquireLink>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <MandateDetail
        mandate={open}
        onClose={close}
        saved={open ? shortlist.has(open.slug) : false}
        onToggleSave={open ? () => shortlist.toggle(open.slug) : undefined}
      />
    </>
  )
}
