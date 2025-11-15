'use client'

import { useState } from 'react'
import { getFieldsByCategory, FieldSchema } from '@/lib/automation/triggers/fieldSchemas'

interface FieldSelectorProps {
  value?: string
  onChange: (field: string) => void
  disabled?: boolean
}

export function FieldSelector({ value, onChange, disabled }: FieldSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const fieldsByCategory = getFieldsByCategory()

  const selectedField = Object.values(fieldsByCategory)
    .flat()
    .find(f => f.name === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-left hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedField ? selectedField.label : 'Select Field'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-h-96 overflow-y-auto">
            {Object.entries(fieldsByCategory).map(([category, fields]) => (
              <div key={category} className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                  {category}
                </div>
                {fields.map((field: FieldSchema) => (
                  <button
                    key={field.name}
                    type="button"
                    onClick={() => {
                      onChange(field.name)
                      setIsOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    <div className="font-medium">{field.label}</div>
                    {field.description && (
                      <div className="text-xs text-gray-400">{field.description}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

