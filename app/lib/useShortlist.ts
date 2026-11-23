'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'tharaga.shortlist.v1'

/** A private, per-browser shortlist of mandate slugs. Storage failures degrade to in-memory. */
export function useShortlist() {
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const persist = (next: string[]) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }

  const toggle = useCallback((slug: string) => {
    setItems(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
      persist(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    persist([])
  }, [])

  return { items, has: (slug: string) => items.includes(slug), toggle, clear }
}
