"use client"
import { useState } from 'react'

export function PayButton({ tier, cycle='monthly' }: { tier: 'growth'|'pro'; cycle?: 'monthly'|'yearly' }){
  const [loading, setLoading] = useState(false)
  async function click(){
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/billing/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier, cycle })
      })
      const data = await res.json()
      if (data.short_url) {
        location.href = data.short_url
      }
    } finally {
      setLoading(false)
    }
  }
  return <button onClick={click} className="btn" disabled={loading}>{loading ? 'Processing…' : `Subscribe ${tier}`}</button>
}
