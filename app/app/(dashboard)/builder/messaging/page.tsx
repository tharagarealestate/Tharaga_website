'use client'

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

export default function MessagingPage() {
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
    try {
      const response = await fetch('/api/messaging/templates')
      const data = await response.json()
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!sendForm.to || !sendForm.body) {
      toast.error('Please fill in all required fields')
      return
    }

    const validationResult = validateMessage(sendForm.body, sendForm.type)
    if (!validationResult.valid) {
      toast.error(validationResult.errors.join(', '))
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sendForm.to,
          body: sendForm.body,
          type: sendForm.type,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Message sent successfully!')
        setSendForm({ to: '', body: '', type: 'sms', template_id: '' })
        setValidation(null)
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch (error) {
      toast.error('Error sending message')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.body) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const url = editingTemplate
        ? `/api/messaging/templates/${editingTemplate.id}`
        : '/api/messaging/templates'
      
      const method = editingTemplate ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      })

      const data = await response.json()
      if (data.template) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!')
        setShowTemplateModal(false)
        setEditingTemplate(null)
        setTemplateForm({ name: '', type: 'sms', body: '', variables: [] })
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      toast.error('Error saving template')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/messaging/templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Template deleted!')
        fetchTemplates()
      } else {
        toast.error('Failed to delete template')
      }
    } catch (error) {
      toast.error('Error deleting template')
    }
  }

  const handleUseTemplate = (template: MessageTemplate) => {
    setSendForm({
      ...sendForm,
      body: template.body,
      type: template.type,
      template_id: template.id,
    })
    setActiveTab('send')
  }

  const handleUsePreBuiltTemplate = (template: PreBuiltTemplate) => {
    setSelectedPreBuiltTemplate(template)
    setSendForm({
      ...sendForm,
      body: template.body,
      type: template.type,
    })
    
    // Initialize variables
    const vars: Record<string, string> = {}
    template.variables.forEach(v => {
      vars[v] = ''
    })
    setTemplateVariables(vars)
    
    if (template.variables.length > 0) {
      setShowVariableModal(true)
    } else {
      setActiveTab('send')
    }
  }

  const handleSavePreBuiltTemplate = async (template: PreBuiltTemplate) => {
    setLoading(true)
    try {
      const response = await fetch('/api/messaging/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          type: template.type,
          body: template.body,
          variables: template.variables,
        }),
      })

      const data = await response.json()
      if (data.template) {
        toast.success('Template saved to your library!')
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      toast.error('Error saving template')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyVariables = () => {
    if (!selectedPreBuiltTemplate) return
    
    const filledBody = replaceVariables(selectedPreBuiltTemplate.body, templateVariables)
    setSendForm({
      ...sendForm,
      body: filledBody,
      type: selectedPreBuiltTemplate.type,
    })
    setShowVariableModal(false)
    setActiveTab('send')
  }

  const getPreBuiltTemplates = () => {
    const allTemplates = selectedType === 'sms' ? SMS_TEMPLATES : WHATSAPP_TEMPLATES
    if (selectedCategory === 'all') {
      return allTemplates
    }
    return allTemplates.filter(t => t.category === selectedCategory)
  }

  const categories = ['all', ...getCategories(selectedType)]

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden'>
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>

      <div className='relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-white mb-2 flex items-center gap-3'>
            <MessageSquare className='w-10 h-10 text-gold-500' />
            Client Outreach
          </h1>
          <p className='text-gray-300'>Send SMS and WhatsApp messages to your leads</p>
        </div>

        {/* Tabs */}
        <div className='inline-flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8'>
          <button 
            onClick={() => setActiveTab('send')}
            className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 ${
              activeTab === 'send'
                ? 'bg-gold-500 text-primary-950'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Send className='w-4 h-4 inline mr-2' />
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
            <BookOpen className='w-4 h-4 inline mr-2' />
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
            <MessageCircle className='w-4 h-4 inline mr-2' />
            My Templates
          </button>
        </div>

        {/* Send Message Tab */}
        {activeTab === 'send' && (
          <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8'>
            <div className='space-y-6'>
              {/* Message Type Toggle */}
              <div className='flex gap-4'>
                <button
                  onClick={() => setSendForm({ ...sendForm, type: 'sms' })}
                  className={`flex-1 p-4 rounded-xl transition-all ${
                    sendForm.type === 'sms'
                      ? 'bg-gold-500/20 glow-border text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Phone className='w-6 h-6 mx-auto mb-2' />
                  <div className='font-semibold'>SMS</div>
                </button>
                <button
                  onClick={() => setSendForm({ ...sendForm, type: 'whatsapp' })}
                  className={`flex-1 p-4 rounded-xl transition-all ${
                    sendForm.type === 'whatsapp'
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <MessageCircle className='w-6 h-6 mx-auto mb-2' />
                  <div className='font-semibold'>WhatsApp</div>
                </button>
              </div>

              {/* Recipient */}
              <div>
                <label className='block text-white font-medium mb-2'>Recipient Phone Number</label>
                <input
                  type='tel'
                  value={sendForm.to}
                  onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                  placeholder='+91 9876543210'
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500'
                />
              </div>

              {/* Message Body */}
              <div>
                <label className='block text-white font-medium mb-2'>Message</label>
                <textarea
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  placeholder='Type your message here...'
                  rows={8}
                  maxLength={sendForm.type === 'sms' ? 1600 : 4096}
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none'
                />
                <div className='flex items-center justify-between mt-2'>
                  <div className='text-gray-400 text-sm'>
                    {sendForm.body.length}/{sendForm.type === 'sms' ? 1600 : 4096}
                    {sendForm.type === 'sms' && sendForm.body.length > 160 && (
                      <span className='ml-2 text-amber-400'>
                        ({estimateSMSSegments(sendForm.body)} segments)
                      </span>
                    )}
                  </div>
                  {validation && (
                    <div className='flex items-center gap-2'>
                      {validation.errors.length > 0 && (
                        <div className='flex items-center gap-1 text-red-400 text-sm'>
                          <AlertCircle className='w-4 h-4' />
                          {validation.errors.length} error(s)
                        </div>
                      )}
                      {validation.warnings.length > 0 && (
                        <div className='flex items-center gap-1 text-amber-400 text-sm'>
                          <AlertCircle className='w-4 h-4' />
                          {validation.warnings.length} warning(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
                  <div className='mt-2 space-y-1'>
                    {validation.errors.map((error, i) => (
                      <div key={i} className='text-red-400 text-sm flex items-center gap-2'>
                        <AlertCircle className='w-4 h-4' />
                        {error}
                      </div>
                    ))}
                    {validation.warnings.map((warning, i) => (
                      <div key={i} className='text-amber-400 text-sm flex items-center gap-2'>
                        <AlertCircle className='w-4 h-4' />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={loading || (validation && !validation.valid)}
                className='w-full py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 font-bold rounded-xl hover:shadow-2xl hover:shadow-gold-500/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        )}

        {/* Template Library Tab */}
        {activeTab === 'library' && (
          <div className='space-y-6'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h2 className='text-2xl font-bold text-white mb-2 flex items-center gap-2'>
                  <Sparkles className='w-6 h-6 text-gold-500' />
                  Pre-built Templates
                </h2>
                <p className='text-gray-400'>Ready-to-use templates for common scenarios</p>
              </div>
            </div>

            {/* Type and Category Filters */}
            <div className='flex gap-4 flex-wrap'>
              <div className='flex gap-2'>
                <button
                  onClick={() => setSelectedType('sms')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedType === 'sms'
                      ? 'bg-gold-500/20 glow-border text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  SMS
                </button>
                <button
                  onClick={() => setSelectedType('whatsapp')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedType === 'whatsapp'
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  WhatsApp
                </button>
              </div>
              <div className='flex gap-2 flex-wrap'>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      selectedCategory === cat
                        ? 'bg-gold-500 text-primary-950 font-semibold'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {getPreBuiltTemplates().map((template) => (
                <div
                  key={`${template.type}-${template.name}`}
                  className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:glow-border transition-all relative group'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='text-white font-semibold text-lg mb-1'>{template.name}</h3>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          template.type === 'sms'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {template.type.toUpperCase()}
                        </span>
                        <span className='inline-block px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300'>
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className='text-gray-300 text-sm mb-4 line-clamp-4'>{template.body}</p>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='text-gray-400 text-xs'>
                      {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
                    </span>
                    {template.characterCount && (
                      <span className='text-gray-400 text-xs'>
                        ~{template.characterCount} chars
                      </span>
                    )}
                  </div>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleUsePreBuiltTemplate(template)}
                      className='flex-1 px-4 py-2 bg-gold-500/20 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors text-sm font-medium'
                    >
                      Use Now
                    </button>
                    <button
                      onClick={() => handleSavePreBuiltTemplate(template)}
                      disabled={loading}
                      className='px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm'
                      title='Save to My Templates'
                    >
                      <Plus className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Templates Tab */}
        {activeTab === 'templates' && (
          <div className='space-y-6'>
            {/* Create Template Button */}
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold text-white'>My Templates</h2>
              <button
                onClick={() => {
                  setEditingTemplate(null)
                  setTemplateForm({ name: '', type: 'sms', body: '', variables: [] })
                  setShowTemplateModal(true)
                }}
                className='px-6 py-3 bg-gold-500 text-primary-950 font-semibold rounded-xl hover:bg-gold-600 transition-all flex items-center gap-2'
              >
                <Plus className='w-5 h-5' />
                Create Template
              </button>
            </div>

            {/* Templates Grid */}
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:glow-border transition-all'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div>
                      <h3 className='text-white font-semibold text-lg'>{template.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                        template.type === 'sms'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {template.type.toUpperCase()}
                      </span>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => {
                          setEditingTemplate(template)
                          setTemplateForm({
                            name: template.name,
                            type: template.type,
                            body: template.body,
                            variables: template.variables || [],
                          })
                          setShowTemplateModal(true)
                        }}
                        className='p-2 hover:bg-white/10 rounded-lg transition-colors'
                      >
                        <Edit2 className='w-4 h-4 text-gray-400' />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className='p-2 hover:bg-red-500/20 rounded-lg transition-colors'
                      >
                        <Trash2 className='w-4 h-4 text-red-400' />
                      </button>
                    </div>
                  </div>
                  <p className='text-gray-300 text-sm mb-4 line-clamp-3'>{template.body}</p>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400 text-xs'>
                      Used {template.times_used} times
                    </span>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className='px-4 py-2 bg-gold-500/20 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors text-sm font-medium'
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {templates.length === 0 && (
              <div className='text-center py-12 text-gray-400'>
                <MessageCircle className='w-16 h-16 mx-auto mb-4 opacity-50' />
                <p>No templates yet. Create your first template or save one from the Template Library!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variable Replacement Modal */}
      {showVariableModal && selectedPreBuiltTemplate && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='backdrop-blur-xl bg-primary-900/95 border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h2 className='text-2xl font-bold text-white'>Fill Template Variables</h2>
                <p className='text-gray-400 text-sm mt-1'>{selectedPreBuiltTemplate.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowVariableModal(false)
                  setSelectedPreBuiltTemplate(null)
                  setTemplateVariables({})
                }}
                className='p-2 hover:bg-white/10 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-400' />
              </button>
            </div>

            <div className='space-y-4 mb-6'>
              {selectedPreBuiltTemplate.variables.map((variable) => (
                <div key={variable}>
                  <label className='block text-white font-medium mb-2'>
                    {variable.charAt(0).toUpperCase() + variable.slice(1).replace(/_/g, ' ')}
                  </label>
                  <input
                    type='text'
                    value={templateVariables[variable] || ''}
                    onChange={(e) => setTemplateVariables({
                      ...templateVariables,
                      [variable]: e.target.value
                    })}
                    placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                    className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500'
                  />
                </div>
              ))}
            </div>

            <div className='flex gap-4'>
              <button
                onClick={() => {
                  setShowVariableModal(false)
                  setSelectedPreBuiltTemplate(null)
                  setTemplateVariables({})
                }}
                className='flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all'
              >
                Cancel
              </button>
              <button
                onClick={handleApplyVariables}
                className='flex-1 px-6 py-3 bg-gold-500 text-primary-950 font-semibold rounded-xl hover:bg-gold-600 transition-all'
              >
                Apply & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='backdrop-blur-xl bg-primary-900/95 border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-white'>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={() => {
                  setShowTemplateModal(false)
                  setEditingTemplate(null)
                  setTemplateForm({ name: '', type: 'sms', body: '', variables: [] })
                }}
                className='p-2 hover:bg-white/10 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-400' />
              </button>
            </div>

            <div className='space-y-6'>
              <div>
                <label className='block text-white font-medium mb-2'>Template Name</label>
                <input
                  type='text'
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder='e.g., Welcome Message'
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500'
                />
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Type</label>
                <div className='flex gap-4'>
                  <button
                    onClick={() => setTemplateForm({ ...templateForm, type: 'sms' })}
                    className={`flex-1 p-3 rounded-xl transition-all ${
                      templateForm.type === 'sms'
                        ? 'bg-gold-500/20 glow-border text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    onClick={() => setTemplateForm({ ...templateForm, type: 'whatsapp' })}
                    className={`flex-1 p-3 rounded-xl transition-all ${
                      templateForm.type === 'whatsapp'
                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400'
                    }`}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Message Body</label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => {
                    const body = e.target.value
                    const variables = extractVariables(body)
                    setTemplateForm({ ...templateForm, body, variables })
                  }}
                  placeholder='Hello {{name}}, thank you for your interest in {{property_name}}...'
                  rows={8}
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none'
                />
                <p className='text-gray-400 text-sm mt-2'>
                  Use {'{{variable_name}}'} for dynamic variables
                </p>
                {templateForm.variables.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-gray-400 text-sm mb-1'>Detected variables:</p>
                    <div className='flex flex-wrap gap-2'>
                      {templateForm.variables.map((v) => (
                        <span key={v} className='px-2 py-1 bg-gold-500/20 text-gold-300 rounded text-xs'>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='flex gap-4'>
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    setEditingTemplate(null)
                    setTemplateForm({ name: '', type: 'sms', body: '', variables: [] })
                  }}
                  className='flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  className='flex-1 px-6 py-3 bg-gold-500 text-primary-950 font-semibold rounded-xl hover:bg-gold-600 transition-all disabled:opacity-50'
                >
                  {loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
