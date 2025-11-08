"use client"

import { useState } from 'react'
import { X, Phone, Mail, MessageSquare, Calendar, Handshake, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface LogInteractionModalProps {
  leadId: string
  leadName: string
  leadPhone?: string | null
  leadEmail?: string
  onClose: () => void
}

interface InteractionFormData {
  interaction_type: string
  property_id?: string
  scheduled_for?: string
  status: 'pending' | 'completed' | 'scheduled' | 'cancelled'
  notes?: string
  outcome?: string
  next_follow_up?: string
}

const INTERACTION_TYPES = [
  { value: 'phone_call', label: 'Phone Call', icon: Phone, color: 'bg-blue-500' },
  { value: 'email_sent', label: 'Email Sent', icon: Mail, color: 'bg-purple-500' },
  { value: 'whatsapp_message', label: 'WhatsApp Message', icon: MessageSquare, color: 'bg-green-500' },
  { value: 'site_visit_scheduled', label: 'Site Visit Scheduled', icon: Calendar, color: 'bg-orange-500' },
  { value: 'site_visit_completed', label: 'Site Visit Completed', icon: CheckCircle, color: 'bg-emerald-500' },
  { value: 'negotiation_started', label: 'Negotiation Started', icon: Handshake, color: 'bg-yellow-500' },
  { value: 'offer_made', label: 'Offer Made', icon: Handshake, color: 'bg-indigo-500' },
  { value: 'offer_accepted', label: 'Offer Accepted', icon: CheckCircle, color: 'bg-green-600' },
  { value: 'offer_rejected', label: 'Offer Rejected', icon: XCircle, color: 'bg-red-500' },
  { value: 'deal_closed', label: 'Deal Closed', icon: CheckCircle, color: 'bg-emerald-600' },
  { value: 'deal_lost', label: 'Deal Lost', icon: XCircle, color: 'bg-red-600' },
]

const OUTCOMES = [
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'follow_up', label: 'Follow Up Needed' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' },
]

async function logInteraction(leadId: string, data: InteractionFormData) {
  const res = await fetch(`/api/leads/${leadId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to log interaction')
  }
  
  return res.json()
}

export function LogInteractionModal({ 
  leadId, 
  leadName, 
  leadPhone, 
  leadEmail, 
  onClose 
}: LogInteractionModalProps) {
  const [formData, setFormData] = useState<InteractionFormData>({
    interaction_type: 'phone_call',
    status: 'completed',
    notes: '',
  })
  
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (data: InteractionFormData) => logInteraction(leadId, data),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      
      // Trigger sidebar refresh
      window.dispatchEvent(new CustomEvent('leadCountRefresh'))
      
      // Close modal
      onClose()
    },
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.interaction_type) {
      alert('Please select an interaction type')
      return
    }
    
    // Prepare data for API
    const submitData: InteractionFormData = {
      ...formData,
      scheduled_for: formData.scheduled_for || undefined,
      next_follow_up: formData.next_follow_up || undefined,
      notes: formData.notes?.trim() || undefined,
      property_id: formData.property_id || undefined,
      outcome: formData.outcome || undefined,
    }
    
    mutation.mutate(submitData)
  }
  
  const selectedType = INTERACTION_TYPES.find(t => t.value === formData.interaction_type)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Log Interaction</h2>
            <p className="text-sm text-gray-600 mt-1">Record interaction with {leadName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Interaction Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERACTION_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = formData.interaction_type === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, interaction_type: type.value })}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-primary-600 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{type.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Scheduled For (if scheduled) */}
          {(formData.status === 'scheduled' || formData.interaction_type.includes('scheduled')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled For *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_for || ''}
                onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required={formData.status === 'scheduled'}
              />
            </div>
          )}
          
          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcome
            </label>
            <select
              value={formData.outcome || ''}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select outcome...</option>
              {OUTCOMES.map(outcome => (
                <option key={outcome.value} value={outcome.value}>
                  {outcome.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this interaction..."
              rows={4}
              maxLength={5000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {(formData.notes?.length || 0)} / 5000 characters
            </div>
          </div>
          
          {/* Next Follow Up */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Follow Up
            </label>
            <input
              type="datetime-local"
              value={formData.next_follow_up || ''}
              onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {leadPhone && (
                <a
                  href={`tel:${leadPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              )}
              {leadEmail && (
                <a
                  href={`mailto:${leadEmail}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </a>
              )}
              {leadPhone && (
                <a
                  href={`https://wa.me/${leadPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
          
          {/* Error Message */}
          {mutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                {mutation.error instanceof Error ? mutation.error.message : 'Failed to log interaction'}
              </p>
            </div>
          )}
        </form>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={mutation.isPending || !formData.interaction_type}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Log Interaction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

