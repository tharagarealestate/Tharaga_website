"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Loader2,
  HelpCircle,
  BookOpen,
  Zap,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  MessageSquare
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_QUESTIONS = [
  { icon: Users, label: 'How to manage leads?', query: 'How do I manage and prioritize leads in my dashboard?' },
  { icon: Building2, label: 'Property listings', query: 'How do I add and optimize property listings?' },
  { icon: DollarSign, label: 'Revenue tracking', query: 'How does revenue tracking and payments work?' },
  { icon: MessageSquare, label: 'Client communication', query: 'How do I communicate with clients and send messages?' },
  { icon: TrendingUp, label: 'Analytics insights', query: 'How do I view analytics and performance metrics?' },
  { icon: Zap, label: 'Automation setup', query: 'How do I set up automations and workflows?' },
]

const CONTEXTUAL_HELP: Record<string, { title: string; suggestions: string[] }> = {
  '/builder': {
    title: 'Dashboard Overview',
    suggestions: [
      'How do I navigate the dashboard?',
      'What are the key metrics I should track?',
      'How do I get started with my first lead?'
    ]
  },
  '/builder/leads': {
    title: 'Lead Management',
    suggestions: [
      'How do I score and prioritize leads?',
      'What is a hot lead vs warm lead?',
      'How do I follow up with leads?',
      'How do I export lead data?'
    ]
  },
  '/builder/properties': {
    title: 'Property Management',
    suggestions: [
      'How do I add a new property?',
      'How do I optimize property listings?',
      'How do I track property performance?',
      'How do I distribute properties to portals?'
    ]
  },
  '/builder/revenue': {
    title: 'Revenue & Payments',
    suggestions: [
      'How do I track revenue?',
      'How do payment methods work?',
      'How do I view payment history?',
      'How do I forecast revenue?'
    ]
  },
  '/builder/analytics': {
    title: 'Analytics & Insights',
    suggestions: [
      'How do I read the analytics dashboard?',
      'What metrics are most important?',
      'How do I improve conversion rates?',
      'How do I track lead quality?'
    ]
  },
  '/builder/messaging': {
    title: 'Client Communication',
    suggestions: [
      'How do I send messages to clients?',
      'How do I set up automated messages?',
      'How do I track communication history?',
      'How do I use WhatsApp integration?'
    ]
  },
  '/builder/settings': {
    title: 'Settings & Configuration',
    suggestions: [
      'How do I update my profile?',
      'How do I connect integrations?',
      'How do I manage team members?',
      'How do I configure notifications?'
    ]
  }
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  
  // Listen for custom event to open assistant
  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-ai-assistant', handleOpen)
    return () => window.removeEventListener('open-ai-assistant', handleOpen)
  }, [])

  // Keyboard shortcut: Press ? to open assistant
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press ? (Shift+/) to open assistant
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only if not typing in an input
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setIsOpen(true)
        }
      }
      // Press Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your AI assistant. I can help you with questions about leads, properties, revenue, analytics, and more. What would you like to know?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  const contextualHelp = CONTEXTUAL_HELP[pathname || ''] || CONTEXTUAL_HELP['/builder']

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async (query?: string) => {
    const userQuery = query || input.trim()
    if (!userQuery) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call real-time AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userQuery,
          currentPath: pathname || '/builder',
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || generateAIResponse(userQuery, pathname || ''),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantResponse])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIResponse = (query: string, currentPath: string): string => {
    const lowerQuery = query.toLowerCase()
    
    // Context-aware responses based on query and current page
    if (lowerQuery.includes('lead') || lowerQuery.includes('manage') || lowerQuery.includes('prioritize')) {
      return `**Lead Management Guide:**

1. **Lead Scoring**: Leads are automatically scored based on engagement, property interest, and behavior. Hot leads (80+) are your highest priority.

2. **Prioritization**: 
   - Hot leads: Respond within 1 hour
   - Warm leads: Follow up within 24 hours
   - Cold leads: Nurture with automated campaigns

3. **Actions Available**:
   - View lead details by clicking on any lead card
   - Log interactions to track communication history
   - Export leads for external analysis
   - Use filters to find specific lead segments

4. **Best Practices**:
   - Check your dashboard daily for new hot leads
   - Set up automated follow-up sequences
   - Use the pipeline view to see leads by stage

Would you like more details on any specific aspect?`
    }

    if (lowerQuery.includes('property') || lowerQuery.includes('listing') || lowerQuery.includes('add')) {
      return `**Property Management Guide:**

1. **Adding Properties**:
   - Click "Add Property" in the Properties page
   - Fill in all required details (name, location, price, etc.)
   - Upload high-quality images
   - Add property features and amenities

2. **Optimization**:
   - Use AI-powered optimization suggestions
   - Ensure all fields are complete
   - Add compelling descriptions
   - Include virtual tours if available

3. **Performance Tracking**:
   - Monitor views, inquiries, and conversion rates
   - Use analytics to identify top-performing properties
   - A/B test different descriptions and images

4. **Distribution**:
   - Publish to multiple portals automatically
   - Share on social media
   - Generate property links for marketing

Need help with a specific property task?`
    }

    if (lowerQuery.includes('revenue') || lowerQuery.includes('payment') || lowerQuery.includes('billing')) {
      return `**Revenue & Payments Guide:**

1. **Revenue Tracking**:
   - View total revenue in the Revenue dashboard
   - Track revenue by property, lead source, or time period
   - Monitor payment status and pending amounts

2. **Payment Methods**:
   - Configure payment methods in Settings > Billing
   - Accept payments via Razorpay (cards, UPI, net banking)
   - View payment history and download invoices

3. **Forecasting**:
   - Use revenue forecasting to predict future income
   - Analyze trends and seasonal patterns
   - Set revenue goals and track progress

4. **Subscriptions**:
   - Manage your subscription in Settings
   - Upgrade or downgrade plans as needed
   - View billing history and invoices

Have questions about a specific payment or billing issue?`
    }

    if (lowerQuery.includes('analytics') || lowerQuery.includes('metrics') || lowerQuery.includes('insight')) {
      return `**Analytics & Insights Guide:**

1. **Key Metrics to Track**:
   - Lead conversion rate
   - Average response time
   - Property view-to-inquiry ratio
   - Revenue per lead

2. **Dashboard Overview**:
   - View real-time metrics on the Analytics page
   - Use filters to analyze specific time periods
   - Export data for external analysis

3. **Lead Quality Analysis**:
   - Monitor lead scoring trends
   - Identify high-performing lead sources
   - Track lead progression through the funnel

4. **Performance Optimization**:
   - Compare metrics across time periods
   - Identify bottlenecks in your sales process
   - Use insights to improve conversion rates

What specific metric would you like to understand better?`
    }

    if (lowerQuery.includes('message') || lowerQuery.includes('communication') || lowerQuery.includes('whatsapp')) {
      return `**Client Communication Guide:**

1. **Sending Messages**:
   - Go to Client Outreach to send messages
   - Choose between email, SMS, or WhatsApp
   - Use templates for common communications

2. **Automated Messages**:
   - Set up automated follow-ups in Settings
   - Configure triggers (new lead, no response, etc.)
   - Personalize messages with lead data

3. **Communication History**:
   - View all interactions in the Communications page
   - Track response rates and engagement
   - Export communication logs

4. **WhatsApp Integration**:
   - Connect WhatsApp Business in Settings > Integrations
   - Send automated notifications
   - Receive messages directly in the dashboard

Need help setting up a specific communication workflow?`
    }

    if (lowerQuery.includes('setting') || lowerQuery.includes('configure') || lowerQuery.includes('integration')) {
      return `**Settings & Configuration Guide:**

1. **Profile Settings**:
   - Update your personal information
   - Change password and security settings
   - Manage notification preferences

2. **Company Settings**:
   - Add company details and logo
   - Configure business information
   - Set up team members and roles

3. **Integrations**:
   - Connect Google Calendar for scheduling
   - Integrate Zoho CRM for lead sync
   - Set up WhatsApp Business for messaging
   - Connect other tools via Zapier

4. **Team Management**:
   - Invite team members
   - Assign roles and permissions
   - Track team activity

What would you like to configure?`
    }

    // Default helpful response
    return `I understand you're asking about "${query}". Let me help you with that!

Based on your current page (${contextualHelp.title}), here are some things I can help with:

${contextualHelp.suggestions.map(s => `• ${s}`).join('\n')}

You can also ask me about:
- How to use specific features
- Best practices for lead management
- Troubleshooting common issues
- Setting up automations
- Understanding analytics and metrics

What specific question can I answer for you?`
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-r from-gold-600 to-gold-500",
          "shadow-lg shadow-gold-500/30",
          "flex items-center justify-center",
          "text-white",
          "hover:scale-110 active:scale-95",
          "transition-all duration-200",
          "border-2 border-white/20"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gold-600 to-gold-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
                  <p className="text-xs text-white/80">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Contextual Help Section */}
            <div className="px-4 pt-3 pb-2 bg-slate-800/50 border-b border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-gold-400" />
                <span className="text-xs font-medium text-gray-300">{contextualHelp.title}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contextualHelp.suggestions.slice(0, 2).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      message.role === 'user'
                        ? "bg-gradient-to-r from-gold-600 to-gold-500 text-white"
                        : "bg-slate-700/50 text-gray-100 border border-white/10"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    <div className={cn(
                      "text-[10px] mt-1.5",
                      message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 rounded-2xl px-4 py-2.5 border border-white/10">
                    <Loader2 className="w-4 h-4 text-gold-400 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-white/10 bg-slate-800/30">
                <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_QUESTIONS.slice(0, 4).map((q, idx) => {
                    const Icon = q.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(q.query)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[10px] border border-white/10"
                      >
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{q.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10 bg-slate-800/50">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    input.trim() && !isLoading
                      ? "bg-gradient-to-r from-gold-600 to-gold-500 text-white hover:scale-110 shadow-lg shadow-gold-500/30"
                      : "bg-slate-700/50 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

