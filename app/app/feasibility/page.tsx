import type { Metadata } from 'next'
import { SiteFooter, SiteHeader } from '@/components/brand/SiteHeader'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { LandCheck } from '@/components/feasibility/LandCheck'
import { Eyebrow, Grain } from '@/components/portfolio/primitives'

export const metadata: Metadata = {
  title: 'Land Check — What is your land right for? | Tharaga Estates',
  description:
    'Answer four questions and see what to check, which Tamil Nadu approvals apply, and which properties in our portfolio fit — for solar, quarries, factories, commercial and residential land.',
  alternates: { canonical: '/feasibility' },
}

const TRUST = [
  { k: '4 questions', v: 'About a minute' },
  { k: 'Tamil Nadu rules', v: 'Approvals that actually apply' },
  { k: 'Real portfolio', v: 'Only properties we represent' },
]

export default function FeasibilityPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A]">
      <SmoothScroll />
      <SiteHeader />
      <header className="relative overflow-hidden bg-[#15213A] pb-20 pt-40 text-[#F7F3EC] sm:pt-44">
        <Grain opacity={0.1} />
        <div aria-hidden className="pointer-events-none absolute inset-4 border border-[#E6C9A0]/15 sm:inset-6" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow light>Free land check</Eyebrow>
            <h1 className="mt-8 text-[#F7F3EC]">
              <span className="block font-display text-[2.4rem] leading-[1.08] tracking-[0.03em] sm:text-6xl">Find out what your land</span>{' '}
              <span className="block font-serif text-[2.9rem] font-light italic leading-[1.05] text-[#E6C9A0] sm:text-7xl">is right for.</span>
            </h1>
            <p className="mt-8 max-w-xl font-serif text-[1.3rem] leading-[1.6] text-white/75">
              Tell us the use, the place and the size. You get the checks to make, the approvals that apply in Tamil Nadu,
              and the properties in our portfolio that fit.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-px bg-[#E6C9A0]/15 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
            {TRUST.map(t => (
              <div key={t.k} className="bg-[#15213A] py-4 sm:px-5 lg:px-0 lg:pl-6">
                <dt className="font-display text-lg tracking-[0.04em]">{t.k}</dt>
                <dd className="mt-1 font-sans text-[10px] uppercase tracking-[0.24em] text-white/55">{t.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="relative -mt-10 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <LandCheck />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
