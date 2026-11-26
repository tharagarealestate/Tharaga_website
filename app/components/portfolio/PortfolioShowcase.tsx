'use client'

import { useMemo, useState } from 'react'
import { openProperty } from '@/lib/propertyAccess'
import { useRouter } from 'next/navigation'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { CATEGORY_LABELS, MANDATES, type MandateCategory } from '@/lib/mandates'
import { useShortlist } from '@/lib/useShortlist'
import { Button } from '@/components/brand/Button'
import { MandateCard } from './MandateCard'
import { EASE, Eyebrow } from './primitives'

const ORDER: MandateCategory[] = ['land', 'energy', 'quarry', 'commercial', 'residence']
const LIMIT = 6

/** Homepage: the whole pipeline at a glance — filter by type, featured first. */
export function PortfolioShowcase() {
  const router = useRouter()
  const shortlist = useShortlist()
  const [cat, setCat] = useState<'all' | MandateCategory>('all')

  const tabs = useMemo(
    () => [
      { key: 'all' as const, label: 'All', n: MANDATES.length },
      ...ORDER.map(c => ({ key: c, label: CATEGORY_LABELS[c], n: MANDATES.filter(m => m.category === c).length })).filter(t => t.n),
    ],
    [],
  )

  const list = useMemo(() => {
    const pool = cat === 'all' ? MANDATES : MANDATES.filter(m => m.category === cat)
    return [...pool].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || Number(!!b.media?.some(x => x.kind !== 'plan')) - Number(!!a.media?.some(x => x.kind !== 'plan')))
  }, [cat])
  const shown = list.slice(0, LIMIT)
  const more = list.length - shown.length

  return (
    <section id="projects" className="scroll-mt-20 bg-[#F7F3EC] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: EASE }}
            className="lg:col-span-7"
          >
            <Eyebrow>The pipeline</Eyebrow>
            <h2 className="mt-5 font-display text-[2.1rem] leading-[1.1] tracking-[0.02em] text-[#15213A] sm:text-[2.8rem]">
              What is open right now
            </h2>
          </motion.div>
          <p className="font-sans text-[16px] leading-[1.7] text-[#4A5163] lg:col-span-5">
            Every property below is represented by us directly. Open one to see the site footage, plans and key facts —
            then message the desk.
          </p>
        </div>

        {/* Type filter */}
        <LayoutGroup>
          <div role="tablist" aria-label="Filter by property type" className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
            {tabs.map(t => {
              const active = cat === t.key
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCat(t.key)}
                  className={`relative inline-flex h-11 shrink-0 items-center gap-2.5 border px-4 font-sans text-[13.5px] font-medium transition-colors duration-300 ${
                    active ? 'border-[#15213A] text-[#F7F3EC]' : 'border-[#B0834A]/35 text-[#2E3648] hover:border-[#15213A]'
                  }`}
                >
                  {active && <motion.span layoutId="pipeline-tab" className="absolute inset-0 -z-0 bg-[#15213A]" transition={{ duration: 0.4, ease: EASE }} />}
                  <span className="relative">{t.label}</span>
                  <span
                    className={`relative flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                      active ? 'bg-[#E6C9A0] text-[#15213A]' : 'bg-[#E4DACA] text-[#4A5163]'
                    }`}
                  >
                    {t.n}
                  </span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>

        <motion.div layout className="-mx-5 mt-8 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-3 no-scrollbar sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-x-7 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((m, i) => (
              <motion.div
                key={m.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: EASE, delay: i * 0.04 }}
                className="w-[82%] shrink-0 snap-start sm:w-auto"
              >
                <MandateCard
                  mandate={m}
                  index={i}
                  onOpen={() => openProperty(router, m)}
                  saved={shortlist.has(m.slug)}
                  onToggleSave={() => shortlist.toggle(m.slug)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <p className="mt-3 font-sans text-[12.5px] text-[#5F6575] sm:hidden">Swipe to see more →</p>
        <div className="mt-10 flex flex-col items-center gap-3 text-center sm:mt-14">
          <Button arrow href={cat === 'all' ? '/properties' : `/properties?cat=${cat}`}>
            {more > 0 ? `See all ${list.length} ${cat === 'all' ? 'properties' : CATEGORY_LABELS[cat].toLowerCase()}` : 'Open the full portfolio'}
          </Button>
          <p className="font-sans text-[13px] text-[#5F6575]">Filter by type, region and size · save a shortlist · share it with the desk</p>
        </div>
      </div>
    </section>
  )
}
