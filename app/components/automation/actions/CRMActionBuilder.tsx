'use client'

import { Action } from '@/lib/automation/actions/actionExecutor'

interface CRMActionBuilderProps {
  action: Action
  onChange: (action: Action) => void
  disabled?: boolean
}

export function CRMActionBuilder({ action, onChange, disabled }: CRMActionBuilderProps) {
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
        <label className="block text-sm text-gray-400 mb-2">CRM Type</label>
        <select
          value={config.crm_type || 'zoho'}
          onChange={(e) => handleChange('crm_type', e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        >
          <option value="zoho">Zoho CRM</option>
          <option value="salesforce">Salesforce</option>
          <option value="hubspot">HubSpot</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Action Type</label>
        <select
          value={config.action_type || 'sync_contact'}
          onChange={(e) => handleChange('action_type', e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        >
          <option value="sync_contact">Sync Contact</option>
          <option value="sync_deal">Sync Deal</option>
          <option value="update_contact">Update Contact</option>
          <option value="create_deal">Create Deal</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Field Mappings (JSON)</label>
        <textarea
          value={config.field_mappings ? JSON.stringify(config.field_mappings, null, 2) : ''}
          onChange={(e) => {
            try {
              handleChange('field_mappings', JSON.parse(e.target.value))
            } catch {
              // Invalid JSON, ignore
            }
          }}
          disabled={disabled}
          placeholder='{"name": "lead.full_name", "email": "lead.email"}'
          className="w-full h-32 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
      </div>
    </div>
  )
}



