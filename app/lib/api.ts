import type { RecommendationResponse } from '@/types/recommendations'

// On server (SSR), call Netlify Function directly.
// On client, use /api proxy unless NEXT_PUBLIC_API_URL is set.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export async function fetchRecommendations(params: { user_id?: string; session_id?: string; num_results?: number }): Promise<RecommendationResponse> {
  const { user_id, session_id, num_results = 10 } = params
  const isServer = typeof window === 'undefined'
  const endpoint = isServer
    ? '/.netlify/functions/recommendations'
    : `${API_BASE_URL || ''}/api/recommendations`
  const res = await fetch(endpoint, {
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

