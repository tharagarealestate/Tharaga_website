'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { CATEGORY_LABELS, whatsappLink, type Mandate } from '@/lib/mandates'
import { BadgeTag, EASE, EnquireLink, StatPills } from './primitives'
import { MandateVisual, isPlate } from './MandateVisual'

const FRAME =
  'relative overflow-hidden bg-[#E4DACA] outline outline-1 outline-offset-0 outline-transparent transition-[outline-color,box-shadow] duration-700 group-hover:outline-[#B0834A]/70 group-hover:shadow-[0_40px_80px_-40px_rgba(21,33,58,0.55)]'

function useCardKeys(onOpen: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen()
      }
    },
  }
}

/** Corner registration marks — a quiet printer's detail on every frame. */
function Corners() {
  const c = 'absolute h-3 w-3 border-[#E6C9A0]/80 transition-all duration-700 group-hover:h-5 group-hover:w-5'
  return (
    <>
      <span aria-hidden className={`${c} left-3 top-3 border-l border-t`} />
      <span aria-hidden className={`${c} right-3 top-3 border-r border-t`} />
      <span aria-hidden className={`${c} left-3 bottom-3 border-l border-b`} />
      <span aria-hidden className={`${c} right-3 bottom-3 border-r border-b`} />
    </>
  )
}

/** Large editorial card for flagship mandates. Alternates image side. */
export function FeatureMandate({ mandate, index, onOpen }: { mandate: Mandate; index: number; onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-7%', '7%'])
  const flip = index % 2 === 1
  const keys = useCardKeys(onOpen)
  const roman = ['I', 'II', 'III', 'IV', 'V'][index] ?? String(index + 1)

  return (
    <article
      className="group grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center cursor-pointer outline-none"
      aria-label={`${mandate.name} — view details`}
      {...keys}
    >
      <motion.div
        ref={ref}
        initial={{ clipPath: 'inset(12% 8% 12% 8%)', opacity: 0.4 }}
        whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.4, ease: EASE }}
        className={`lg:col-span-7 aspect-[4/5] sm:aspect-[16/11] ${FRAME} ${flip ? 'lg:order-2' : ''}`}
      >
        <motion.div style={{ y }} className="absolute -inset-y-[9%] inset-x-0">
          <div className="absolute inset-0 transition-transform duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
            <MandateVisual mandate={mandate} priority={index === 0} sizes="(min-width:1024px) 58vw, 100vw" />
          </div>
        </motion.div>
        {!isPlate(mandate) && <div className="absolute inset-0 bg-gradient-to-t from-[#0E1729]/75 via-transparent to-[#0E1729]/10" />}
        <Corners />
        <div className="absolute top-6 left-6">{mandate.badge && <BadgeTag badge={mandate.badge} onDark />}</div>
        <div className="absolute inset-x-7 bottom-7 overflow-hidden">
          <p className="font-serif italic text-2xl sm:text-[1.7rem] leading-snug text-[#F7F3EC] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-y-full lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
            “{mandate.tagline}”
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
        className={`lg:col-span-5 ${flip ? 'lg:order-1' : ''}`}
      >
        <div className="flex items-baseline gap-5">
          <span className="font-display text-[3.4rem] leading-none text-[#B0834A]/35 transition-colors duration-700 group-hover:text-[#B0834A]">
            {roman}
          </span>
          <p className="font-sans text-[10.5px] uppercase tracking-[0.22em] text-[#94643A]">
            {CATEGORY_LABELS[mandate.category]}
          </p>
        </div>
        <h3 className="mt-6 font-display text-[2rem] sm:text-[2.5rem] leading-[1.12] tracking-[0.02em] text-[#15213A]">
          {mandate.name}
        </h3>
        <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.24em] text-[#7D8292]">
          {mandate.location} · {mandate.region}
        </p>
        <div className="mt-7 flex items-center gap-2" aria-hidden>
          <span className="h-px w-12 bg-[#B0834A]" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[#B0834A]" />
        </div>
        <p className="mt-7 font-serif text-[1.35rem] leading-[1.55] text-[#2E3648]">{mandate.teaser}</p>
        <div className="mt-7">
          <StatPills stats={mandate.stats} />
        </div>
        <div className="mt-9 flex items-center gap-9">
          <span className="relative font-sans text-[10.5px] uppercase tracking-[0.22em] text-[#15213A]">
            View the dossier
            <span className="absolute left-0 -bottom-1.5 h-px w-full origin-left scale-x-0 bg-[#B0834A] transition-transform duration-500 group-hover:scale-x-100" />
          </span>
          <span onClick={e => e.stopPropagation()}>
            <EnquireLink href={whatsappLink(mandate.name)} />
          </span>
        </div>
      </motion.div>
    </article>
  )
}

