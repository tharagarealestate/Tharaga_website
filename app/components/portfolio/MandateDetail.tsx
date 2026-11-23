'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import { X, Phone } from 'lucide-react'
import { CATEGORY_LABELS, DESK_PHONE_DISPLAY, telLink, whatsappLink, type Mandate } from '@/lib/mandates'
import { BadgeTag, EASE, Grain, StatPills } from './primitives'

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile
}

/**
 * Progressive-disclosure detail view.
 * Desktop: centred editorial modal. Mobile: draggable bottom sheet.
 */
export function MandateDetail({ mandate, onClose }: { mandate: Mandate | null; onClose: () => void }) {
  const mobile = useIsMobile()
  const drag = useDragControls()

  useEffect(() => {
    if (!mandate) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mandate, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return (
    <AnimatePresence>
      {mandate && (
        <motion.div
          key="scrim"
          className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-[#1A1816]/60 backdrop-blur-sm md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={mandate.name}
            onClick={e => e.stopPropagation()}
            className="relative w-full md:max-w-5xl h-[90svh] md:h-auto md:max-h-[88vh] overflow-hidden bg-[#FAF8F5] rounded-t-[22px] md:rounded-[3px] shadow-2xl md:grid md:grid-cols-[1.05fr_1fr]"
            initial={mobile ? { y: '100%' } : { opacity: 0, y: 30, scale: 0.98 }}
            animate={mobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={mobile ? { y: '100%' } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.55, ease: EASE }}
            drag={mobile ? 'y' : false}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {/* Mobile grab handle */}
            <div className="md:hidden absolute top-2.5 left-1/2 -translate-x-1/2 z-20 h-1 w-10 rounded-full bg-white/70" />

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF8F5]/90 border border-[#E8E2D6] text-[#1A1816] hover:border-[#C5A059] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className="relative h-[38%] md:h-full md:min-h-[560px] bg-[#E8E2D6] touch-none md:touch-auto"
              onPointerDown={e => mobile && drag.start(e)}
            >
              <Image src={mandate.image} alt={mandate.imageAlt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816]/80 via-transparent to-[#1A1816]/20" />
              <Grain opacity={0.12} />
              <div className="absolute left-6 right-6 bottom-6 text-[#FAF8F5]">
                {mandate.badge && <BadgeTag badge={mandate.badge} onDark />}
                <p className="mt-4 font-serif italic text-xl md:text-2xl leading-snug">“{mandate.tagline}”</p>
              </div>
            </div>

            <div className="h-[62%] md:h-auto md:max-h-[88vh] overflow-y-auto overscroll-contain px-6 py-7 md:px-10 md:py-12">
              <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[#9E7B4F]">
                {CATEGORY_LABELS[mandate.category]}
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-[2.6rem] leading-[1.04] text-[#1A1816]">{mandate.name}</h2>
              <p className="mt-2 font-sans text-xs uppercase tracking-[0.2em] text-[#8E887E]">
                {mandate.location} · {mandate.region}
              </p>

              <div className="mt-6">
                <StatPills stats={mandate.stats} />
              </div>

              <div className="my-7 border-t border-[#C5A059]/30" />

              <p className="font-sans text-[15px] font-light leading-relaxed text-[#3E3A35]">{mandate.story}</p>

              <h3 className="mt-8 font-sans text-[11px] uppercase tracking-[0.28em] text-[#1A1816]">Highlights</h3>
              <ul className="mt-4 space-y-3">
                {mandate.highlights.map(h => (
                  <li key={h} className="flex gap-3 font-sans text-sm font-light text-[#5A564F]">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#C5A059]" />
                    {h}
                  </li>
                ))}
              </ul>

              <h3 className="mt-8 font-sans text-[11px] uppercase tracking-[0.28em] text-[#1A1816]">Ideal for</h3>
              <p className="mt-3 font-sans text-sm font-light text-[#5A564F]">{mandate.idealFor}</p>

              <div className="mt-8 rounded-[2px] border border-[#E8E2D6] bg-white/60 p-5">
                <p className="font-sans text-[11px] uppercase tracking-[0.24em] text-[#9E7B4F]">Pricing & documents</p>
                <p className="mt-2 font-sans text-sm font-light text-[#5A564F]">
                  Shared privately with verified buyers. Speak to the managing desk to receive the full dossier.
                </p>
              </div>

              <div className="sticky bottom-0 -mx-6 md:-mx-10 mt-8 flex flex-row gap-2 sm:gap-3 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent px-6 md:px-10 pt-6 pb-2">
                <a
                  href={whatsappLink(mandate.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-full bg-[#1A1816] px-4 sm:px-6 py-3.5 text-center font-sans text-[11px] uppercase tracking-[0.26em] text-[#FAF8F5] hover:bg-[#2D2926] transition-colors"
                >
                  <span className="sm:hidden">WhatsApp</span>
                  <span className="hidden sm:inline">Enquire on WhatsApp</span>
                </a>
                <a
                  href={telLink}
                  className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#C5A059]/60 px-4 sm:px-6 py-3.5 font-sans text-[11px] uppercase tracking-[0.26em] text-[#1A1816] hover:bg-[#F4EFE6] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-[#9E7B4F]" />
                  <span className="sm:hidden">Call Desk</span>
                  <span className="hidden sm:inline">{DESK_PHONE_DISPLAY}</span>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
