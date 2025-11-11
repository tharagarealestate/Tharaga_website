'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookmarkPlus,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  ShieldCheck,
} from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { toast } from 'sonner'

import { useFilters, type FilterConfig, type SavedFilter, type FilterPreset } from '@/contexts/FilterContext'

export function FilterCollections() {
  const {
    filters,
    savedFilters,
    filterPresets,
    loadSavedFilter,
    loadPreset,
    saveCurrentFilter,
    deleteSavedFilter,
    setDefaultFilter,
    activeFilterCount,
    loading,
  } = useFilters()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🔍')
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('quick_wins')

  const categories = useMemo(() => {
    const unique = Array.from(new Set(filterPresets.map((preset) => preset.category)))
    return unique.length > 0 ? unique : ['quick_wins']
  }, [filterPresets])

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0])
    }
  }, [activeCategory, categories])

  const presetsToShow = useMemo(
    () =>
      filterPresets.filter((preset) => {
        if (!activeCategory) return true
        return preset.category === activeCategory
      }),
    [activeCategory, filterPresets]
  )

  const currentFilterChips = useMemo(() => summarizeFilters(filters), [filters])
  const defaultFilter = useMemo(
    () => savedFilters.find((filter) => filter.is_default),
    [savedFilters]
  )

  const canSaveFilter = activeFilterCount > 0 || currentFilterChips.length > 0

  const handleSaveFilter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Please give your filter a memorable name')
      return
    }
    if (!canSaveFilter) {
      toast.error('Add some filters before saving your playbook')
      return
    }

    try {
      setSaving(true)
      const normalizedIcon = normalizeIcon(icon)
      await saveCurrentFilter(name.trim(), description.trim() || undefined, normalizedIcon)
      setIsDialogOpen(false)
      setName('')
      setDescription('')
      setIcon('🔍')
    } catch (error) {
      console.error('[FilterCollections] Failed to save filter', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFilter = async (filter: SavedFilter) => {
    const confirmed = window.confirm(`Delete saved filter "${filter.name}"?`)
    if (!confirmed) return
    await deleteSavedFilter(filter.id)
  }

  const heroPresetLabel = defaultFilter
    ? `Default: ${defaultFilter.name}`
    : 'No default filter selected'

  return (
    <>
      <section className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/15 via-white/5 to-white/10 px-8 py-10 backdrop-blur-2xl text-white shadow-2xl shadow-blue-500/20"
        >
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/15 px-4 py-2 text-sm text-emerald-100">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                Glass-optimized filters inspired by our pricing experience
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold sm:text-4xl">Filter Playbooks</h2>
                <p className="mt-3 max-w-xl text-blue-100/80">
                  Save, reuse, and share your smartest lead intelligence filters. Craft lightning-fast
                  follow-up lanes that match your growth goals.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-blue-100/80">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  {heroPresetLabel}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5">
                  Active filters: <span className="font-semibold text-white">{activeFilterCount}</span>
                </div>
              </div>

              {currentFilterChips.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {currentFilterChips.slice(0, 5).map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90"
                    >
                      {chip}
                    </span>
                  ))}
                  {currentFilterChips.length > 5 && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      +{currentFilterChips.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
              <div>
                <p className="text-sm text-blue-100/70">Current session insights</p>
                <p className="text-3xl font-semibold">
                  {activeFilterCount > 0 ? 'Ready to save' : 'Start refining'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                disabled={!canSaveFilter || saving || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BookmarkPlus className="h-4 w-4" />
                Save Current Filter
              </button>
              <p className="text-xs text-blue-100/70">
                Filters sync with your URL, so sharing links keeps the same intelligence view.
              </p>
            </div>
          </div>
        </motion.div>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Saved Playbooks</h3>
              <p className="text-sm text-blue-100/70">
                Your personal library of lead intelligence shortcuts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
            >
              <BookmarkPlus className="h-4 w-4 text-gold-300" />
              New saved filter
            </button>
          </div>

          {savedFilters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-500/30 bg-blue-500/5 p-8 text-center text-blue-100/80">
              <p className="text-lg font-medium text-white">No saved playbooks yet</p>
              <p className="mt-2 text-sm">
                Craft a set of filters and tap &ldquo;Save Current Filter&rdquo; to build your playbook
                library.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {savedFilters.map((filter) => {
                const chips = summarizeFilters(filter.filters)
                const lastUsed = formatRelativeTime(filter.last_used_at || filter.updated_at)
                return (
                  <motion.div
                    key={filter.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-[#0A1628]/85 via-[#0E1B33]/80 to-[#13213f]/80 p-6 shadow-lg shadow-blue-900/40 backdrop-blur-xl transition-transform hover:-translate-y-1 hover:shadow-blue-700/40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10 flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{filter.icon || '🔍'}</span>
                        {filter.is_default ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                            Used {filter.usage_count}×
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white">{filter.name}</h4>
                        {filter.description && (
                          <p className="mt-1 text-sm text-blue-100/70">{filter.description}</p>
                        )}
                      </div>

                      {chips.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {chips.slice(0, 4).map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/85"
                            >
                              {chip}
                            </span>
                          ))}
                          {chips.length > 4 && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                              +{chips.length - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-blue-200/60">Uses intelligent defaults</p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs text-blue-200/70">
                        <span>{lastUsed}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadSavedFilter(filter).catch(() => undefined)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-400/15 px-3 py-1.5 text-[11px] font-medium text-emerald-100 transition-colors hover:bg-emerald-400/25"
                          >
                            <Wand2 className="h-3 w-3" />
                            Apply
                          </button>
                          <button
                            onClick={() => setDefaultFilter(filter.id)}
                            disabled={filter.is_default}
                            className="inline-flex items-center gap-1 rounded-lg border border-gold-400/40 bg-gold-400/10 px-3 py-1.5 text-[11px] font-medium text-gold-100 transition-colors hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Star className="h-3 w-3" />
                            Default
                          </button>
                          <button
                            onClick={() => handleDeleteFilter(filter)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-400/20"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {filterPresets.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Intelligent Presets</h3>
                <p className="text-sm text-blue-100/70">
                  Start with proven combinations tuned for quick wins, deal velocity, or stage mastery.
                </p>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/8 p-1 backdrop-blur">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                      activeCategory === category
                        ? 'rounded-full bg-white text-[#0A1628]'
                        : 'rounded-full text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {formatCategory(category)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {presetsToShow.map((preset) => {
                const chips = summarizeFilters(preset.filters)
                return (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-purple-500/15 p-6 text-white shadow-lg shadow-indigo-900/40 backdrop-blur-xl transition-transform hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                    <div className="relative z-10 flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{preset.icon || '✨'}</span>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/80">
                          {formatCategory(preset.category)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold">{preset.name}</h4>
                        {preset.description && (
                          <p className="mt-1 text-sm text-blue-100/75">{preset.description}</p>
                        )}
                      </div>

                      {chips.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {chips.slice(0, 5).map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90"
                            >
                              {chip}
                            </span>
                          ))}
                          {chips.length > 5 && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                              +{chips.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-xs text-blue-100/60">
                          Sort priority {String(preset.sort_order ?? 0).padStart(2, '0')}
                        </span>
                        <button
                          onClick={() => loadPreset(preset)}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                        >
                          <Wand2 className="h-4 w-4" />
                          Apply Preset
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}
      </section>

      {isDialogOpen && (
        <SaveFilterDialog
          icon={icon}
          name={name}
          description={description}
          saving={saving || loading}
          canSave={canSaveFilter}
          onIconChange={(value) => setIcon(value)}
          onNameChange={(value) => setName(value)}
          onDescriptionChange={(value) => setDescription(value)}
          onCancel={() => {
            if (saving) return
            setIsDialogOpen(false)
          }}
          onSubmit={handleSaveFilter}
        />
      )}
    </>
  )
}

interface SaveFilterDialogProps {
  icon: string
  name: string
  description: string
  saving: boolean
  canSave: boolean
  onIconChange: (value: string) => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCancel: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function SaveFilterDialog({
  icon,
  name,
  description,
  saving,
  canSave,
  onIconChange,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
}: SaveFilterDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#0A1628]/95 via-[#0F1D34]/95 to-[#142445]/95 p-8 text-white shadow-2xl shadow-blue-900/40"
      >
        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <h3 className="text-2xl font-semibold">Save this filter playbook</h3>
            <p className="mt-2 text-sm text-blue-100/70">
              Give it a memorable name and optional description. Icons are great for scanning quickly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
            <label className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-6 text-sm text-blue-100/60">
              <span className="text-4xl">{icon || '🔍'}</span>
              <span>Icon</span>
              <input
                type="text"
                maxLength={4}
                value={icon}
                onChange={(event) => onIconChange(event.target.value)}
                className="w-16 rounded-lg border border-white/10 bg-transparent px-2 py-1 text-center text-base text-white outline-none focus:border-white/40"
              />
            </label>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-blue-100/70">Filter name</label>
                <input
                  type="text"
                  maxLength={48}
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/40"
                  placeholder="e.g. Hot + High Value Leads"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-blue-100/70">Description (optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/40"
                  placeholder="When to use this playbook..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-blue-100/70">
            <span>Filters are private unless you share the link.</span>
            {!canSave && <span>Add at least one filter to save.</span>}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSave}
              className="rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Filter'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function summarizeFilters(config: FilterConfig): string[] {
  const chips: string[] = []
  if (config.search) chips.push(`🔍 ${truncate(config.search, 14)}`)
  if (config.category) chips.push(config.category)
  if (config.categories && config.categories.length > 0) chips.push(config.categories.join(', '))

  if (typeof config.score_min === 'number' && config.score_min > 0) {
    chips.push(`Score ≥ ${config.score_min}`)
  }
  if (typeof config.score_max === 'number' && config.score_max < 10) {
    chips.push(`Score ≤ ${config.score_max}`)
  }

  if (config.location || (config.locations && config.locations.length > 0)) {
    chips.push(`📍 ${config.location || config.locations?.[0]}`)
  }
  if (config.property_type) chips.push(`🏠 ${config.property_type}`)
  if (config.property_types && config.property_types.length > 0) {
    chips.push(`🏢 ${config.property_types[0]}`)
  }

  if (config.has_interactions) chips.push('💬 Interactions')
  if (config.no_response) chips.push('⏰ Needs follow-up')
  if (config.followup_overdue) chips.push('⚠️ Overdue follow-ups')

  if (config.deal_value_min) chips.push(`₹≥${formatCurrency(config.deal_value_min)}`)
  if (config.budget_min) chips.push(`Budget ≥ ₹${formatCurrency(config.budget_min)}`)
  if (config.budget_max) chips.push(`Budget ≤ ₹${formatCurrency(config.budget_max)}`)

  if (config.sources && config.sources.length > 0) {
    chips.push(`📢 ${config.sources.slice(0, 2).join(', ')}`)
  }

  return chips
}

function normalizeIcon(value: string) {
  if (!value) return '🔍'
  const trimmed = value.trim()
  if (trimmed.length === 0) return '🔍'
  return Array.from(trimmed).slice(0, 1).join('') || '🔍'
}

function formatCurrency(value: number | string) {
  const numeric = typeof value === 'string' ? parseInt(value, 10) || 0 : value
  if (!numeric) return '0'
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(numeric)
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value
  return `${value.slice(0, length - 1)}…`
}

function formatRelativeTime(value?: string | null) {
  if (!value) return 'Never used'
  try {
    return `${formatDistanceToNowStrict(new Date(value), { addSuffix: true })}`
  } catch {
    return 'Recently'
  }
}

function formatCategory(category: FilterPreset['category']) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

