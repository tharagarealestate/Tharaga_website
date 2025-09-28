import { fetchRecommendations } from '@/lib/api'
import type { RecommendationItem } from '@/types/recommendations'
import { RecommendationsGrid } from '@/features/recommendations/RecommendationsGrid'
import { getOrCreateSessionId } from '@/lib/session'

export default async function PropertiesPage() {
  let items: RecommendationItem[] = []
  let error: string | null = null
  try {
    const sessionId = getOrCreateSessionId()
    const data = await fetchRecommendations({ session_id: sessionId, num_results: 24 })
    items = data.items
  } catch (e) {
    error = 'Failed to load properties'
  }

  return (
    <main className="px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Properties</h1>
          <p className="text-deepBlue/70">AI-recommended properties for you</p>
        </header>
        <RecommendationsGrid initialItems={items} error={error} />
      </section>
    </main>
  )
}

