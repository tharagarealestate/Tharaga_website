'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

import { getSupabase } from '@/lib/supabase'

// =============================================
// TYPES
// =============================================

export interface FilterConfig {
  // Search
  search?: string

  // Score Filters
  score_min?: number
  score_max?: number
  categories?: string[] // ['hot', 'warm', 'developing']
  category?: string

  // Date Filters
  date_range?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'
  date_from?: string // ISO date
  date_to?: string

  // Stage Filters
  stages?: string[]
  exclude_stages?: string[]

  // Activity Filters
  days_since_activity_min?: number
  days_since_activity_max?: number
  has_recent_activity?: boolean

  // Follow-up Filters
  followup_overdue?: boolean
  followup_today?: boolean
  followup_this_week?: boolean
  has_followup_scheduled?: boolean

  // Deal Filters
  deal_value_min?: number
  deal_value_max?: number
  probability_min?: number
  probability_max?: number
  has_deal_value?: boolean

  // Source Filters
  sources?: string[] // ['organic', 'google_ads', 'facebook_ads', etc.]

  // Location Filters
  locations?: string[]
  location?: string

  // Property Type Filters
  property_types?: string[]
  property_type?: string

  // Sorting
  sort_by?: 'created_at' | 'score' | 'last_activity' | 'deal_value' | 'probability' | 'days_in_stage' | 'budget'
  sort_order?: 'asc' | 'desc'

  // Interaction Filters
  has_interactions?: boolean
  no_response?: boolean

  // Budget Filters
  budget_min?: number | string
  budget_max?: number | string

  // Pagination
  page?: number
  limit?: number
}

export interface SavedFilter {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  filters: FilterConfig
  usage_count: number
  last_used_at: string | null
  is_public: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface FilterPreset {
  id: string
  name: string
  description: string | null
  category: string
  icon: string
  filters: FilterConfig
  sort_order: number
}

interface FilterContextType {
  // Current Filters
  filters: FilterConfig
  setFilters: (filters: FilterConfig) => void
  updateFilter: (key: keyof FilterConfig, value: any) => void
  clearFilters: () => void

  // Saved Filters
  savedFilters: SavedFilter[]
  filterPresets: FilterPreset[]
  loadSavedFilter: (filter: SavedFilter) => Promise<void>
  loadPreset: (preset: FilterPreset) => void
  saveCurrentFilter: (name: string, description?: string, icon?: string) => Promise<void>
  deleteSavedFilter: (filterId: string) => Promise<void>
  setDefaultFilter: (filterId: string) => Promise<void>

  // Active Filter Count
  activeFilterCount: number

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  debouncedSearch: string

  // UI State
  isFilterPanelOpen: boolean
  setIsFilterPanelOpen: (open: boolean) => void

