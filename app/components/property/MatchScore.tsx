"use client"
import React from 'react'
import { fetchRecommendations } from '@/lib/api'

export function MatchScore({ propertyId }: { propertyId: string }){
  const [percent, setPercent] = React.useState<number | null>(null)
  const [reasons, setReasons] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function run(){
      try {
        const userId = getOrCreateUserId()
        const sessionId = getOrCreateSessionId()
        const res = await fetchRecommendations({ user_id: userId, session_id: sessionId, num_results: 20 })
        const items = res?.items || []
        if (!items.length) { if (!cancelled) setError(''); return }
        // Normalize by top score
        const maxScore = Math.max(1, ...items.map(i => Math.max(0, Number(i.score||0))))
        const found = items.find(i => i.property_id === propertyId)
        const score = Math.max(0, Number(found?.score || 0))
        const pct = Math.round((score / maxScore) * 100)
        if (!cancelled) {
          setPercent(pct)
          setReasons((found?.reasons || []).slice(0,3))
        }
      } catch (e:any) {
        if (!cancelled) setError(e?.message || 'Failed')
      }
    }
    run()
    return () => { cancelled = true }
  }, [propertyId])

  if (error) return null
  if (percent == null) return null

  return (
    <div className="rounded border p-3 text-sm">
      <div className="font-medium mb-1">AI Match</div>
      <div className="text-2xl font-semibold text-yellow-700">{percent}%</div>
      {reasons?.length ? (
        <ul className="mt-1 list-disc ml-5 text-gray-700">
          {reasons.map((r, i)=> <li key={i}>{r}</li>)}
        </ul>
      ) : null}
    </div>
  )
}

function getOrCreateUserId(){
  try {
    const k = 'thg_user_id'
    let v = localStorage.getItem(k)
    if (!v) { v = `U_${Math.random().toString(36).slice(2)}_${Date.now()}`; localStorage.setItem(k, v) }
    return v
  } catch { return 'anon' }
}

function getOrCreateSessionId(){
  try {
    const k = 'thg_session_id'
    let v = sessionStorage.getItem(k)
    if (!v) { v = `S_${Math.random().toString(36).slice(2)}_${Date.now()}`; sessionStorage.setItem(k, v) }
    return v
  } catch { return 'anon' }
}
