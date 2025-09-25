export type ClientRecParams = { session_id?: string; user_id?: string; num_results?: number }

export async function fetchRecommendationsClient(params: ClientRecParams) {
  const { session_id, user_id, num_results = 6 } = params
  const res = await fetch(`/api/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, user_id, num_results }),
  })
  if (!res.ok) throw new Error(`client recs failed: ${res.status}`)
  return res.json()
}

export function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

