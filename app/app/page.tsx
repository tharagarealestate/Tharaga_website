import React from 'react'
import { fetchRecommendations } from '@/lib/api'
import type { RecommendationItem } from '@/types/recommendations'
import { RecommendationsCarousel } from '@/features/recommendations/RecommendationsCarousel'
import { HomeCta } from '@/components/lead/HomeCta'
import { getOrCreateSessionId } from '@/lib/session'

export default async function Home({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  let items: RecommendationItem[] = []
  let error: string | null = null
  try {
    const sessionId = getOrCreateSessionId()
    const data = await fetchRecommendations({ session_id: sessionId, num_results: 6 })
    items = data.items
  } catch (e) {
    error = 'Failed to load recommendations'
  }

  // Embed mode: if ?embed=cta, render only the CTA client component
  const embedParam = searchParams && typeof searchParams.embed === 'string' ? searchParams.embed : Array.isArray(searchParams?.embed) ? searchParams?.embed?.[0] : undefined
  const isEmbed = embedParam === 'cta'

  return (
    <main>
      {isEmbed ? (
        <div className="px-4 py-6"><HomeCta /></div>
      ) : (
        <>
      <section className="brand-gradient text-white relative overflow-hidden glass-card">
        {/* AI themed background overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2000&q=60"
            alt="AI abstract background"
            className="h-full w-full object-cover opacity-20 mix-blend-overlay"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-8 md:py-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Verified homes. Smart matches.</h1>
          <p className="mt-2 text-white/90 max-w-xl text-sm md:text-base">Trustworthy listings and AI picks—built for serious buyers and builders.</p>
          <div className="mt-4 flex gap-3">
            <a href="/property-listing/" className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-plum font-semibold border border-transparent hover:brightness-105">Browse properties</a>
            <a href="/search-filter-home/" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-4 py-2 font-semibold text-white/90 hover:bg-white/10">Filter search</a>
            <a href="/builders/add-property" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-4 py-2 font-semibold text-white/90 hover:bg-white/10">List a property</a>
          </div>
        </div>
      </section>
      <section className="relative mx-auto max-w-6xl px-6 py-6 glass-card">
        <div className="mb-3 text-center">
          <h2 className="text-lg md:text-xl font-bold text-plum">Recommended for you</h2>
        </div>
        {/* Subtle transparent AI image behind cards to avoid stark white */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=50"
            alt="Background texture"
            className="h-full w-full object-cover opacity-6"
          />
        </div>
        <RecommendationsCarousel items={items} isLoading={false} error={error} />
      </section>

      {/* Finance and risk tools teaser */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/tools/cost-calculator" className="rounded-xl border border-plum/10 bg-brandWhite p-4 hover:shadow-subtle transition-shadow">
            <div className="font-semibold">Cost calculator</div>
            <p className="text-sm text-plum/70">Stamp duty, registration, GST, fees — all-in cost.</p>
          </a>
          <a href="/tools/currency-risk" className="rounded-xl border border-plum/10 bg-brandWhite p-4 hover:shadow-subtle transition-shadow">
            <div className="font-semibold">Currency risk (NRI)</div>
            <p className="text-sm text-plum/70">Stress-test INR vs USD/AED/GBP over holding period.</p>
          </a>
          <a href="/tools/vastu" className="rounded-xl border border-plum/10 bg-brandWhite p-4 hover:shadow-subtle transition-shadow">
            <div className="font-semibold">Vastu checker</div>
            <p className="text-sm text-plum/70">Validate entrance, kitchen, bedrooms, and sunlight flow.</p>
          </a>
        </div>
      </section>
        </>
      )}
    </main>
  )
}

