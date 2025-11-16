'use client'

import { useState } from 'react'
import { getOperatorsByCategory } from '@/lib/automation/triggers/conditionOperators'

interface OperatorSelectorProps {
  value?: string
  onChange: (operator: string) => void
  fieldType?: string
  disabled?: boolean
}

export function OperatorSelector({ value, onChange, fieldType, disabled }: OperatorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const operatorsByCategory = getOperatorsByCategory()

  const operatorLabels: Record<string, string> = {
    equals: 'Equals',
    not_equals: 'Not Equals',
    greater_than: 'Greater Than',
    less_than: 'Less Than',
    greater_than_or_equal: 'Greater Than or Equal',
    less_than_or_equal: 'Less Than or Equal',
    contains: 'Contains',
    not_contains: 'Not Contains',
    starts_with: 'Starts With',
    ends_with: 'Ends With',
    in: 'In',
    not_in: 'Not In',
    is_empty: 'Is Empty',
    is_not_empty: 'Is Not Empty',
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-left hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {value ? operatorLabels[value] || value : 'Select Operator'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-h-96 overflow-y-auto">
            {Object.entries(operatorsByCategory).map(([category, operators]) => (
              <div key={category} className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                  {category}
                </div>
                {operators.map((op: string) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => {
                      onChange(op)
                      setIsOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    {operatorLabels[op] || op}
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


