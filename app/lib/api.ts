import type { RecommendationResponse } from '@/types/recommendations'

// Prefer relative "/api" (proxied by Netlify) if no explicit backend URL is provided
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export async function fetchRecommendations(params: { user_id?: string; session_id?: string; num_results?: number }): Promise<RecommendationResponse> {
  const { user_id, session_id, num_results = 10 } = params
  const base = API_BASE_URL || ''
  const res = await fetch(`${base}/api/recommendations`, {
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

