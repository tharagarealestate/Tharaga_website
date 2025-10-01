import { fetchRecommendations } from '@/lib/api'
import type { RecommendationItem } from '@/types/recommendations'
import { RecommendationsCarousel } from '@/features/recommendations/RecommendationsCarousel'
import { getOrCreateSessionId } from '@/lib/session'

export default async function Home() {
  let items: RecommendationItem[] = []
  let error: string | null = null
  try {
    const sessionId = getOrCreateSessionId()
    const data = await fetchRecommendations({ session_id: sessionId, num_results: 6 })
    items = data.items
  } catch (e) {
    error = 'Failed to load recommendations'
  }

  return (
    <main>
      <section className="brand-gradient text-white">
        <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Verified homes. Smart matches.</h1>
          <p className="mt-2 text-white/90 max-w-xl text-sm md:text-base">Trustworthy listings and AI picks—built for serious buyers and builders.</p>
          <div className="mt-4 flex gap-3">
            <a href="/property-listing/" className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-deepBlue font-semibold border border-transparent hover:brightness-105">Browse properties</a>
            <a href="/search-filter-home/" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-4 py-2 font-semibold text-white/90 hover:bg-white/10">Filter search</a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-bold text-deepBlue">Recommended for you</h2>
          <p className="text-deepBlue/70 text-xs">Session‑aware matches</p>
        </div>
        <RecommendationsCarousel items={items} isLoading={false} error={error} />
      </section>
    </main>
  )
}