/** Portfolio grid card. */
export function MandateCard({
  mandate,
  index,
  onOpen,
  tall = false,
  saved,
  onToggleSave,
}: {
  mandate: Mandate
  index: number
  onOpen: () => void
  tall?: boolean
  saved?: boolean
  onToggleSave?: () => void
}) {
  const keys = useCardKeys(onOpen)
  const plate = isPlate(mandate)
  return (
    <motion.article
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1, ease: EASE, delay: (index % 3) * 0.1 }}
      className="group cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#B0834A]"
      aria-label={`${mandate.name} — view details`}
      {...keys}
    >
      <div className={`${FRAME} ${tall ? 'aspect-[5/4] sm:aspect-[4/5]' : 'aspect-[5/4]'}`}>
        <div className="absolute inset-0 transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
          <MandateVisual mandate={mandate} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
        </div>
        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            plate ? 'from-[#0E1729]/90 via-[#0E1729]/25 to-transparent' : 'from-[#0B1220]/95 via-[#0B1220]/35 to-[#0B1220]/30'
          }`}
        />
        <Corners />

        <div className="absolute top-6 left-6 right-6 flex items-start justify-between gap-2">
          {mandate.badge ? <BadgeTag badge={mandate.badge} onDark /> : <span />}
          <span className="hidden bg-[#0B1220]/55 px-2 py-1 font-sans text-[10.5px] uppercase tracking-[0.18em] text-[#F7F3EC] backdrop-blur-sm sm:inline">
            {CATEGORY_LABELS[mandate.category]}
          </span>
        </div>

        <div className="absolute inset-x-6 bottom-6 text-[#F7F3EC]">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-[#F0DDBF] [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">{mandate.location}</p>
          <h3 className="mt-2.5 font-display text-[1.3rem] sm:text-[1.4rem] leading-[1.22] tracking-[0.02em] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">{mandate.name}</h3>
          <div className="hidden transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr] lg:group-focus-visible:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <p className="pt-3 font-serif text-[1.08rem] leading-relaxed text-white/85 transition-all duration-700 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                {mandate.teaser}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5">
        <StatPills stats={mandate.stats} />
        <div className="mt-4 flex items-center justify-between border-t border-[#B0834A]/25 pt-4">
          <span className="hidden pr-4 font-serif text-[1.08rem] italic text-[#4A5163] line-clamp-1 sm:block">{mandate.tagline}</span>
          <span onClick={e => e.stopPropagation()} className="flex w-full shrink-0 items-center justify-between gap-5 sm:w-auto sm:justify-end">
            {onToggleSave && <SaveToggle saved={!!saved} onToggle={onToggleSave} />}
            <EnquireLink href={whatsappLink(mandate.name)} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}

/** Shortlist toggle: a hollow diamond that fills when saved. */
export function SaveToggle({ saved, onToggle, tone = 'dark' }: { saved: boolean; onToggle: () => void; tone?: 'dark' | 'light' }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onToggle()
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'}
      className={`group/save inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.2em] ${
        tone === 'dark' ? 'text-[#4A5163] hover:text-[#15213A]' : 'text-white/75 hover:text-white'
      }`}
    >
      <motion.span
        animate={saved ? { scale: [1, 1.5, 1], rotate: 45 } : { scale: 1, rotate: 45 }}
        transition={{ duration: 0.45 }}
        className={`block h-2.5 w-2.5 border border-[#B0834A] transition-colors ${saved ? 'bg-[#B0834A]' : 'bg-transparent group-hover/save:bg-[#B0834A]/30'}`}
      />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
