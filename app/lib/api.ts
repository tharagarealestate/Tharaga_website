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

type PostJSON = <T>(path: string, body: any) => Promise<T>

const isServer = typeof window === 'undefined'

const postJSON: PostJSON = async (path, body) => {
  const endpoint = isServer
    ? `/.netlify/functions${path}`
    : `${API_BASE_URL || ''}${path}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<any>
}

export async function verifyRera(params: { rera_id: string; state?: string; project_name?: string; promoter_name?: string }) {
  return postJSON('/api/verify/rera', params)
}

export async function verifyTitle(params: { property_id: string; document_hash: string; network?: string; registry_address?: string }) {
  return postJSON('/api/verify/title', params)
}

export async function getFraudScore(params: {
  price_inr?: number
  sqft?: number
  city?: string
  locality?: string
  bedrooms?: number
  bathrooms?: number
  has_rera_id?: boolean
  has_title_docs?: boolean
  seller_type?: string
  listed_days_ago?: number
}) {
  return postJSON('/api/fraud/score', params)
}

export async function getPredictiveAnalytics(params: {
  city?: string
  locality?: string
  price_inr?: number
  sqft?: number
  bedrooms?: number
  bathrooms?: number
}) {
  return postJSON('/api/analytics/predict', params)
}

