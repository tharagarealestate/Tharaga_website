'use client'

export type SavedSpecs = {
  bedrooms?: number | null
  bathrooms?: number | null
  area_sqft?: number | null
  location?: string | null
}

export type SavedItem = {
  property_id: string
  title: string
  image_url: string
  specs?: SavedSpecs
  saved_at: number
}

const STORAGE_KEY = 'thg_saved_v1'

function readAll(): SavedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
  } catch {
    return []
  }
}

function writeAll(items: SavedItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function listSaved(): SavedItem[] {
  return readAll().sort((a,b)=> b.saved_at - a.saved_at)
}

export function isSaved(propertyId: string): boolean {
  return readAll().some(i => i.property_id === propertyId)
}

export function saveItem(item: Omit<SavedItem,'saved_at'>) {
  const all = readAll()
  if (all.some(i => i.property_id === item.property_id)) return
  const next = [...all, { ...item, saved_at: Date.now() }]
  writeAll(next)
  // Ask SW to cache the image and a couple of pages for offline access
  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'cacheUrls', urls: [item.image_url, '/property-listing/'] })
    }
  } catch {}
}

export function removeItem(propertyId: string) {
  const next = readAll().filter(i => i.property_id !== propertyId)
  writeAll(next)
}
