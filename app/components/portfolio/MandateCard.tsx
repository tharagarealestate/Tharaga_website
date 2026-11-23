'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { CATEGORY_LABELS, whatsappLink, type Mandate } from '@/lib/mandates'
import { BadgeTag, EASE, EnquireLink, Grain, StatPills } from './primitives'

const GLOW =
  'transition-[box-shadow,border-color] duration-700 border border-transparent group-hover:border-[#C5A059]/70 group-hover:shadow-[0_0_0_1px_rgba(197,160,89,0.35),0_30px_80px_-30px_rgba(158,123,79,0.55)]'

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

/** Large editorial card for flagship mandates. Alternates image side. */
export function FeatureMandate({
  mandate,
  index,
  onOpen,
}: {
  mandate: Mandate
  index: number
  onOpen: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%'])
  const flip = index % 2 === 1
  const keys = useCardKeys(onOpen)

  return (
    <motion.article
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1, ease: EASE }}
      className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center cursor-pointer outline-none"
      aria-label={`${mandate.name} — view details`}
      {...keys}
    >
      <div
        ref={ref}
        className={`relative lg:col-span-7 aspect-[4/5] sm:aspect-[16/11] overflow-hidden rounded-[2px] bg-[#E8E2D6] ${GLOW} ${
          flip ? 'lg:order-2' : ''
        }`}
      >
        <motion.div style={{ y }} className="absolute -inset-y-[10%] inset-x-0">
          <Image
            src={mandate.image}
            alt={mandate.imageAlt}
            fill
            priority={index === 0}
            sizes="(min-width:1024px) 58vw, 100vw"
            className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816]/70 via-transparent to-[#1A1816]/10" />
        <Grain opacity={0.1} />
        <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-3">
          {mandate.badge ? <BadgeTag badge={mandate.badge} onDark /> : <span />}
          <span className="font-serif text-5xl leading-none text-white/80">{String(index + 1).padStart(2, '0')}</span>
        </div>
        {/* Slide-up reveal on hover (always visible on touch) */}
        <div className="absolute inset-x-5 bottom-5 overflow-hidden">
          <p className="font-serif italic text-xl sm:text-2xl text-[#FAF8F5] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-y-full lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
            “{mandate.tagline}”
          </p>
        </div>
      </div>

      <div className={`lg:col-span-5 ${flip ? 'lg:order-1' : ''}`}>
        <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[#9E7B4F]">
          {CATEGORY_LABELS[mandate.category]} · {mandate.location}
        </p>
        <h3 className="mt-4 font-serif text-4xl sm:text-5xl leading-[1.02] tracking-[-0.01em] text-[#1A1816]">
          {mandate.name}
        </h3>
        <p className="mt-2 font-sans text-xs uppercase tracking-[0.2em] text-[#8E887E]">{mandate.region}</p>
        <div className="mt-6 h-px w-16 bg-[#C5A059]" />
        <p className="mt-6 font-sans text-base font-light leading-relaxed text-[#5A564F]">{mandate.teaser}</p>
        <div className="mt-6">
          <StatPills stats={mandate.stats} />
        </div>
        <div className="mt-8 flex items-center gap-8">
          <span
            className="group/cta relative font-sans text-[11px] uppercase tracking-[0.28em] text-[#1A1816]"
          >
            Discover
            <span className="absolute left-0 -bottom-1.5 h-px w-full origin-left scale-x-0 bg-[#C5A059] transition-transform duration-500 group-hover:scale-x-100" />
          </span>
          <span onClick={e => e.stopPropagation()}>
            <EnquireLink href={whatsappLink(mandate.name)} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}

/** Portfolio grid card. */
export function MandateCard({
  mandate,
  index,
  onOpen,
  tall = false,
}: {
  mandate: Mandate
  index: number
  onOpen: () => void
  tall?: boolean
}) {
  const keys = useCardKeys(onOpen)
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease: EASE, delay: (index % 3) * 0.12 }}
      className="group cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#C5A059]"
      aria-label={`${mandate.name} — view details`}
      {...keys}
    >
      <div
        className={`relative overflow-hidden rounded-[2px] bg-[#E8E2D6] ${GLOW} ${
          tall ? 'aspect-[4/5]' : 'aspect-[4/5] sm:aspect-[5/4]'
        }`}
      >
        <Image
          src={mandate.image}
          alt={mandate.imageAlt}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816]/85 via-[#1A1816]/10 to-transparent" />
        <Grain opacity={0.08} />

        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
          {mandate.badge ? <BadgeTag badge={mandate.badge} onDark /> : <span />}
          <span className="rounded-full bg-[#FAF8F5]/10 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-[9px] font-sans uppercase tracking-[0.22em] text-white/85">
            {CATEGORY_LABELS[mandate.category]}
          </span>
        </div>

        <div className="absolute inset-x-5 bottom-5 text-[#FAF8F5]">
          <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-[#E9D3A4]">
            {mandate.location} · {mandate.region}
          </p>
          <h3 className="mt-2 font-serif text-2xl sm:text-[1.7rem] leading-[1.08]">{mandate.name}</h3>
          {/* Text slide-up reveal */}
          <div className="grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr] lg:group-focus-visible:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <p className="pt-3 font-sans text-sm font-light leading-relaxed text-white/80 transition-all duration-700 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                {mandate.teaser}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <StatPills stats={mandate.stats} />
        <div className="mt-4 flex items-center justify-between">
          <span className="font-serif italic text-[15px] text-[#5A564F] line-clamp-1 pr-4">{mandate.tagline}</span>
          <span onClick={e => e.stopPropagation()} className="shrink-0">
            <EnquireLink href={whatsappLink(mandate.name)} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}