  // Loading
  loading: boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

// =============================================
// CONSTANTS
// =============================================

const INITIAL_FILTERS: FilterConfig = {
  search: '',
  score_min: 0,
  score_max: 10,
  sort_by: 'score',
  sort_order: 'desc',
  page: 1,
  limit: 20,
  has_interactions: undefined,
  no_response: undefined,
}

// =============================================
// FILTER PROVIDER
// =============================================

export function FilterProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabase(), [])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)

  const [filters, setFiltersState] = useState<FilterConfig>(INITIAL_FILTERS)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([])
  const [searchQuery, setSearchQueryState] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const initialLoadDone = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const filtersRef = useRef<FilterConfig>(INITIAL_FILTERS)

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // =============================================
  // AUTH STATE TRACKING
  // =============================================

  useEffect(() => {
    let isMounted = true

    async function resolveUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!isMounted) return
        if (error || !data?.user) {
          setUser(null)
        } else {
          setUser(data.user)
        }
      } catch (err) {
        console.error('[FilterProvider] Failed to resolve user', err)
        if (isMounted) setUser(null)
      }
    }

    resolveUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // =============================================
  // LOAD FILTERS FROM URL ON MOUNT
  // =============================================

  useEffect(() => {
    if (initialLoadDone.current) return

    const urlFilters = parseFiltersFromURL(searchParams)

    setFiltersState((previous) => mergeWithDefaults(urlFilters, previous))

    if (urlFilters.search) {
      setSearchQueryState(urlFilters.search)
      setDebouncedSearch(urlFilters.search)
    }

    initialLoadDone.current = true
  }, [searchParams])

  // =============================================
  // SYNC FILTERS TO URL
  // =============================================

  useEffect(() => {
    if (!initialLoadDone.current) return

    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (shouldIncludeInURL(key as keyof FilterConfig, value)) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','))
          }
        } else {
          params.set(key, String(value))
        }
      }
    })

    const query = params.toString()
    const newURL = query ? `${pathname}?${query}` : pathname

    router.replace(newURL, { scroll: false })
  }, [filters, pathname, router])

  // =============================================
  // FETCH SAVED FILTERS & PRESETS
  // =============================================

  const fetchFilterPresets = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setFilterPresets((data || []).map(normalizeFilterPreset))
    } catch (error) {
      console.error('[FilterProvider] Error fetching filter presets:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchSavedFilters = useCallback(async () => {
    if (!user) {
      setSavedFilters([])
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) throw error

      const normalized = (data || []).map(normalizeSavedFilter)
      setSavedFilters(normalized)

      const defaultFilter = normalized.find((filter) => filter.is_default)
      const currentFilters = filtersRef.current
      if (
        defaultFilter &&
        isFiltersEmpty(currentFilters, ['sort_by', 'sort_order', 'page', 'limit', 'score_min', 'score_max'])
      ) {
        setFiltersState(mergeWithDefaults(defaultFilter.filters, currentFilters))
        if (defaultFilter.filters.search) {
          setSearchQueryState(defaultFilter.filters.search)
          setDebouncedSearch(defaultFilter.filters.search)
        }
      }
    } catch (error) {
      console.error('[FilterProvider] Error fetching saved filters:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    if (!initialLoadDone.current) return
    fetchFilterPresets()
  }, [fetchFilterPresets])

  useEffect(() => {
    if (!initialLoadDone.current) return
    fetchSavedFilters()
  }, [fetchSavedFilters])

  // =============================================
  // FILTER ACTIONS
  // =============================================

  const setFilters = useCallback((newFilters: FilterConfig) => {
    setFiltersState((previous) => mergeWithDefaults(newFilters, previous))
  }, [])

  const updateFilter = useCallback((key: keyof FilterConfig, value: any) => {
    setFiltersState((previous) => {
      const next: FilterConfig = {
        ...previous,
        [key]: value,
      }

      if (key !== 'page' && key !== 'limit') {
        next.page = 1
      }

      if (key === 'search' && typeof value === 'string' && value.trim() === '') {
        next.search = ''
      }

      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS)
    setSearchQueryState('')
    setDebouncedSearch('')
  }, [])

  const loadSavedFilter = useCallback(
    async (filter: SavedFilter) => {
      setFiltersState((previous) => mergeWithDefaults(filter.filters, previous))

      if (filter.filters.search) {
        setSearchQueryState(filter.filters.search)
        setDebouncedSearch(filter.filters.search)
      } else {
        setSearchQueryState('')
        setDebouncedSearch('')
      }

      try {
        await supabase
          .from('saved_filters')
          .update({
            usage_count: filter.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', filter.id)

        fetchSavedFilters()
      } catch (error) {
        console.error('[FilterProvider] Error updating usage count:', error)
      }

      setIsFilterPanelOpen(false)
      toast.success(`Filter "${filter.name}" applied`)
    },
    [fetchSavedFilters, supabase]
  )

  const loadPreset = useCallback((preset: FilterPreset) => {
    setFiltersState((previous) => mergeWithDefaults(preset.filters, previous))

    if (preset.filters.search) {
      setSearchQueryState(preset.filters.search)
      setDebouncedSearch(preset.filters.search)
    } else {
      setSearchQueryState('')
      setDebouncedSearch('')
    }

    setIsFilterPanelOpen(false)
    toast.success(`Preset "${preset.name}" applied`)
  }, [])

  const saveCurrentFilter = useCallback(
    async (name: string, description?: string, icon?: string) => {
      if (!user) {
        toast.error('You need to be signed in to save filters')
        return
      }

      try {
        setLoading(true)
        const payload = {
          user_id: user.id,
          name,
          description: description || null,
          icon: icon || '🔍',
          filters,
        }

        const { error } = await supabase.from('saved_filters').insert(payload)
        if (error) throw error

        toast.success(`Filter "${name}" saved successfully`)
        fetchSavedFilters()
      } catch (error) {
        console.error('[FilterProvider] Error saving filter:', error)
        toast.error('Failed to save filter')
      } finally {
        setLoading(false)
      }
    },
    [fetchSavedFilters, filters, supabase, user]
  )

  const deleteSavedFilter = useCallback(
    async (filterId: string) => {
      try {
        setLoading(true)
        const { error } = await supabase.from('saved_filters').delete().eq('id', filterId)
        if (error) throw error
        toast.success('Filter deleted')
        fetchSavedFilters()
      } catch (error) {
        console.error('[FilterProvider] Error deleting filter:', error)
        toast.error('Failed to delete filter')
      } finally {
        setLoading(false)
      }
    },
    [fetchSavedFilters, supabase]
  )

  const setDefaultFilter = useCallback(
    async (filterId: string) => {
      if (!user) return
      try {
        setLoading(true)
        await supabase.from('saved_filters').update({ is_default: false }).eq('user_id', user.id)
        const { error } = await supabase.from('saved_filters').update({ is_default: true }).eq('id', filterId)
        if (error) throw error
        toast.success('Default filter updated')
        fetchSavedFilters()
      } catch (error) {
        console.error('[FilterProvider] Error setting default filter:', error)
        toast.error('Failed to set default filter')
      } finally {
        setLoading(false)
      }
    },
    [fetchSavedFilters, supabase, user]
  )

  // =============================================
  // SEARCH DEBOUNCE
  // =============================================

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const setSearchQueryHandler = useCallback(
    (query: string) => {
      setSearchQueryState(query)

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(query)
        updateFilter('search', query.trim())
      }, 500)
    },
    [updateFilter]
  )

  // =============================================
  // ACTIVE FILTER COUNT
  // =============================================

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'page' || key === 'limit') return count
      if (key === 'sort_by' || key === 'sort_order') return count
      if (key === 'score_min' && value === 0) return count
      if (key === 'score_max' && value === 10) return count
      if (Array.isArray(value)) {
        return value.length > 0 ? count + 1 : count
      }
      if (value === undefined || value === null || value === '') return count
      return count + 1
    }, 0)
  }, [filters])

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const value: FilterContextType = {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    savedFilters,
    filterPresets,
    loadSavedFilter,
    loadPreset,
    saveCurrentFilter,
    deleteSavedFilter,
    setDefaultFilter,
    activeFilterCount,
    searchQuery,
    setSearchQuery: setSearchQueryHandler,
    debouncedSearch,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    loading,
  }

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

