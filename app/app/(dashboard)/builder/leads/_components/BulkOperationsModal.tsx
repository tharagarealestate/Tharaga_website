"use client"

import { useState, useEffect } from 'react'
import { X, Mail, Tag, MessageSquare, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Lead } from './LeadCard'

interface BulkOperationsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedLeads: Lead[]
  onSuccess?: () => void
}

type OperationType = 'send_email' | 'update_status' | 'create_interaction' | 'assign_team_member' | null

interface TeamMember {
  id: string
  full_name: string
  email: string
}

export function BulkOperationsModal({ isOpen, onClose, selectedLeads, onSuccess }: BulkOperationsModalProps) {
  const [activeOperation, setActiveOperation] = useState<OperationType>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('')
  const [emailTemplate, setEmailTemplate] = useState('')
  const [personalizeEmail, setPersonalizeEmail] = useState(true)
  
  // Status update form state
  const [statusCategory, setStatusCategory] = useState<string>('')
  const [statusNotes, setStatusNotes] = useState('')
  
  // Interaction form state
  const [interactionType, setInteractionType] = useState<'phone_call' | 'email_sent' | 'whatsapp_message'>('email_sent')
  const [interactionNotes, setInteractionNotes] = useState('')
  const [interactionOutcome, setInteractionOutcome] = useState('')
  
  // Team assignment form state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('')
  
  const selectedCount = selectedLeads.length

  // Fetch team members on mount
  useEffect(() => {
    if (isOpen && activeOperation === 'assign_team_member') {
      fetchTeamMembers()
    }
  }, [isOpen, activeOperation])

  async function fetchTeamMembers() {
    try {
      const res = await fetch('/api/team-members')
      if (res.ok) {
        const data = await res.json()
        setTeamMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }

  async function handleBulkOperation() {
    if (!activeOperation) return
    
    setLoading(true)
    setResult(null)
    
    try {
      let payload: any = {
        lead_ids: selectedLeads.map(l => l.id),
      }
      
      switch (activeOperation) {
        case 'send_email':
          if (!emailSubject.trim() || !emailTemplate.trim()) {
            setResult({ success: false, message: 'Please fill in all required fields' })
            setLoading(false)
            return
          }
          payload.operation = 'send_email'
          payload.subject = emailSubject
          payload.email_template = emailTemplate
          payload.personalize = personalizeEmail
          break
          
        case 'update_status':
          payload.operation = 'update_status'
          payload.updates = {}
          if (statusCategory) payload.updates.category = statusCategory
          if (statusNotes) payload.updates.notes = statusNotes
          break
          
        case 'create_interaction':
          payload.operation = 'create_interaction'
          payload.interaction = {
            interaction_type: interactionType,
            notes: interactionNotes || undefined,
            outcome: interactionOutcome || undefined,
          }
          break
          
        case 'assign_team_member':
          if (!selectedTeamMember) {
            setResult({ success: false, message: 'Please select a team member' })
            setLoading(false)
            return
          }
          payload.operation = 'assign_team_member'
          payload.team_member_id = selectedTeamMember
          break
      }
      
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: getSuccessMessage(activeOperation, data),
          details: data,
        })
        
        // Reset forms
        resetForms()
        
        // Call success callback after a delay
        setTimeout(() => {
          onSuccess?.()
          handleClose()
        }, 2000)
      } else {
        setResult({
          success: false,
          message: data.error || 'Operation failed',
          details: data,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred. Please try again.',
        details: error,
      })
    } finally {
      setLoading(false)
    }
  }

  function getSuccessMessage(operation: OperationType, data: any): string {
    switch (operation) {
      case 'send_email':
        return `Successfully sent ${data.summary?.successful || 0} emails`
      case 'update_status':
        return `Updated ${data.updated_count || 0} leads`
      case 'create_interaction':
        return `Created ${data.created_count || 0} interactions`
      case 'assign_team_member':
        return `Assigned ${data.assigned_count || 0} leads to team member`
      default:
        return 'Operation completed successfully'
    }
  }

  function resetForms() {
    setEmailSubject('')
    setEmailTemplate('')
    setPersonalizeEmail(true)
    setStatusCategory('')
    setStatusNotes('')
    setInteractionType('email_sent')
    setInteractionNotes('')
    setInteractionOutcome('')
    setSelectedTeamMember('')
  }

  function handleClose() {
    setActiveOperation(null)
    setResult(null)
    resetForms()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border" style={{ boxShadow: '0 8px 28px rgba(110,13,37,.08)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bulk Operations</h2>
            <p className="text-sm text-fgMuted">{selectedCount} lead{selectedCount !== 1 ? 's' : ''} selected</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted/40 rounded transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!activeOperation ? (
            // Operation Selection
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OperationCard
                icon={Mail}
                title="Send Email"
                description="Send personalized emails to selected leads"
                onClick={() => setActiveOperation('send_email')}
                disabled={selectedCount === 0}
              />
              <OperationCard
                icon={Tag}
                title="Update Status"
                description="Update category and add notes to leads"
                onClick={() => setActiveOperation('update_status')}
                disabled={selectedCount === 0}
              />
              <OperationCard
                icon={MessageSquare}
                title="Create Interaction"
                description="Log phone calls, emails, or WhatsApp messages"
                onClick={() => setActiveOperation('create_interaction')}
                disabled={selectedCount === 0}
              />
              <OperationCard
                icon={UserPlus}
                title="Assign Team Member"
                description="Assign leads to team members for follow-up"
                onClick={() => setActiveOperation('assign_team_member')}
                disabled={selectedCount === 0}
              />
            </div>
          ) : (
            // Operation Form
            <div className="space-y-6">
              {activeOperation === 'send_email' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email Subject *
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g., Welcome to Tharaga Properties"
                      className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email Template *
                    </label>
                    <textarea
                      value={emailTemplate}
                      onChange={(e) => setEmailTemplate(e.target.value)}
                      placeholder="Hi {{name}},\n\nThank you for your interest in our properties..."
                      rows={8}
                      className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                    />
                    <p className="text-xs text-fgMuted mt-1">Use {'{{name}}'} to personalize with lead's name</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="personalize"
                      checked={personalizeEmail}
                      onChange={(e) => setPersonalizeEmail(e.target.checked)}
                      className="w-4 h-4 text-[#6e0d25] border-border rounded focus:ring-[#6e0d25]"
                    />
                    <label htmlFor="personalize" className="text-sm">
                      Personalize emails with lead names
                    </label>
                  </div>
                </div>
              )}

              {activeOperation === 'update_status' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    <select
                      value={statusCategory}
                      onChange={(e) => setStatusCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                    >
                      <option value="">Select category...</option>
                      <option value="Hot Lead">Hot Lead</option>
                      <option value="Warm Lead">Warm Lead</option>
                      <option value="Developing Lead">Developing Lead</option>
                      <option value="Cold Lead">Cold Lead</option>
                      <option value="Low Quality">Low Quality</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Add notes about these leads..."
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                    />
                  </div>
                </div>
              )}

              {activeOperation === 'create_interaction' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Interaction Type
                    </label>
                    <select
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                    >
                      <option value="phone_call">Phone Call</option>
                      <option value="email_sent">Email Sent</option>
                      <option value="whatsapp_message">WhatsApp Message</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      value={interactionNotes}
                      onChange={(e) => setInteractionNotes(e.target.value)}
                      placeholder="Add interaction notes..."
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Outcome (Optional)
                    </label>
                    <input
                      type="text"
                      value={interactionOutcome}
                      onChange={(e) => setInteractionOutcome(e.target.value)}
                      placeholder="e.g., Interested, Not interested, Follow-up needed"
                      className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                    />
                  </div>
                </div>
              )}

              {activeOperation === 'assign_team_member' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Select Team Member *
                    </label>
                    {teamMembers.length === 0 ? (
                      <div className="px-3 py-2 border border-border rounded bg-muted/40 text-fgMuted text-sm">
                        Loading team members...
                      </div>
                    ) : (
                      <select
                        value={selectedTeamMember}
                        onChange={(e) => setSelectedTeamMember(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-[#6e0d25] focus:border-[#6e0d25]"
                      >
                        <option value="">Select team member...</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.full_name || member.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Result Message */}
              {result && (
                <div className={`p-3 rounded flex items-start gap-3 border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={() => activeOperation ? setActiveOperation(null) : handleClose()}
            className="px-4 py-2 border border-border rounded hover:bg-muted/40 transition-colors text-sm"
          >
            {activeOperation ? 'Back' : 'Cancel'}
          </button>
          {activeOperation && (
            <button
              onClick={handleBulkOperation}
              disabled={loading}
              className="px-4 py-2 bg-[#6e0d25] hover:bg-[#8c1630] text-white rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Apply to ${selectedCount} lead${selectedCount !== 1 ? 's' : ''}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function OperationCard({
  icon: Icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: any
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-4 border border-border rounded hover:border-[#6e0d25] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
      style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #f0d9d9',
        boxShadow: '0 8px 28px rgba(110,13,37,.08)',
        transition: 'transform .2s ease, box-shadow .2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(110,13,37,.16)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(110,13,37,.08)'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-[#6e0d25]/10 group-hover:bg-[#6e0d25]/20 transition-colors">
          <Icon className="w-5 h-5 text-[#6e0d25]" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium mb-1 text-sm">{title}</h3>
          <p className="text-xs text-fgMuted">{description}</p>
        </div>
      </div>
    </button>
  )
}

