'use client'

import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ConditionBuilder } from './ConditionBuilder'
import { ActionBuilder } from './ActionBuilder'
import { Condition } from '@/lib/automation/triggers/triggerEvaluator'
import { Action } from '@/lib/automation/actions/actionExecutor'

interface AutomationFormProps {
  builderId: string
  automationId?: string
  mode?: 'create' | 'edit'
}

export function AutomationForm({ builderId, automationId, mode = 'create' }: AutomationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_conditions: { and: [] } as Condition,
    actions: [] as Action[],
    priority: 5,
    is_active: true,
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (mode === 'edit' && automationId) {
      fetchAutomation()
    }
  }, [automationId, mode])

  const fetchAutomation = async () => {
    try {
      const response = await fetch(`/api/automations/${automationId}`)
      const data = await response.json()
      if (data.data) {
        setFormData({
          name: data.data.name || '',
          description: data.data.description || '',
          trigger_conditions: data.data.trigger_conditions || { and: [] },
          actions: data.data.actions || [],
          priority: data.data.priority || 5,
          is_active: data.data.is_active ?? true,
          tags: data.data.tags || [],
        })
      }
    } catch (error) {
      console.error('Failed to fetch automation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = mode === 'edit' && automationId
        ? `/api/automations/${automationId}`
        : '/api/automations'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          builder_id: builderId,
        }),
      })

      if (response.ok) {
        router.push(`/builder/automations?builder_id=${builderId}`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">Loading...</div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="Automation name"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-24"
            placeholder="Describe what this automation does"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Priority (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Add tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Trigger Conditions *</label>
        <ConditionBuilder
          value={formData.trigger_conditions}
          onChange={(condition) => setFormData({ ...formData, trigger_conditions: condition })}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Actions *</label>
        <ActionBuilder
          actions={formData.actions}
          onChange={(actions) => setFormData({ ...formData, actions })}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Automation'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}











