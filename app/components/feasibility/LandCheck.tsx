'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  EXTENTS,
  REGIONS,
  STAGES,
  USES,
  buildReport,
  summaryText,
  type LandCheckAnswers,
} from '@/lib/feasibility'
import { DESK_PHONE_DISPLAY, telLink, whatsappLink, type Mandate } from '@/lib/mandates'
import { Button } from '@/components/brand/Button'
import { MandateVisual } from '@/components/portfolio/MandateVisual'

const EASE = [0.22, 1, 0.36, 1] as const

const STEPS = [
  { key: 'use', q: 'What do you want to use the land for?', options: USES },
  { key: 'region', q: 'Where in Tamil Nadu?', options: REGIONS },
  { key: 'extent', q: 'How much land?', options: EXTENTS },
  { key: 'stage', q: 'Where are you in the process?', options: STAGES },
] as const

type Partial = { [K in keyof LandCheckAnswers]?: LandCheckAnswers[K] }

export function LandCheck({ onOpenMandate }: { onOpenMandate?: (m: Mandate) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial>({})
  const done = step >= STEPS.length
  const report = useMemo(() => (done ? buildReport(answers as LandCheckAnswers) : null), [done, answers])

  const choose = (key: string, id: string) => {
    setAnswers(a => ({ ...a, [key]: id }))
    setTimeout(() => setStep(s => s + 1), 180)
  }
  const restart = () => {
    setAnswers({})
    setStep(0)
  }

  return (
    <div className="border border-[#D6CAB5] bg-[#FBF8F2]">
      {/* Progress rail */}
      <div className="flex items-stretch border-b border-[#D6CAB5]" role="list" aria-label="Progress">
        {STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'todo'
          const label = (s.options as readonly { id: string; label: string }[]).find(o => o.id === (answers as any)[s.key])?.label
          return (
            <button
              key={s.key}
              role="listitem"
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={`relative flex-1 px-3 py-4 text-left transition-colors sm:px-5 ${
                state === 'current' ? 'bg-[#F7F3EC]' : ''
              } ${i < step ? 'hover:bg-[#EFE8DC]' : ''} ${i > 0 ? 'border-l border-[#D6CAB5]' : ''}`}
            >
              <span className={`block font-display text-xs ${state === 'todo' ? 'text-[#A9A190]' : 'text-[#94643A]'}`}>
                {['I', 'II', 'III', 'IV'][i]}
              </span>
              <span
                className={`mt-1 hidden font-sans text-[9.5px] uppercase tracking-[0.2em] sm:block ${
                  state === 'todo' ? 'text-[#A9A190]' : 'text-[#15213A]'
                }`}
              >
                {state === 'done' && label ? label : ['Use', 'Location', 'Extent', 'Stage'][i]}
              </span>
              <span
                className={`absolute inset-x-0 bottom-0 h-[3px] origin-left transition-transform duration-500 ${
                  state === 'todo' ? 'scale-x-0' : 'scale-x-100'
                } ${state === 'current' ? 'bg-[#B0834A]' : 'bg-[#15213A]'}`}
              />
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="p-6 sm:p-10"
          >
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#94643A]">
              Question {step + 1} of {STEPS.length}
            </p>
            <h3 className="mt-3 font-display text-2xl tracking-[0.03em] text-[#15213A] sm:text-[2rem] sm:leading-tight">
              {STEPS[step].q}
            </h3>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(STEPS[step].options as readonly { id: string; label: string; hint: string }[]).map(o => {
                const selected = (answers as any)[STEPS[step].key] === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => choose(STEPS[step].key, o.id)}
                    aria-pressed={selected}
                    className={`group flex min-h-[84px] items-start justify-between gap-4 border p-5 text-left transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B0834A] ${
                      selected
                        ? 'border-[#15213A] bg-[#15213A] text-[#F7F3EC]'
                        : 'border-[#D6CAB5] bg-[#F7F3EC] hover:border-[#15213A]'
                    }`}
                  >
                    <span>
                      <span className={`block font-sans text-[12px] font-semibold uppercase tracking-[0.16em] ${selected ? 'text-[#F7F3EC]' : 'text-[#15213A]'}`}>
                        {o.label}
                      </span>
                      <span className={`mt-1.5 block font-serif text-[1.02rem] ${selected ? 'text-white/70' : 'text-[#7D8292]'}`}>{o.hint}</span>
                    </span>
                    <span
                      aria-hidden
                      className={`mt-1 h-3 w-3 shrink-0 rotate-45 border transition-colors ${
                        selected ? 'border-[#E6C9A0] bg-[#E6C9A0]' : 'border-[#B0834A] group-hover:bg-[#B0834A]/30'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="mt-8 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7D8292] hover:text-[#15213A]"
              >
                ← Previous question
              </button>
            )}
          </motion.div>
        ) : (
          report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="p-6 sm:p-10"
            >
              <div className="flex flex-col gap-4 border-b border-[#D6CAB5] pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#94643A]">Your land check</p>
                  <h3 className="mt-3 font-display text-2xl tracking-[0.03em] text-[#15213A] sm:text-3xl">
                    {USES.find(u => u.id === answers.use)?.label} · {REGIONS.find(r => r.id === answers.region)?.label}
                  </h3>
                  <p className="mt-2 font-serif text-lg text-[#4A5163]">
                    {EXTENTS.find(e => e.id === answers.extent)?.label} · {STAGES.find(s => s.id === answers.stage)?.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={restart}
                  className="self-start font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7D8292] underline decoration-[#B0834A]/50 underline-offset-[6px] hover:text-[#15213A] sm:self-auto"
                >
                  Start again
                </button>
              </div>

              <div className="mt-8 grid gap-10 lg:grid-cols-2">
                <ReportList n="01" title="What to check before you commit" items={report.checks} />
                <div className="space-y-10">
                  <ReportList n="02" title="Approvals you will typically need" items={report.approvals} />
                  <ReportList n="03" title="What only a site study can confirm" items={report.siteStudy} muted />
                </div>
              </div>

              {(report.matches.length > 0 || report.nearMatches.length > 0) && (
                <div className="mt-12 border-t border-[#D6CAB5] pt-10">
                  <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#94643A]">
                    {report.matches.length ? 'Properties in our portfolio that fit' : 'Closest properties in our portfolio'}
                  </p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {(report.matches.length ? report.matches : report.nearMatches).map(m => (
                      <button
                        key={m.slug}
                        type="button"
                        onClick={() => (onOpenMandate ? onOpenMandate(m) : (window.location.href = `/properties?m=${m.slug}`))}
                        className="group text-left"
                      >
                        <span className="relative block aspect-[4/3] overflow-hidden bg-[#E4DACA]">
                          <span className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                            <MandateVisual mandate={m} sizes="(min-width:1024px) 30vw, 100vw" />
                          </span>
                        </span>
                        <span className="mt-3 block font-display text-[1.05rem] leading-snug text-[#15213A]">{m.name}</span>
                        <span className="mt-1 block font-sans text-[10px] uppercase tracking-[0.2em] text-[#7D8292]">
                          {m.location} · {m.stats[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 grid gap-6 bg-[#15213A] p-6 text-[#F7F3EC] sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div>
                  <p className="font-display text-xl tracking-[0.04em] text-[#F7F3EC]">Want this confirmed for a specific parcel?</p>
                  <p className="mt-2 font-serif text-lg text-white/70">
                    Send us the survey number. A Tharaga advisor checks every point above against the actual records.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                  <Button variant="light" arrow href={whatsappLink(summaryText(answers as LandCheckAnswers))}>
                    Get it verified
                  </Button>
                  <Button variant="outline-light" href={telLink}>
                    {DESK_PHONE_DISPLAY}
                  </Button>
                </div>
              </div>
              <p className="mt-5 font-sans text-[10px] uppercase leading-relaxed tracking-[0.16em] text-[#7D8292]">
                General guidance based on Tamil Nadu approval requirements. It is not legal advice or a valuation —
                requirements for a specific parcel are confirmed by verification.
              </p>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  )
}

function ReportList({ n, title, items, muted = false }: { n: string; title: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-sm text-[#B0834A]">{n}</span>
        <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#15213A]">{title}</h4>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map(t => (
          <li key={t} className="flex gap-3 font-serif text-[1.08rem] leading-snug text-[#2E3648]">
            <span
              aria-hidden
              className={`mt-[7px] h-2 w-2 shrink-0 rotate-45 ${muted ? 'border border-[#B0834A]' : 'bg-[#B0834A]'}`}
            />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