// =============================================
// HOOK
// =============================================

export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider')
  }
  return context
}

// =============================================
// HELPERS
// =============================================

function parseFiltersFromURL(searchParams: URLSearchParams): FilterConfig {
  const parsed: FilterConfig = {}

  searchParams.forEach((value, key) => {
    if (ARRAY_FILTER_KEYS.has(key)) {
      parsed[key as keyof FilterConfig] = value.split(',') as any
      return
    }

    if (NUMBER_FILTER_KEYS.has(key)) {
      parsed[key as keyof FilterConfig] = Number(value) as any
      return
    }

    if (BOOLEAN_FILTER_KEYS.has(key)) {
      parsed[key as keyof FilterConfig] = value === 'true'
      return
    }

    parsed[key as keyof FilterConfig] = value as any
  })

  return mergeWithDefaults(parsed, INITIAL_FILTERS)
}

const ARRAY_FILTER_KEYS = new Set([
  'categories',
  'stages',
  'exclude_stages',
  'sources',
  'locations',
  'property_types',
])

const NUMBER_FILTER_KEYS = new Set([
  'score_min',
  'score_max',
  'days_since_activity_min',
  'days_since_activity_max',
  'deal_value_min',
  'deal_value_max',
  'probability_min',
  'probability_max',
  'page',
  'limit',
  'budget_min',
  'budget_max',
])

const BOOLEAN_FILTER_KEYS = new Set([
  'followup_overdue',
  'followup_today',
  'followup_this_week',
  'has_followup_scheduled',
  'has_recent_activity',
  'has_deal_value',
  'has_interactions',
  'no_response',
])

function mergeWithDefaults(next: FilterConfig, previous: FilterConfig): FilterConfig {
  return {
    ...INITIAL_FILTERS,
    ...previous,
    ...next,
    page: next.page ?? 1,
    limit: next.limit ?? previous.limit ?? INITIAL_FILTERS.limit,
    score_min: next.score_min ?? previous.score_min ?? INITIAL_FILTERS.score_min,
    score_max: next.score_max ?? previous.score_max ?? INITIAL_FILTERS.score_max,
    sort_by: next.sort_by ?? previous.sort_by ?? INITIAL_FILTERS.sort_by,
    sort_order: next.sort_order ?? previous.sort_order ?? INITIAL_FILTERS.sort_order,
  }
}

function shouldIncludeInURL(key: keyof FilterConfig, value: any) {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0

  const defaultValue = INITIAL_FILTERS[key]

  if (defaultValue !== undefined) {
    if (Array.isArray(defaultValue) && Array.isArray(value)) {
      if (defaultValue.length === value.length && defaultValue.every((item, index) => item === value[index])) {
        return false
      }
    } else if (defaultValue === value) {
      return false
    }
  }

  return true
}

function normalizeSavedFilter(filter: SavedFilter): SavedFilter {
  return {
    ...filter,
    icon: filter.icon || '🔍',
    filters: mergeWithDefaults(filter.filters || {}, INITIAL_FILTERS),
  }
}

function normalizeFilterPreset(preset: FilterPreset): FilterPreset {
  return {
    ...preset,
    filters: mergeWithDefaults(preset.filters || {}, INITIAL_FILTERS),
  }
}

function isFiltersEmpty(
  values: FilterConfig,
  ignoredKeys: Array<keyof FilterConfig> = []
) {
  return Object.entries(values).every(([key, value]) => {
    if (ignoredKeys.includes(key as keyof FilterConfig)) return true
    if (Array.isArray(value)) return value.length === 0
    return value === undefined || value === null || value === ''
  })
}

