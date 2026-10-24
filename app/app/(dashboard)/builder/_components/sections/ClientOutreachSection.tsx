"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, MessageCircle, Phone, Plus, Trash2, Edit2, Sparkles, BookOpen, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  SMS_TEMPLATES,
  WHATSAPP_TEMPLATES,
  getCategories,
  validateMessage,
  estimateSMSSegments,
  replaceVariables,
  extractVariables,
  type MessageTemplate as PreBuiltTemplate
} from '@/lib/integrations/messaging/templates'
import { getSectionClassName } from '../design-system'

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
  const [selectedType, setSelectedType] = useState<'sms' | 'whatsapp'>('whatsapp')

  const [sendForm, setSendForm] = useState({
    to: '',
    body: '',
    type: 'whatsapp' as 'sms' | 'whatsapp',
    template_id: '',
  })

  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'whatsapp' as 'sms' | 'whatsapp',
    body: '',
    variables: [] as string[],
  })

  const [validation, setValidation] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates()
  }, [activeTab])

  useEffect(() => {
    if (sendForm.body) {
      setValidation(validateMessage(sendForm.body, sendForm.type))
    } else {
      setValidation(null)
    }
  }, [sendForm.body, sendForm.type])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messaging/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const handleSendMessage = async () => {
    if (!sendForm.to || !sendForm.body) { toast.error('Please fill in all required fields'); return }
    if (validation && !validation.valid) { toast.error('Fix validation errors first'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: sendForm.to, body: sendForm.body, type: sendForm.type }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Message sent!')
        setSendForm({ to: '', body: '', type: sendForm.type, template_id: '' })
        setValidation(null)
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch { toast.error('Error sending message') } finally { setLoading(false) }
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.body) { toast.error('Fill all required fields'); return }
    setLoading(true)
    try {
      const url = editingTemplate ? `/api/messaging/templates/${editingTemplate.id}` : '/api/messaging/templates'
      const res = await fetch(url, {
        method: editingTemplate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      })
      const data = await res.json()
      if (data.template) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!')
        setShowTemplateModal(false)
        setEditingTemplate(null)
        setTemplateForm({ name: '', type: 'whatsapp', body: '', variables: [] })
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch { toast.error('Error saving template') } finally { setLoading(false) }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    try {
      await fetch(`/api/messaging/templates/${id}`, { method: 'DELETE' })
      toast.success('Template deleted')
      fetchTemplates()
    } catch { toast.error('Error deleting template') }
  }

  const handleUseTemplate = (template: MessageTemplate) => {
    setSendForm({ ...sendForm, body: template.body, type: template.type, template_id: template.id })
    setActiveTab('send')
  }

  const handleUsePreBuiltTemplate = (template: PreBuiltTemplate) => {
    setSelectedPreBuiltTemplate(template)
    setSendForm({ ...sendForm, body: template.body, type: template.type })
    const vars: Record<string, string> = {}
    template.variables.forEach(v => { vars[v] = '' })
    setTemplateVariables(vars)
    if (template.variables.length > 0) setShowVariableModal(true)
    else setActiveTab('send')
  }

  const handleSavePreBuilt = async (template: PreBuiltTemplate) => {
    setLoading(true)
    try {
      const res = await fetch('/api/messaging/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: template.name, type: template.type, body: template.body, variables: template.variables }),
      })
      const data = await res.json()
      if (data.template) toast.success('Saved to My Templates!')
      else toast.error(data.error || 'Failed to save')
    } catch { toast.error('Error saving template') } finally { setLoading(false) }
  }

  const handleApplyVariables = () => {
    if (!selectedPreBuiltTemplate) return
    setSendForm({ ...sendForm, body: replaceVariables(selectedPreBuiltTemplate.body, templateVariables), type: selectedPreBuiltTemplate.type })
    setShowVariableModal(false)
    setActiveTab('send')
  }

  const getPreBuiltTemplates = () => {
    const all = selectedType === 'sms' ? SMS_TEMPLATES : WHATSAPP_TEMPLATES
    return selectedCategory === 'all' ? all : all.filter(t => t.category === selectedCategory)
  }

  const categories = ['all', ...getCategories(selectedType)]

  const tabCls = (id: string) => `px-6 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
    activeTab === id ? 'text-amber-300 border-b-2 border-amber-300' : 'text-slate-400 hover:text-white'
  }`

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-emerald-400" />
          Client Outreach
        </h1>
        <p className="text-slate-300 text-base sm:text-lg">Send SMS & WhatsApp messages to your leads instantly</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-300/20 pb-2 overflow-x-auto">
        {[
          { id: 'send',      label: 'Send Message',    icon: Send },
          { id: 'library',   label: 'Template Library', icon: BookOpen },
          { id: 'templates', label: 'My Templates',     icon: MessageCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={tabCls(id)}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Send Message Tab ── */}
        {activeTab === 'send' && (
          <motion.div key="send" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 space-y-5">
              {/* Type toggle */}
              <div className="flex gap-4">
                {(['sms', 'whatsapp'] as const).map(t => (
                  <button key={t} onClick={() => setSendForm({ ...sendForm, type: t })}
                    className={`flex-1 p-4 rounded-lg transition-all text-center ${
                      sendForm.type === t
                        ? t === 'whatsapp' ? 'bg-emerald-500/20 border-2 border-emerald-500 text-white' : 'bg-amber-500/20 glow-border text-white'
                        : 'bg-slate-700/50 border border-slate-600/30 text-slate-400 hover:bg-slate-700'
                    }`}>
                    {t === 'whatsapp' ? <MessageCircle className="w-6 h-6 mx-auto mb-1" /> : <Phone className="w-6 h-6 mx-auto mb-1" />}
                    <div className="font-semibold text-sm">{t === 'whatsapp' ? 'WhatsApp' : 'SMS'}</div>
                  </button>
                ))}
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Phone Number</label>
                <input type="tel" value={sendForm.to} onChange={e => setSendForm({ ...sendForm, to: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none transition-all" />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                <textarea value={sendForm.body} onChange={e => setSendForm({ ...sendForm, body: e.target.value })}
                  placeholder="Type your message here..." rows={6}
                  maxLength={sendForm.type === 'sms' ? 1600 : 4096}
                  className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none transition-all resize-none" />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-slate-500 text-xs">
                    {sendForm.body.length}/{sendForm.type === 'sms' ? 1600 : 4096}
                    {sendForm.type === 'sms' && sendForm.body.length > 160 && (
                      <span className="ml-2 text-amber-300">({estimateSMSSegments(sendForm.body)} segments)</span>
                    )}
                  </span>
                  {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
                    <span className="text-xs text-rose-300 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />{validation.errors.length} error(s)
                    </span>
                  )}
                </div>
                {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
                  <div className="mt-2 space-y-1">
                    {validation.errors.map((e, i) => <p key={i} className="text-xs text-rose-300 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{e}</p>)}
                    {validation.warnings.map((w, i) => <p key={i} className="text-xs text-amber-300 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{w}</p>)}
                  </div>
                )}
              </div>

              <button onClick={handleSendMessage} disabled={loading || !sendForm.to || !sendForm.body || (!!validation && !validation.valid)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? 'Sending…' : <><Send className="w-4 h-4" />Send {sendForm.type === 'whatsapp' ? 'WhatsApp' : 'SMS'}</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Template Library Tab ── */}
        {activeTab === 'library' && (
          <motion.div key="library" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <div>
                  <h2 className="text-xl font-bold text-white">Pre-built Templates</h2>
                  <p className="text-slate-400 text-sm">Ready-to-use templates for leads, follow-ups & closings</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex gap-2">
                  {(['sms', 'whatsapp'] as const).map(t => (
                    <button key={t} onClick={() => { setSelectedType(t); setSelectedCategory('all') }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedType === t
                          ? t === 'whatsapp' ? 'bg-emerald-500/25 border border-emerald-500 text-emerald-300' : 'bg-amber-500/25 glow-border text-amber-300'
                          : 'bg-slate-700/50 border border-slate-600/30 text-slate-400 hover:bg-slate-700'
                      }`}>
                      {t === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedCategory === cat ? 'bg-amber-500 text-white' : 'bg-slate-700/50 border border-slate-600/30 text-slate-400 hover:bg-slate-700'
                      }`}>
                      {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPreBuiltTemplates().map(template => (
                  <div key={`${template.type}-${template.name}`}
                    className="bg-slate-800/80 border border-slate-700/50 hover:border-amber-400/40 rounded-xl p-5 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm mb-1.5 truncate">{template.name}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${template.type === 'sms' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {template.type.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300">{template.category}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mb-4 line-clamp-3 leading-relaxed">{template.body}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 text-xs">{template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}</span>
                      {template.characterCount && <span className="text-slate-500 text-xs">~{template.characterCount} chars</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUsePreBuiltTemplate(template)}
                        className="flex-1 px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-semibold">
                        Use Now
                      </button>
                      <button onClick={() => handleSavePreBuilt(template)} disabled={loading} title="Save to My Templates"
                        className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── My Templates Tab ── */}
        {activeTab === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">My Templates</h2>
                <button onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', type: 'whatsapp', body: '', variables: [] }); setShowTemplateModal(true) }}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 text-sm shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" />New Template
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-300" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                    <MessageCircle className="h-10 w-10 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">No templates yet</h4>
                  <p className="text-slate-400 text-sm">Create one or save from the Template Library</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <div key={template.id} className="bg-slate-800/80 border border-slate-700/50 hover:border-amber-400/40 rounded-xl p-5 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-sm">{template.name}</h3>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${template.type === 'sms' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {template.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingTemplate(template); setTemplateForm({ name: template.name, type: template.type, body: template.body, variables: template.variables || [] }); setShowTemplateModal(true) }}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs mb-4 line-clamp-3">{template.body}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Used {template.times_used}×</span>
                        <button onClick={() => handleUseTemplate(template)}
                          className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors text-xs font-medium">
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variable Fill Modal */}
      {showVariableModal && selectedPreBuiltTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-7 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Fill Variables</h2>
                <p className="text-slate-400 text-sm mt-0.5">{selectedPreBuiltTemplate.name}</p>
              </div>
              <button onClick={() => { setShowVariableModal(false); setSelectedPreBuiltTemplate(null); setTemplateVariables({}) }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {selectedPreBuiltTemplate.variables.map(variable => (
                <div key={variable}>
                  <label className="block text-slate-300 font-medium text-sm mb-1.5">
                    {variable.charAt(0).toUpperCase() + variable.slice(1).replace(/_/g, ' ')}
                  </label>
                  <input type="text" value={templateVariables[variable] || ''}
                    onChange={e => setTemplateVariables({ ...templateVariables, [variable]: e.target.value })}
                    placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                    className="w-full px-4 py-2.5 bg-slate-700/60 border border-slate-600/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-all" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowVariableModal(false); setSelectedPreBuiltTemplate(null); setTemplateVariables({}) }}
                className="flex-1 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all text-sm">Cancel</button>
              <button onClick={handleApplyVariables}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-semibold rounded-lg transition-all text-sm">
                Apply & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-7 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
              <button onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); setTemplateForm({ name: '', type: 'whatsapp', body: '', variables: [] }) }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 font-medium text-sm mb-1.5">Template Name</label>
                <input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Site Visit Follow-up"
                  className="w-full px-4 py-2.5 bg-slate-700/60 border border-slate-600/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-all" />
              </div>
              <div>
                <label className="block text-slate-300 font-medium text-sm mb-1.5">Type</label>
                <div className="flex gap-3">
                  {(['sms', 'whatsapp'] as const).map(t => (
                    <button key={t} onClick={() => setTemplateForm({ ...templateForm, type: t })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        templateForm.type === t
                          ? t === 'whatsapp' ? 'bg-emerald-500/25 border border-emerald-500 text-emerald-300' : 'bg-amber-500/25 border border-amber-500 text-amber-300'
                          : 'bg-slate-700/50 border border-slate-600/30 text-slate-400'
                      }`}>
                      {t === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium text-sm mb-1.5">Message Body</label>
                <textarea value={templateForm.body}
                  onChange={e => { const body = e.target.value; setTemplateForm({ ...templateForm, body, variables: extractVariables(body) }) }}
                  placeholder="Hello {{name}}, your property {{property_name}} is ready for viewing..."
                  rows={7}
                  className="w-full px-4 py-2.5 bg-slate-700/60 border border-slate-600/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-all resize-none" />
                <p className="text-slate-500 text-xs mt-1.5">Use {'{{variable}}'} for dynamic content</p>
                {templateForm.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {templateForm.variables.map(v => (
                      <span key={v} className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">{'{{'}{v}{'}}'}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); setTemplateForm({ name: '', type: 'whatsapp', body: '', variables: [] }) }}
                  className="flex-1 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all text-sm">Cancel</button>
                <button onClick={handleSaveTemplate} disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-semibold rounded-lg transition-all text-sm disabled:opacity-50">
                  {loading ? 'Saving…' : editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
