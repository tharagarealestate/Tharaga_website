'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookmarkPlus,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  RefreshCw,
  Save,
  Search,
  Star,
  Target,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { useFilters, type FilterPreset, type SavedFilter } from '@/contexts/FilterContext'

const FILTER_ICONS = ['🔍', '⭐', '🔥', '💰', '📊', '⚡', '🎯', '✨', '📅', '🏆', '💎', '🚀']

interface FilterSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export default function AdvancedFilters() {
  const {
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    savedFilters,
    filterPresets,
    loadSavedFilter,
    loadPreset,
    saveCurrentFilter,
    deleteSavedFilter,
    setDefaultFilter,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    searchQuery,
    setSearchQuery,
  } = useFilters()

  const [expandedSections, setExpandedSections] = useState<string[]>(['quick', 'score', 'deal'])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [saveFilterDesc, setSaveFilterDesc] = useState('')
  const [saveFilterIcon, setSaveFilterIcon] = useState('🔍')

  const quickPresets = useMemo(
    () => filterPresets.filter((preset) => preset.category === 'quick_wins'),
    [filterPresets]
  )

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((entry) => entry !== section) : [...prev, section]
    )
  }

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) {
      toast.error('Please enter a filter name')
      return
    }

    await saveCurrentFilter(saveFilterName.trim(), saveFilterDesc.trim() || undefined, saveFilterIcon)
    setShowSaveDialog(false)
    setSaveFilterName('')
    setSaveFilterDesc('')
    setSaveFilterIcon('🔍')
  }

  const savedDefault = savedFilters.find((filter) => filter.is_default)

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.08] p-6 backdrop-blur-xl shadow-lg shadow-blue-900/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-200/60" />
              <input
                type="text"
                placeholder="Search leads by name, email, or phone..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-12 pr-4 text-white placeholder:text-blue-200/60 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`relative inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition-all ${
                activeFilterCount > 0
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50'
                  : 'border border-white/15 bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="rounded-xl border border-white/15 bg-white/10 p-3 text-blue-100 transition-colors hover:bg-white/20"
                aria-label="Clear filters"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-blue-100/70">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-300/15 px-3 py-1">
            <Zap className="h-4 w-4 text-emerald-200" />
            Quick presets available
          </div>
          {savedDefault ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <Star className="h-4 w-4 text-amber-300" />
              Default: {savedDefault.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <Star className="h-4 w-4 text-amber-300" />
              No default filter selected
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isFilterPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFilterPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-gradient-to-br from-[#081325]/95 via-[#0C1A33]/95 to-[#132546]/95 text-white shadow-[0px_0px_60px_rgba(32,70,157,0.45)]"
            >
              <div className="border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-400/15 px-3 py-1 text-xs text-blue-100">
                      Hyper-personalised filters
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Advanced Filters</h2>
                    <p className="text-sm text-blue-100/70">
                      Refine your lead search with intelligent presets and granular controls.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-blue-100 transition hover:bg-white/15"
                    aria-label="Close filters panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {activeFilterCount > 0 && (
                  <div className="mt-4 flex items-center gap-3 text-sm text-blue-100/80">
                    <span>
                      <strong>{activeFilterCount}</strong> active filter{activeFilterCount === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={clearFilters}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex flex-col gap-6 pb-16">
                  <FilterSection
                    title="Quick Filters"
                    icon={Zap}
                    isExpanded={expandedSections.includes('quick')}
                    onToggle={() => toggleSection('quick')}
                  >
                    {quickPresets.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-blue-100/70">
                        No quick presets available yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {quickPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => loadPreset(preset)}
                            className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/30 hover:bg-white/10"
                          >
                            <span className="text-2xl">{preset.icon || '✨'}</span>
                            <div className="flex-1">
                              <p className="font-semibold text-white/90">{preset.name}</p>
                              {preset.description && (
                                <p className="mt-1 text-xs text-blue-100/75">{preset.description}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </FilterSection>

                  {savedFilters.length > 0 && (
                    <FilterSection
                      title="My Saved Filters"
                      icon={Star}
                      isExpanded={expandedSections.includes('saved')}
                      onToggle={() => toggleSection('saved')}
                    >
                      <div className="space-y-3">
                        {savedFilters.map((savedFilter) => (
                          <SavedFilterItem
                            key={savedFilter.id}
                            filter={savedFilter}
                            onApply={() => loadSavedFilter(savedFilter)}
                            onDelete={() => deleteSavedFilter(savedFilter.id)}
                            onDefault={() => setDefaultFilter(savedFilter.id)}
                          />
                        ))}
                      </div>
                    </FilterSection>
                  )}

                  <FilterSection
                    title="Lead Quality & Score"
                    icon={TrendingUp}
                    isExpanded={expandedSections.includes('score')}
                    onToggle={() => toggleSection('score')}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-100/80 mb-2">
                          Score range (1 - 10)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={filters.score_min ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'score_min',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Min"
                          />
                          <span className="text-blue-100/60">to</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={filters.score_max ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'score_max',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Max"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-100/80 mb-2">
                          Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_OPTIONS.map((category) => {
                            const isSelected = filters.categories?.includes(category.value)
                            return (
                              <button
                                key={category.value}
                                onClick={() => {
                                  const current = filters.categories || []
                                  updateFilter(
                                    'categories',
                                    isSelected
                                      ? current.filter((entry) => entry !== category.value)
                                      : [...current, category.value]
                                  )
                                }}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                  isSelected
                                    ? category.activeClass
                                    : 'border-white/15 bg-white/10 text-blue-100 hover:bg-white/20'
                                }`}
                              >
                                {category.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Date & Time"
                    icon={Calendar}
                    isExpanded={expandedSections.includes('date')}
                    onToggle={() => toggleSection('date')}
                  >
                    <div className="space-y-5">
                      <div>
                        <p className="mb-2 text-sm font-medium text-blue-100/80">Quick ranges</p>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          {DATE_RANGE_OPTIONS.map((range) => (
                            <button
                              key={range.value}
                              onClick={() => updateFilter('date_range', range.value)}
                              className={`rounded-lg border px-3 py-2 text-sm transition ${
                                filters.date_range === range.value
                                  ? 'border-blue-400/50 bg-blue-500/30 text-white'
                                  : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                              }`}
                            >
                              {range.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-blue-100/60">From</label>
                          <input
                            type="date"
                            value={filters.date_from ?? ''}
                            onChange={(event) => {
                              updateFilter('date_from', event.target.value || undefined)
                              updateFilter('date_range', 'custom')
                            }}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                        <span className="hidden text-blue-100/40 md:block">to</span>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-blue-100/60">To</label>
                          <input
                            type="date"
                            value={filters.date_to ?? ''}
                            onChange={(event) => {
                              updateFilter('date_to', event.target.value || undefined)
                              updateFilter('date_range', 'custom')
                            }}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-blue-100/80">
                          Days since last activity
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            value={filters.days_since_activity_min ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'days_since_activity_min',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Min days"
                          />
                          <span className="text-blue-100/60">to</span>
                          <input
                            type="number"
                            min={0}
                            value={filters.days_since_activity_max ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'days_since_activity_max',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Max days"
                          />
                        </div>
                      </div>
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Pipeline stages"
                    icon={Target}
                    isExpanded={expandedSections.includes('stages')}
                    onToggle={() => toggleSection('stages')}
                  >
                    <div className="grid gap-2 md:grid-cols-2">
                      {STAGE_OPTIONS.map((stage) => {
                        const isSelected = filters.stages?.includes(stage.value)
                        return (
                          <label
                            key={stage.value}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                              isSelected
                                ? 'border-emerald-400/50 bg-emerald-400/10 text-white'
                                : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const current = filters.stages || []
                                updateFilter(
                                  'stages',
                                  isSelected
                                    ? current.filter((entry) => entry !== stage.value)
                                    : [...current, stage.value]
                                )
                              }}
                              className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                            />
                            <span className="text-lg">{stage.icon}</span>
                            <span className="flex-1 font-medium">{stage.label}</span>
                            {isSelected && <Check className="h-5 w-5 text-emerald-300" />}
                          </label>
                        )
                      })}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Deal value & probability"
                    icon={DollarSign}
                    isExpanded={expandedSections.includes('deal')}
                    onToggle={() => toggleSection('deal')}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-blue-100/80">
                          Deal value (₹)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={filters.deal_value_min ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'deal_value_min',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Min amount"
                          />
                          <span className="text-blue-100/60">to</span>
                          <input
                            type="number"
                            value={filters.deal_value_max ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'deal_value_max',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Max amount"
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {DEAL_QUICK_VALUES.map((quick) => (
                            <button
                              key={quick.value}
                              onClick={() => updateFilter('deal_value_min', quick.value)}
                              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 transition hover:bg-white/20"
                            >
                              {quick.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-blue-100/80">
                          Close probability (%)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={filters.probability_min ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'probability_min',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Min %"
                          />
                          <span className="text-blue-100/60">to</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={filters.probability_max ?? ''}
                            onChange={(event) =>
                              updateFilter(
                                'probability_max',
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            placeholder="Max %"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-white/10">
                        <input
                          type="checkbox"
                          checked={!!filters.has_deal_value}
                          onChange={(event) =>
                            updateFilter('has_deal_value', event.target.checked ? true : undefined)
                          }
                          className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-400 focus:ring-2 focus:ring-blue-400/50"
                        />
                        <span>Only show leads with defined deal value</span>
                      </label>
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Follow-ups"
                    icon={Clock}
                    isExpanded={expandedSections.includes('followup')}
                    onToggle={() => toggleSection('followup')}
                  >
                    <div className="space-y-2">
                      {FOLLOWUP_OPTIONS.map((option) => {
                        const checked = !!filters[option.key]
                        return (
                          <label
                            key={option.key}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                              checked
                                ? 'border-blue-400/50 bg-blue-400/15 text-white'
                                : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                updateFilter(option.key, event.target.checked ? true : undefined)
                              }
                              className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-400 focus:ring-2 focus:ring-blue-400/50"
                            />
                            <span className="text-lg">{option.emoji}</span>
                            <span className="flex-1 font-medium">{option.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Lead sources"
                    icon={BookmarkPlus}
                    isExpanded={expandedSections.includes('sources')}
                    onToggle={() => toggleSection('sources')}
                  >
                    <div className="grid gap-2 md:grid-cols-2">
                      {SOURCE_OPTIONS.map((source) => {
                        const isSelected = filters.sources?.includes(source.value)
                        return (
                          <label
                            key={source.value}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                              isSelected
                                ? 'border-purple-400/50 bg-purple-400/15 text-white'
                                : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const current = filters.sources || []
                                updateFilter(
                                  'sources',
                                  isSelected
                                    ? current.filter((entry) => entry !== source.value)
                                    : [...current, source.value]
                                )
                              }}
                              className="h-4 w-4 rounded border-white/30 bg-white/10 text-purple-400 focus:ring-2 focus:ring-purple-400/50"
                            />
                            <span className="text-lg">{source.icon}</span>
                            <span className="flex-1 font-medium">{source.label}</span>
                            {isSelected && <Check className="h-5 w-5 text-purple-300" />}
                          </label>
                        )
                      })}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Sorting"
                    icon={TrendingUp}
                    isExpanded={expandedSections.includes('sorting')}
                    onToggle={() => toggleSection('sorting')}
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-blue-100/80">Sort by</label>
                        <select
                          value={filters.sort_by ?? 'created_at'}
                          onChange={(event) => updateFilter('sort_by', event.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          <option value="created_at">Date created</option>
                          <option value="score">Lead score</option>
                          <option value="last_activity">Last activity</option>
                          <option value="deal_value">Deal value</option>
                          <option value="probability">Close probability</option>
                          <option value="days_in_stage">Days in stage</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateFilter('sort_order', 'desc')}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            (filters.sort_order ?? 'desc') === 'desc'
                              ? 'border-blue-400/60 bg-blue-500/30 text-white'
                              : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                          }`}
                        >
                          Descending
                        </button>
                        <button
                          onClick={() => updateFilter('sort_order', 'asc')}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            filters.sort_order === 'asc'
                              ? 'border-blue-400/60 bg-blue-500/30 text-white'
                              : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                          }`}
                        >
                          Ascending
                        </button>
                      </div>
                    </div>
                  </FilterSection>
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-white/15 sm:w-auto"
                  >
                    <Save className="h-5 w-5" />
                    Save filter
                  </button>
                  <button
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-blue-600/50 sm:w-auto"
                  >
                    <Check className="h-5 w-5" />
                    Apply filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-3xl border border-white/15 bg-gradient-to-br from-[#0B162A]/95 via-[#0E1D34]/95 to-[#142548]/95 p-6 text-white shadow-2xl shadow-blue-900/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Save current filter</h3>
                  <p className="text-sm text-blue-100/70">
                    Give your filter a memorable name, optional description, and icon.
                  </p>
                </div>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="rounded-lg border border-white/15 bg-white/10 p-2 text-blue-100 hover:bg-white/15"
                  aria-label="Close save dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-100/60">
                    Filter name *
                  </label>
                  <input
                    type="text"
                    value={saveFilterName}
                    onChange={(event) => setSaveFilterName(event.target.value)}
                    placeholder="e.g. High value hot leads"
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-100/60">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={saveFilterDesc}
                    onChange={(event) => setSaveFilterDesc(event.target.value)}
                    placeholder="Optional: when should this filter be used?"
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-blue-100/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-100/60">
                    Icon
                  </label>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {FILTER_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setSaveFilterIcon(icon)}
                        className={`rounded-xl border px-3 py-2 text-2xl transition ${
                          saveFilterIcon === icon
                            ? 'border-blue-400/70 bg-blue-400/20 shadow-lg shadow-blue-500/20'
                            : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  className="rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-blue-600/50"
                >
                  Save filter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function FilterSection({ title, icon: Icon, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-4 text-left transition hover:bg-white/10"
      >
        <div className="flex items-center gap-3 text-white/90">
          <Icon className="h-5 w-5 text-blue-200/80" />
          <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-blue-100/60" />
        ) : (
          <ChevronRight className="h-5 w-5 text-blue-100/60" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SavedFilterItem({
  filter,
  onApply,
  onDelete,
  onDefault,
}: {
  filter: SavedFilter
  onApply: () => void
  onDelete: () => void
  onDefault: () => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/25 hover:bg-white/10">
      <span className="text-2xl">{filter.icon || '🔍'}</span>
      <button onClick={onApply} className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white/90">{filter.name}</p>
          {filter.is_default && (
            <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
              Default
            </span>
          )}
        </div>
        {filter.description && (
          <p className="mt-1 truncate text-xs text-blue-100/70">{filter.description}</p>
        )}
        <p className="mt-1 text-[11px] text-blue-100/40">Used {filter.usage_count} times</p>
      </button>
      <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
        {!filter.is_default && (
          <button
            onClick={onDefault}
            className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-2 text-amber-100 hover:bg-amber-300/20"
            title="Set as default"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-400/30 bg-red-400/10 p-2 text-red-100 hover:bg-red-400/20"
          title="Delete filter"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const CATEGORY_OPTIONS = [
  {
    value: 'hot',
    label: '🔥 Hot (9-10)',
    activeClass:
      'border-red-400/60 bg-red-500/20 text-red-100 shadow-[0_0_18px_rgba(239,68,68,0.35)]',
  },
  {
    value: 'warm',
    label: '☀️ Warm (7-8)',
    activeClass:
      'border-orange-400/60 bg-orange-500/20 text-orange-100 shadow-[0_0_18px_rgba(251,146,60,0.35)]',
  },
  {
    value: 'developing',
    label: '🌱 Developing (5-6)',
    activeClass:
      'border-blue-400/60 bg-blue-500/20 text-blue-100 shadow-[0_0_18px_rgba(59,130,246,0.35)]',
  },
  {
    value: 'cold',
    label: '❄️ Cold (3-4)',
    activeClass:
      'border-slate-400/60 bg-slate-500/20 text-slate-100 shadow-[0_0_18px_rgba(100,116,139,0.35)]',
  },
] as const

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
] as const

const DEAL_QUICK_VALUES = [
  { label: '₹10L+', value: 1000000 },
  { label: '₹50L+', value: 5000000 },
  { label: '₹1Cr+', value: 10000000 },
] as const

const STAGE_OPTIONS = [
  { value: 'new', label: 'New', icon: '✨' },
  { value: 'contacted', label: 'Contacted', icon: '👋' },
  { value: 'qualified', label: 'Qualified', icon: '✅' },
  { value: 'site_visit_scheduled', label: 'Visit Scheduled', icon: '📅' },
  { value: 'site_visit_completed', label: 'Visit Completed', icon: '🏠' },
  { value: 'negotiation', label: 'Negotiation', icon: '🤝' },
  { value: 'offer_made', label: 'Offer Made', icon: '💰' },
  { value: 'closed_won', label: 'Closed Won', icon: '🎉' },
  { value: 'closed_lost', label: 'Closed Lost', icon: '❌' },
] as const

const FOLLOWUP_OPTIONS = [
  { key: 'followup_overdue' as const, label: 'Overdue follow-ups', emoji: '⚠️' },
  { key: 'followup_today' as const, label: 'Due today', emoji: '📅' },
  { key: 'followup_this_week' as const, label: 'Due this week', emoji: '📆' },
  { key: 'has_followup_scheduled' as const, label: 'Has scheduled follow-up', emoji: '✅' },
] as const

const SOURCE_OPTIONS = [
  { value: 'organic', label: 'Organic search', icon: '🌱' },
  { value: 'direct', label: 'Direct traffic', icon: '🔗' },
  { value: 'google_ads', label: 'Google Ads', icon: '📢' },
  { value: 'facebook_ads', label: 'Facebook Ads', icon: '📱' },
  { value: 'referral', label: 'Referral', icon: '👥' },
  { value: 'email', label: 'Email campaign', icon: '✉️' },
] as const


