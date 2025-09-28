import { fetchRecommendations } from '@/lib/api'
import type { RecommendationItem } from '@/types/recommendations'
import { RecommendationsCarousel } from '@/features/recommendations/RecommendationsCarousel'
import { getOrCreateSessionId } from '@/lib/session'
import Link from 'next/link'

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
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">Find your next premium home</h1>
            <p className="mt-3 text-white/80 text-lg">AI-curated properties tailored to your taste, budget, and lifestyle.</p>
            <div className="mt-6 flex items-center gap-3">
              <a href="/property-listing/" className="inline-flex h-11 items-center rounded-xl bg-gold px-5 text-ink hover:opacity-95">Browse properties</a>
              <a href="/login_signup_glassdrop/" className="inline-flex h-11 items-center rounded-xl border border-white/30 px-5 text-white hover:bg-white/10">Sign in</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold">Recommended for you</h2>
          <p className="text-deepBlue/70">Premium picks based on your session.</p>
        </header>
        <RecommendationsCarousel items={items} isLoading={false} error={error} />
        <div className="mt-4">
          <Link href="/properties" className="text-deepBlue/80 hover:text-deepBlue underline">View all recommended properties</Link>
        </div>
      </section>
    </main>
  )
}

