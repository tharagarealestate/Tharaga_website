'use client'

import { useState } from 'react'
import { Check, Clock, Printer, Share2 } from 'lucide-react'
import type { LegalSection } from '@/types/legal'

interface Props {
  title: string
  lastUpdated: string
  documentType: string
  sections: LegalSection[]
  metadata?: { compliance_standards?: string[] }
}

/** Renders plain text where lines starting with "- " become a bullet list. */
function Body({ text }: { text: string }) {
  const blocks: { type: 'p' | 'ul'; lines: string[] }[] = []
  for (const line of text.split('\n')) {
    const isItem = line.trim().startsWith('- ')
    const last = blocks[blocks.length - 1]
    if (isItem) {
      if (last?.type === 'ul') last.lines.push(line.trim().slice(2))
      else blocks.push({ type: 'ul', lines: [line.trim().slice(2)] })
    } else if (line.trim()) {
      blocks.push({ type: 'p', lines: [line] })
    }
  }
  return (
    <div className="space-y-3 font-sans text-[15.5px] leading-[1.75] text-[#2E3648] sm:text-[16px]">
      {blocks.map((b, i) =>
        b.type === 'p' ? (
          <p key={i} className="text-[#2E3648]">{b.lines[0]}</p>
        ) : (
          <ul key={i} className="space-y-2">
            {b.lines.map(l => (
              <li key={l} className="flex gap-3 text-[#2E3648]">
                <span aria-hidden className="mt-[11px] h-1 w-1 shrink-0 rotate-45 bg-[#B0834A]" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}

export function LegalDocumentLayout({ title, lastUpdated, sections, metadata }: Props) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, url: location.href })
      else {
        await navigator.clipboard.writeText(location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  return (
    <article className="border border-[#D6CAB5] bg-[#FBF8F2]">
      <header className="bg-[#15213A] px-6 py-9 text-[#F7F3EC] sm:px-12 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-[2rem] leading-tight tracking-[0.03em] text-[#FBF8F2] sm:text-[2.8rem]">{title}</h1>
            <p className="mt-3 flex items-center gap-2 font-sans text-[13.5px] text-white/75">
              <Clock className="h-4 w-4" />
              Last updated {new Date(lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 border border-white/20 px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EC] hover:border-[#E6C9A0]">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={share} className="inline-flex h-10 items-center gap-2 border border-white/20 px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EC] hover:border-[#E6C9A0]">
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} {copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
        {metadata?.compliance_standards && (
          <div className="mt-6 flex flex-wrap gap-2">
            {metadata.compliance_standards.map(s => (
              <span key={s} className="border border-white/15 px-3 py-1 font-sans text-[12px] text-white/80">{s}</span>
            ))}
          </div>
        )}
      </header>

      <div className="px-6 py-10 sm:px-12 sm:py-12">
        {sections.map(section => (
          <section key={section.id} id={section.id} className="scroll-mt-28 border-b border-[#E4DACA] py-8 first:pt-0 last:border-0 last:pb-0">
            <h2 className="mb-4 font-display text-[1.35rem] leading-snug tracking-[0.02em] text-[#15213A] sm:text-[1.55rem]">{section.heading}</h2>
            <Body text={section.content} />
            {section.subsections?.map(sub => (
              <div key={sub.id} id={sub.id} className="mt-6 border-l-2 border-[#B0834A] pl-5">
                <h3 className="mb-2 font-sans text-[15px] font-semibold text-[#15213A]">{sub.heading}</h3>
                <Body text={sub.content} />
              </div>
            ))}
          </section>
        ))}
      </div>
    </article>
  )
}
