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
    <main className="px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Tharaga</h1>
          <p className="text-deepBlue/70">Premium homes, curated by AI.</p>
        </header>
        <RecommendationsCarousel items={items} isLoading={false} error={error} />
      </section>
    </main>
  )
}

