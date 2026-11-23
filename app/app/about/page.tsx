import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/brand/SiteHeader'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { TharagaWordmark } from '@/components/brand/TharagaWordmark'
import { Eyebrow, Grain } from '@/components/portfolio/primitives'
import { ACQUISITION_BRIEFS, CATEGORY_LABELS, MANDATES, PORTFOLIO_ACRES, whatsappLink } from '@/lib/mandates'

export const metadata: Metadata = {
  title: 'About — Tharaga Estates',
  description:
    'Tharaga Estates is a Chennai-based private advisory that represents owners of land, energy, quarry, commercial and residential assets across Tamil Nadu.',
  alternates: { canonical: '/about' },
}

const PRINCIPLES = [
  {
    title: 'We represent the owner',
    body: 'Each property we show is a mandate given to us by its owner. We are not a listings portal, and nothing here is scraped or syndicated.',
  },
  {
    title: 'We go to the buyer',
    body: 'Large extents, quarries and energy assets are taken directly to the people who decide — land-acquisition, procurement and investment desks — rather than broadcast to the market.',
  },
  {
    title: 'We release information in stages',
    body: 'Location, documents and pricing reach a buyer only once we have spoken to them. Owners stay in control of what is disclosed, and to whom.',
  },
  {
    title: 'We work in both directions',
    body: 'Alongside the assets we sell, we carry live briefs from buyers — so an owner with the right asset can be matched before anything is published.',
  },
]

export default function AboutPage() {
  const categories = Array.from(new Set(MANDATES.map(m => m.category)))
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A]">
      <SmoothScroll />
      <SiteHeader />

      <header className="relative overflow-hidden bg-[#15213A] text-[#F7F3EC] pt-44 pb-24">
        <Grain opacity={0.1} />
        <div aria-hidden className="pointer-events-none absolute inset-4 sm:inset-6 border border-[#E6C9A0]/15" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="flex justify-center">
            <Eyebrow light>About Tharaga Estates</Eyebrow>
          </div>
          <h1 className="mt-9">
            <span className="block font-display text-4xl sm:text-6xl lg:text-7xl tracking-[0.04em] leading-[1.08]">
              Rooted in land.
            </span>
            <span className="block font-serif italic font-light text-5xl sm:text-7xl lg:text-[5.6rem] text-[#E6C9A0]">
              Built on discretion.
            </span>
          </h1>
          <p className="mt-9 max-w-2xl mx-auto font-serif text-[1.35rem] leading-[1.6] text-white/75">
            Tharaga Estates is a private real estate advisory based in Chennai. We represent owners of land, energy,
            quarry, commercial and residential assets across Tamil Nadu — and place them, quietly, with the right buyer.
          </p>
        </div>
      </header>

      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
            <Eyebrow numeral="I">The name</Eyebrow>
            <h2 className="mt-7">
              <span className="block font-display text-3xl sm:text-4xl tracking-[0.04em] text-[#15213A]">Thaa·ra·gaa</span>
              <span className="block font-serif italic font-light text-4xl sm:text-5xl text-[#94643A]">தாரகா</span>
            </h2>
            <p className="mt-7 font-serif text-[1.25rem] leading-[1.6] text-[#2E3648] max-w-md">
              Our emblem grows from roots below the wordmark to a spire above it — land held patiently, value rising from
              it. It is the shape of every mandate we take on.
            </p>
            <div className="mt-10">
              <TharagaWordmark variant="full" height={220} />
            </div>
          </div>

          <ol className="lg:col-span-7 border-t border-[#B0834A]/30">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="group grid grid-cols-[4rem_1fr] gap-6 border-b border-[#B0834A]/30 py-10">
                <span className="font-display text-4xl text-[#B0834A]/40 transition-colors duration-700 group-hover:text-[#B0834A]">
                  {['I', 'II', 'III', 'IV'][i]}
                </span>
                <div>
                  <h3 className="font-display text-xl sm:text-2xl tracking-[0.04em] text-[#15213A]">{p.title}</h3>
                  <p className="mt-4 font-serif text-[1.18rem] leading-[1.6] text-[#4A5163]">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-[#B0834A]/25 bg-[#EFE8DC] py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <Eyebrow numeral="II">What we represent today</Eyebrow>
          <dl className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-y-10 divide-x divide-[#B0834A]/25">
            {[
              { k: 'Live mandates', v: MANDATES.length },
              { k: 'Acres represented', v: `${PORTFOLIO_ACRES.toLocaleString('en-IN')}+` },
              { k: 'Asset classes', v: categories.length },
              { k: 'Buyer briefs', v: ACQUISITION_BRIEFS.length },
            ].map((s, i) => (
              <div key={s.k} className={`flex flex-col-reverse ${i % 2 === 0 ? 'pr-6' : 'px-6'} lg:px-8 lg:first:pl-0`}>
                <dt className="mt-3 font-sans text-[10px] uppercase tracking-[0.3em] text-[#7D8292]">{s.k}</dt>
                <dd className="font-display text-4xl sm:text-5xl text-[#15213A]">{s.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-12 font-serif text-xl text-[#4A5163]">
            {categories.map(c => CATEGORY_LABELS[c]).join(' · ')}
          </p>
        </div>
      </section>

      <section className="py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2>
            <span className="block font-display text-3xl sm:text-5xl tracking-[0.04em] text-[#15213A]">Own something worth placing?</span>
            <span className="block font-serif italic font-light text-4xl sm:text-6xl text-[#94643A]">Let us talk, privately.</span>
          </h2>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link
              href="/properties"
              className="group/a relative overflow-hidden border border-[#15213A] px-9 py-4 font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#15213A] hover:text-[#15213A]"
            >
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-[#15213A] transition-transform duration-500 group-hover/a:scale-y-100" />
              <span className="relative transition-colors duration-500 group-hover/a:text-[#F7F3EC]">View the portfolio</span>
            </Link>
            <a
              href={whatsappLink('placing an asset with Tharaga Estates')}
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#94643A] hover:text-[#15213A] border-b border-[#B0834A] pb-1"
            >
              Speak to the desk
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
