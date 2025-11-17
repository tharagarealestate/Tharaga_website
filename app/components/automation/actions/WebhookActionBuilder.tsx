'use client'

import { Action } from '@/lib/automation/actions/actionExecutor'

interface WebhookActionBuilderProps {
  action: Action
  onChange: (action: Action) => void
  disabled?: boolean
}

export function WebhookActionBuilder({ action, onChange, disabled }: WebhookActionBuilderProps) {
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
        <label className="block text-sm text-gray-400 mb-2">Webhook URL *</label>
        <input
          type="url"
          value={config.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          disabled={disabled}
          required
          placeholder="https://example.com/webhook"
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Method</label>
        <select
          value={config.method || 'POST'}
          onChange={(e) => handleChange('method', e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Headers (JSON)</label>
        <textarea
          value={config.headers ? JSON.stringify(config.headers, null, 2) : ''}
          onChange={(e) => {
            try {
              handleChange('headers', JSON.parse(e.target.value))
            } catch {
              // Invalid JSON, ignore
            }
          }}
          disabled={disabled}
          placeholder='{"Authorization": "Bearer token"}'
          className="w-full h-24 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Payload (JSON)</label>
        <textarea
          value={config.payload ? JSON.stringify(config.payload, null, 2) : ''}
          onChange={(e) => {
            try {
              handleChange('payload', JSON.parse(e.target.value))
            } catch {
              // Invalid JSON, ignore
            }
          }}
          disabled={disabled}
          placeholder='{"event": "lead_created", "data": {{event_data}}}'
          className="w-full h-32 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
    </div>
  )
}





