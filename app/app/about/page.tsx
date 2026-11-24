import type { Metadata } from 'next'
import Image from 'next/image'
import { SiteFooter, SiteHeader } from '@/components/brand/SiteHeader'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { TharagaWordmark } from '@/components/brand/TharagaWordmark'
import { Button } from '@/components/brand/Button'
import { Eyebrow, Grain } from '@/components/portfolio/primitives'
import { ACQUISITION_BRIEFS, CATEGORY_LABELS, MANDATES, PORTFOLIO_ACRES, whatsappLink } from '@/lib/mandates'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Tharaga Estates was founded in Chennai in 2024 by Nithish R. We represent owners of land, energy, quarry, commercial and residential property across Tamil Nadu — rooted like the vine, guided by the star.',
  alternates: { canonical: '/about' },
}

const PRINCIPLES = [
  {
    title: 'We represent the owner',
    body: 'Every property we show is one its owner asked us to represent. We are not a listings portal — nothing here is copied from elsewhere.',
  },
  {
    title: 'We go straight to the buyer',
    body: 'Large land, quarries and energy assets go directly to the people who decide — land, procurement and investment teams — instead of being advertised to everyone.',
  },
  {
    title: 'We share information in stages',
    body: 'Location, documents and price reach a buyer only after we have spoken to them. The owner decides what is shared, and with whom.',
  },
  {
    title: 'We work for buyers too',
    body: 'We carry live requests from buyers, so an owner with the right property can be introduced before anything is made public.',
  },
]

