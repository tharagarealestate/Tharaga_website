"use client"

import { useState, useEffect } from 'react'
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
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-gold-500" />
            Client Outreach
          </h1>
          <p className="text-base text-blue-100/80 sm:text-lg max-w-2xl">
            Send SMS and WhatsApp messages to your leads
          </p>
        </header>

        {/* Tabs */}
        <div className="inline-flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <button 
            onClick={() => setActiveTab('send')}
            className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 ${
              activeTab === 'send'
                ? 'bg-gold-500 text-primary-950'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Send Message
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 ${
              activeTab === 'library'
                ? 'bg-gold-500 text-primary-950'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Template Library
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 ${
              activeTab === 'templates'
                ? 'bg-gold-500 text-primary-950'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            My Templates
          </button>
        </div>

        {/* Send Message Tab */}
        {activeTab === 'send' && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Recipient</label>
                <input
                  type="text"
                  value={sendForm.to}
                  onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                  placeholder="Phone number (e.g., +91 9876543210)"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Message</label>
                <textarea
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-gold-500 resize-none"
                />
                {validation && (
                  <div className="mt-2 space-y-1">
                    {validation.errors.map((error, i) => (
                      <p key={i} className="text-sm text-red-400">{error}</p>
                    ))}
                    {validation.warnings.map((warning, i) => (
                      <p key={i} className="text-sm text-amber-400">{warning}</p>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={loading || !sendForm.to || !sendForm.body}
                className="w-full px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 font-bold rounded-lg hover:shadow-lg hover:shadow-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        )}

        {/* Template Library Tab */}
        {activeTab === 'library' && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-gray-300">Template library coming soon...</p>
          </div>
        )}

        {/* My Templates Tab */}
        {activeTab === 'templates' && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            {loading ? (
              <p className="text-gray-300">Loading templates...</p>
            ) : (
              <p className="text-gray-300">My templates feature coming soon...</p>
            )}
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}

