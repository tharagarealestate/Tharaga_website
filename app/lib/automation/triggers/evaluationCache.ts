/**
 * Evaluation Cache - Performance caching for condition evaluations
 */

interface CacheEntry {
  result: boolean
  expires: number
  hits: number
}

export class EvaluationCache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * Get cached result
   */
  get(key: string): boolean | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }

    // Update hit count
    entry.hits++
    return entry.result
  }

  /**
   * Set cache entry
   */
  set(key: string, result: boolean, ttl?: number): void {
    // Evict if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, {
      result,
      expires: Date.now() + (ttl || this.defaultTTL),
      hits: 0,
    })
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalHits: number
  } {
    let totalHits = 0
    for (const entry of this.cache.values()) {
      totalHits += entry.hits
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      totalHits,
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let lruHits = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits) {
        lruHits = entry.hits
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  /**
   * Generate cache key from condition and data
   */
  static generateKey(condition: any, data: Record<string, any>): string {
    // Create a stable key from condition and relevant data
    const conditionStr = JSON.stringify(condition)
    const dataStr = JSON.stringify(
      Object.fromEntries(
        Object.entries(data).filter(([_, v]) => 
          typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        )
      )
    )
    return `${conditionStr}:${dataStr}`
  }
}

export const evaluationCache = new EvaluationCache()