export default function AboutPage() {
  const categories = Array.from(new Set(MANDATES.map(m => m.category)))
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A]">
      <SmoothScroll />
      <SiteHeader />

      {/* Masthead */}
      <header className="relative overflow-hidden bg-[#15213A] pb-24 pt-44 text-[#F7F3EC]">
        <Grain opacity={0.1} />
        <div aria-hidden className="pointer-events-none absolute inset-4 border border-[#E6C9A0]/15 sm:inset-6" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="flex justify-center">
            <Eyebrow light>About us · Founded 2024 · Chennai</Eyebrow>
          </div>
          <h1 className="mt-9 text-[#F7F3EC]">
            <span className="block font-display text-[2.4rem] leading-[1.08] tracking-[0.04em] sm:text-6xl lg:text-7xl">Rooted like the vine.</span>{' '}
            <span className="block font-serif text-[2.8rem] font-light italic text-[#E6C9A0] sm:text-7xl lg:text-[5.4rem]">Guided by the star.</span>
          </h1>
          <p className="mx-auto mt-9 max-w-2xl font-serif text-[1.3rem] leading-[1.6] text-white/75">
            Tharaga Estates is a private land and property advisory in Chennai. We represent owners of land, energy, quarry,
            commercial and residential property across Tamil Nadu — and introduce each one, quietly, to the right buyer.
          </p>
        </div>
      </header>

      {/* I — Our name and motto */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Eyebrow numeral="I">Our name and our motto</Eyebrow>
            <div className="mt-10 grid gap-px bg-[#B0834A]/30 sm:grid-cols-2">
              <div className="bg-[#F7F3EC] p-7 sm:pr-10">
                <p className="font-display text-3xl tracking-[0.05em] text-[#15213A]">Tharaga</p>
                <p className="mt-1 font-serif text-3xl italic text-[#94643A]">தாரகா</p>
                <p className="mt-5 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7D8292]">Means</p>
                <p className="mt-1 font-serif text-2xl text-[#2E3648]">A star</p>
              </div>
              <div className="bg-[#F7F3EC] p-7 sm:pl-10">
                <p className="font-display text-3xl tracking-[0.05em] text-[#15213A]">Latha</p>
                <p className="mt-1 font-serif text-3xl italic text-[#94643A]">லதா</p>
                <p className="mt-5 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7D8292]">Means</p>
                <p className="mt-1 font-serif text-2xl text-[#2E3648]">A vine</p>
              </div>
            </div>
            <div className="mt-10 max-w-2xl space-y-5 font-serif text-[1.25rem] leading-[1.65] text-[#2E3648] [&_p]:text-[#2E3648]">
              <p>
                Our company is named Tharaga — a star. Latha, the name of our founder’s mother, means a vine. The two
                belong together: a vine grows from deep roots and climbs towards the light, and a star is what it climbs
                towards.
              </p>
              <p>
                That is how we work. We stay rooted in land, in family values and in honest dealing — and we help every
                client rise towards what they are building. Our emblem draws it exactly: roots beneath the name, a vine
                rising through it, and a star at the very top.
              </p>
            </div>
          </div>
          <figure className="flex min-w-0 flex-col items-center border border-[#D6CAB5] bg-[#FBF8F2] px-4 py-12 sm:px-8 lg:col-span-5">
            <TharagaWordmark variant="full" height={220} />
            <figcaption className="mt-10 text-center">
              <span className="block font-display text-xl tracking-[0.06em] text-[#15213A]">Rooted like the vine.</span>
              <span className="block font-serif text-2xl italic text-[#94643A]">Guided by the star.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* II — Founder */}
      <section className="border-y border-[#B0834A]/25 bg-[#EFE8DC] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:items-center lg:gap-16">
          <figure className="relative mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
            <span aria-hidden className="absolute -bottom-3 -right-3 hidden h-full w-full border border-[#B0834A]/50 sm:block" />
            <div className="relative aspect-[4/5] overflow-hidden bg-[#D6CAB5]">
              <Image
                src="/brand/founder-nithish-r-v3.jpg"
                alt="Nithish R, Founder of Tharaga Estates"
                fill
                sizes="(min-width:1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          </figure>
          <div className="lg:col-span-7">
            <Eyebrow numeral="II">Our founder</Eyebrow>
            <h2 className="mt-7 text-[#15213A]">
              <span className="block font-display text-[2.4rem] leading-[1.08] tracking-[0.05em] sm:text-6xl">Nithish R</span>{' '}
              <span className="mt-2 block font-serif text-2xl italic text-[#94643A] sm:text-3xl">Founder, Tharaga Estates</span>
            </h2>
            <div className="mt-8 max-w-2xl space-y-5 font-serif text-[1.25rem] leading-[1.65] text-[#2E3648] [&_p]:text-[#2E3648]">
              <p>
                Nithish R founded Tharaga Estates in Chennai in 2024, after a career in business-to-business sales. He
                built the firm on a simple belief: serious land and property should change hands quietly, through people
                who understand both the asset and the buyer.
              </p>
              <p>
                Under his lead, Tharaga represents land banks, solar and energy assets, quarries, commercial buildings and
                homes across Tamil Nadu — and takes each one directly to the buyers best placed to act.
              </p>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-[#B0834A]/30 border-y border-[#B0834A]/30">
              {[
                { k: 'Founded', v: '2024' },
                { k: 'Based in', v: 'Chennai' },
                { k: 'Active in', v: 'Tamil Nadu' },
              ].map((s, i) => (
                <div key={s.k} className={`flex flex-col-reverse py-5 ${i === 0 ? 'pr-4' : 'px-4'}`}>
                  <dt className="mt-1 font-sans text-[9.5px] uppercase tracking-[0.26em] text-[#7D8292]">{s.k}</dt>
                  <dd className="font-display text-xl tracking-[0.04em] text-[#15213A] sm:text-2xl">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* III — How we work */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12">
          <div className="self-start lg:sticky lg:top-32 lg:col-span-4">
            <Eyebrow numeral="III">How we work</Eyebrow>
            <h2 className="mt-7 text-[#15213A]">
              <span className="block font-display text-[2rem] leading-[1.1] tracking-[0.04em] sm:text-[2.6rem]">Four promises</span>{' '}
              <span className="block font-serif text-[2.4rem] font-light italic text-[#94643A] sm:text-[3rem]">we keep.</span>
            </h2>
          </div>
          <ol className="border-t border-[#B0834A]/30 lg:col-span-8">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="group grid grid-cols-[3.5rem_1fr] gap-5 border-b border-[#B0834A]/30 py-8 sm:grid-cols-[4.5rem_1fr]">
                <span className="font-display text-3xl text-[#B0834A]/40 transition-colors duration-500 group-hover:text-[#B0834A]">
                  {['I', 'II', 'III', 'IV'][i]}
                </span>
                <div>
                  <h3 className="font-display text-xl tracking-[0.04em] text-[#15213A] sm:text-2xl">{p.title}</h3>
                  <p className="mt-3 font-serif text-[1.15rem] leading-[1.6] text-[#4A5163]">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* IV — Today */}
      <section className="border-y border-[#B0834A]/25 bg-[#15213A] py-20 text-[#F7F3EC]">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <Eyebrow numeral="IV" light>
            What we represent today
          </Eyebrow>
          <dl className="mt-10 grid grid-cols-2 gap-y-10 lg:grid-cols-4">
            {[
              { k: 'Properties', v: MANDATES.length },
              { k: 'Acres represented', v: `${PORTFOLIO_ACRES.toLocaleString('en-IN')}+` },
              { k: 'Property types', v: categories.length },
              { k: 'Buyer requests', v: ACQUISITION_BRIEFS.length },
            ].map(s => (
              <div key={s.k} className="flex flex-col-reverse border-l border-[#E6C9A0]/20 pl-5">
                <dt className="mt-3 font-sans text-[10px] uppercase tracking-[0.28em] text-white/55">{s.k}</dt>
                <dd className="font-display text-4xl text-[#F7F3EC] sm:text-5xl">{s.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 font-serif text-xl text-white/70">{categories.map(c => CATEGORY_LABELS[c]).join(' · ')}</p>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-[#15213A]">
            <span className="block font-display text-[2rem] tracking-[0.04em] sm:text-5xl">Have a property to sell?</span>{' '}
            <span className="block font-serif text-[2.4rem] font-light italic text-[#94643A] sm:text-6xl">Let us talk, privately.</span>
          </h2>
          <div className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button arrow href={whatsappLink('selling or leasing a property with Tharaga Estates')}>
              Speak to us
            </Button>
            <Button variant="secondary" href="/properties">
              View properties
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
