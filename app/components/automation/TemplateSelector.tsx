'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  conditionTemplates,
  getTemplatesByCategory,
  searchTemplates,
  ConditionTemplate,
} from '@/lib/automation/triggers/conditionTemplates'

interface TemplateSelectorProps {
  onSelect: (template: ConditionTemplate) => void
  disabled?: boolean
}

export function TemplateSelector({ onSelect, disabled }: TemplateSelectorProps) {
  const [search, setSearch] = useState('')
  const templatesByCategory = getTemplatesByCategory()
  const filteredTemplates = search
    ? searchTemplates(search)
    : conditionTemplates

  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {search ? (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => !disabled && onSelect(template)}
                disabled={disabled}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
              >
                <div className="font-semibold text-white">{template.name}</div>
                <div className="text-sm text-gray-400 mt-1">{template.description}</div>
                <div className="flex gap-2 mt-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : (
          Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category}>
              <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase">
                {category}
              </div>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => !disabled && onSelect(template)}
                    disabled={disabled}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <div className="font-semibold text-white">{template.name}</div>
                    <div className="text-sm text-gray-400 mt-1">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}





