'use client'

import { Plus, X } from 'lucide-react'
import { ConditionRow } from './ConditionRow'
import { Condition } from '@/lib/automation/triggers/triggerEvaluator'

interface ConditionGroupProps {
  condition: Condition
  onChange: (condition: Condition) => void
  onDelete?: () => void
  logic?: 'and' | 'or'
  disabled?: boolean
}

export function ConditionGroup({ condition, onChange, onDelete, logic = 'and', disabled }: ConditionGroupProps) {
  const conditions = condition[logic] || []

  const handleAddCondition = () => {
    const newCondition: Condition = { field: undefined, operator: undefined, value: undefined }
    onChange({
      ...condition,
      [logic]: [...conditions, newCondition],
    })
  }

  const handleConditionChange = (index: number, newCondition: Condition) => {
    const updated = [...conditions]
    updated[index] = newCondition
    onChange({
      ...condition,
      [logic]: updated,
    })
  }

  const handleConditionDelete = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index)
    onChange({
      ...condition,
      [logic]: updated,
    })
  }

  return (
    <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <select
            value={logic}
            onChange={(e) => {
              const newLogic = e.target.value as 'and' | 'or'
              onChange({
                [newLogic]: conditions,
              })
            }}
            disabled={disabled}
            className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="and">AND</option>
            <option value="or">OR</option>
          </select>
          <span className="text-gray-400 text-sm">({conditions.length} conditions)</span>
        </div>
        {!disabled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddCondition}
              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {conditions.map((cond, index) => (
          <ConditionRow
            key={index}
            condition={cond}
            onChange={(newCond) => handleConditionChange(index, newCond)}
            onDelete={() => handleConditionDelete(index)}
            disabled={disabled}
          />
        ))}
        {conditions.length === 0 && (
          <button
            type="button"
            onClick={handleAddCondition}
            disabled={disabled}
            className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Condition
          </button>
        )}
      </div>
    </div>
  )
}









