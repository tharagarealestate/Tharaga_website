import type { RecommendationResponse } from '@/types/recommendations'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function fetchRecommendations(params: { user_id?: string; session_id?: string; num_results?: number }): Promise<RecommendationResponse> {
  const { user_id, session_id, num_results = 10 } = params
  const res = await fetch(`${API_BASE_URL}/api/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id, session_id, num_results }),
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch recommendations: ${res.status}`)
  }
  return (await res.json()) as RecommendationResponse
}

