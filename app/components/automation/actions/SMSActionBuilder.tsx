'use client'

import { Action } from '@/lib/automation/actions/actionExecutor'

interface SMSActionBuilderProps {
  action: Action
  onChange: (action: Action) => void
  disabled?: boolean
}

export function SMSActionBuilder({ action, onChange, disabled }: SMSActionBuilderProps) {
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

  const messageLength = (config.message || '').length
  const maxLength = 160

  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
      <div>
        <label className="block text-sm text-gray-400 mb-2">To Phone</label>
        <input
          type="tel"
          value={config.to || ''}
          onChange={(e) => handleChange('to', e.target.value)}
          disabled={disabled}
          placeholder="lead.phone or +91XXXXXXXXXX"
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Message ({messageLength}/{maxLength} chars)
        </label>
        <textarea
          value={config.message || ''}
          onChange={(e) => handleChange('message', e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          placeholder="SMS message (supports {{variables}})"
          className="w-full h-24 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
        <div className={`text-xs mt-1 ${messageLength > maxLength ? 'text-red-400' : 'text-gray-400'}`}>
          {messageLength > maxLength && 'Message exceeds character limit'}
        </div>
      </div>
    </div>
  )
}

