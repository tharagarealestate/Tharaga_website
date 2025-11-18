'use client'

import { Action } from '@/lib/automation/actions/actionExecutor'

interface TagActionBuilderProps {
  action: Action
  onChange: (action: Action) => void
  disabled?: boolean
}

export function TagActionBuilder({ action, onChange, disabled }: TagActionBuilderProps) {
  const config = action.config || {}

  const handleChange = (key: string, value: any) => {
    onChange({
      ...action,
      config: {
        ...config,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Action</label>
        <select
          value={config.action || 'add'}
          onChange={(e) => handleChange('action', e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        >
          <option value="add">Add Tags</option>
          <option value="remove">Remove Tags</option>
          <option value="replace">Replace Tags</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Tags (comma-separated)</label>
        <input
          type="text"
          value={config.tags ? (Array.isArray(config.tags) ? config.tags.join(', ') : config.tags) : ''}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
            handleChange('tags', tags)
          }}
          disabled={disabled}
          placeholder="Hot Lead, Priority, Follow-up"
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
    </div>
  )
}









