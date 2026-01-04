"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, MessageCircle, Phone, Plus, Trash2, Edit2, Check, X, Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { 
  SMS_TEMPLATES, 
  WHATSAPP_TEMPLATES, 
  getTemplate,
  getTemplatesByCategory,
  getCategories,
  validateMessage,
  estimateSMSSegments,
  replaceVariables,
  extractVariables,
  type MessageTemplate as PreBuiltTemplate
} from '@/lib/integrations/messaging/templates'
import { SectionWrapper } from './SectionWrapper'

interface MessageTemplate {
  id: string
  name: string
  type: 'sms' | 'whatsapp'
  body: string
  variables: string[]
  is_active: boolean
  times_used: number
  created_at: string
}

interface ClientOutreachSectionProps {
  onNavigate?: (section: string) => void
}

export function ClientOutreachSection({ onNavigate }: ClientOutreachSectionProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'library' | 'templates'>('send')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [selectedPreBuiltTemplate, setSelectedPreBuiltTemplate] = useState<PreBuiltTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<'sms' | 'whatsapp'>('sms')
  
  // Send message form
  const [sendForm, setSendForm] = useState({
    to: '',
    body: '',
    type: 'sms' as 'sms' | 'whatsapp',
    template_id: '',
  })

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'sms' as 'sms' | 'whatsapp',
    body: '',
    variables: [] as string[],
  })

  // Validation state
  const [validation, setValidation] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates()
    }
  }, [activeTab])

  useEffect(() => {
    // Validate message when body changes
    if (sendForm.body) {
      const result = validateMessage(sendForm.body, sendForm.type)
      setValidation(result)
    } else {
      setValidation(null)
    }
  }, [sendForm.body, sendForm.type])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/builder/messaging/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!sendForm.to || !sendForm.body) {
      toast.error('Please fill in all required fields')
      return
    }

    if (validation && !validation.valid) {
      toast.error('Please fix validation errors before sending')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/builder/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendForm),
      })

      if (response.ok) {
        toast.success('Message sent successfully!')
        setSendForm({ to: '', body: '', type: 'sms', template_id: '' })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to send message')
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-amber-300" />
          Client Outreach
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
          Send SMS and WhatsApp messages to your leads
        </p>
      </motion.div>

      {/* Tabs - Design System */}
      <div className="flex gap-2 border-b border-amber-300/20 pb-2 overflow-x-auto">
          {[
            { id: 'send', label: 'Send Message', icon: Send },
            { id: 'library', label: 'Template Library', icon: BookOpen },
            { id: 'templates', label: 'My Templates', icon: MessageCircle }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'send' | 'library' | 'templates')}
                className={`px-6 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-amber-300 border-b-2 border-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content - Design System Container */}
        <AnimatePresence mode="wait">
          {activeTab === 'send' && (
            <motion.div
              key="send"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Recipient</label>
                    <input
                      type="text"
                      value={sendForm.to}
                      onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                      placeholder="Phone number (e.g., +91 9876543210)"
                      className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:glow-border transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                    <textarea
                      value={sendForm.body}
                      onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                      placeholder="Type your message here..."
                      rows={6}
                      className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:glow-border transition-all resize-none"
                    />
                    {validation && (
                      <div className="mt-2 space-y-1">
                        {validation.errors.map((error, i) => (
                          <p key={i} className="text-sm text-rose-300">{error}</p>
                        ))}
                        {validation.warnings.map((warning, i) => (
                          <p key={i} className="text-sm text-amber-300">{warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !sendForm.to || !sendForm.body}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <div className="text-center py-16 px-6">
                  <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-slate-500" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">Template library coming soon</h4>
                  <p className="text-slate-400">Pre-built message templates will be available here</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                {loading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
                      <p className="text-slate-400">Loading templates...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 px-6">
                    <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <MessageCircle className="h-10 w-10 text-slate-500" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">My templates feature coming soon</h4>
                    <p className="text-slate-400">Save and manage your custom message templates</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}

