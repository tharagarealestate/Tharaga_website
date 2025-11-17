'use client'

import { Action } from '@/lib/automation/actions/actionExecutor'

interface EmailActionBuilderProps {
  action: Action
  onChange: (action: Action) => void
  disabled?: boolean
}

export function EmailActionBuilder({ action, onChange, disabled }: EmailActionBuilderProps) {
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
        <label className="block text-sm text-gray-400 mb-2">To Email</label>
        <input
          type="email"
          value={config.to || ''}
          onChange={(e) => handleChange('to', e.target.value)}
          disabled={disabled}
          placeholder="lead.email or specific@email.com"
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Subject</label>
        <input
          type="text"
          value={config.subject || ''}
          onChange={(e) => handleChange('subject', e.target.value)}
          disabled={disabled}
          placeholder="Email subject (supports {{variables}})"
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Body</label>
        <textarea
          value={config.body || ''}
          onChange={(e) => handleChange('body', e.target.value)}
          disabled={disabled}
          placeholder="Email body (supports {{variables}})"
          className="w-full h-32 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
    </div>
  )
}





