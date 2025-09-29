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
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">Explore Verified Properties in Tamil Nadu</h1>
            <p className="mt-3 text-white/80 text-lg">Browse only approved builder projects — safe, transparent, and verified.</p>
            <div className="mt-6 flex items-center gap-3">
              <a href="/property-listing/" className="inline-flex h-11 items-center rounded-xl bg-[var(--brand-cream)] text-[var(--brand-ink)] px-5 hover:opacity-95">Browse properties</a>
              <a href="/login_signup_glassdrop/" className="inline-flex h-11 items-center rounded-xl border border-white/30 px-5 text-white hover:bg-white/10">Login / Signup</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold">Recommended for you</h2>
          <p className="text-[rgba(27,27,27,.72)]">Premium picks based on your session.</p>
        </header>
        <RecommendationsCarousel items={items} isLoading={false} error={error} />
        <div className="mt-4">
          <Link href="/properties" className="text-[rgba(27,27,27,.8)] hover:text-[var(--brand-ink)] underline">View all recommended properties</Link>
        </div>
      </section>
    </main>
  )
}

