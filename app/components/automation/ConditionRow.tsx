'use client'

import { X } from 'lucide-react'
import { FieldSelector } from './FieldSelector'
import { OperatorSelector } from './OperatorSelector'
import { ValueInput } from './ValueInput'
import { Condition } from '@/lib/automation/triggers/triggerEvaluator'
import { getField } from '@/lib/automation/triggers/fieldSchemas'

interface ConditionRowProps {
  condition: Condition
  onChange: (condition: Condition) => void
  onDelete: () => void
  disabled?: boolean
}

export function ConditionRow({ condition, onChange, onDelete, disabled }: ConditionRowProps) {
  const field = condition.field ? getField(condition.field) : null

  const handleFieldChange = (field: string) => {
    onChange({ ...condition, field, operator: undefined, value: undefined })
  }

  const handleOperatorChange = (operator: string) => {
    onChange({ ...condition, operator, value: undefined })
  }

  const handleValueChange = (value: any) => {
    onChange({ ...condition, value })
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
      <FieldSelector
        value={condition.field}
        onChange={handleFieldChange}
        disabled={disabled}
      />
      {condition.field && (
        <OperatorSelector
          value={condition.operator}
          onChange={handleOperatorChange}
          fieldType={field?.type}
          disabled={disabled}
        />
      )}
      {condition.field && condition.operator && (
        <div className="flex-1">
          <ValueInput
            value={condition.value}
            onChange={handleValueChange}
            fieldType={field?.type}
            operator={condition.operator}
            disabled={disabled}
          />
        </div>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}





