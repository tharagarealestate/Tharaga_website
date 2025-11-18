'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Action } from '@/lib/automation/actions/actionExecutor'

interface ActionBuilderProps {
  actions: Action[]
  onChange: (actions: Action[]) => void
  disabled?: boolean
}

const actionTypes = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'crm', label: 'CRM Sync' },
  { value: 'tag', label: 'Add Tag' },
  { value: 'field_update', label: 'Update Field' },
  { value: 'assign', label: 'Assign' },
  { value: 'delay', label: 'Delay' },
  { value: 'notification', label: 'Notification' },
]

export function ActionBuilder({ actions, onChange, disabled }: ActionBuilderProps) {
  const handleAddAction = () => {
    onChange([...actions, { type: 'email', config: {} }])
  }

  const handleActionChange = (index: number, action: Action) => {
    const updated = [...actions]
    updated[index] = action
    onChange(updated)
  }

  const handleActionDelete = (index: number) => {
    onChange(actions.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Actions</h3>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddAction}
            className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <select
                value={action.type}
                onChange={(e) =>
                  handleActionChange(index, {
                    ...action,
                    type: e.target.value as Action['type'],
                    config: {},
                  })
                }
                disabled={disabled}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {actionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleActionDelete(index)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-sm text-gray-400">
              Configure action in action-specific builder
            </div>
          </div>
        ))}
        {actions.length === 0 && (
          <button
            type="button"
            onClick={handleAddAction}
            disabled={disabled}
            className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Action
          </button>
        )}
      </div>
    </div>
  )
}









