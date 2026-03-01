// =============================================
// AI ASSISTANT CHAT API
// Real-time AI responses for builder dashboard
// =============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Contextual system prompts based on current page
const CONTEXTUAL_PROMPTS: Record<string, string> = {
  '/builder': `You are an AI assistant for Tharaga Builder Dashboard. Help builders understand their dashboard overview, key metrics, and how to get started. Be concise, actionable, and friendly.`,
  '/builder/leads': `You are an AI assistant helping builders manage leads. Explain lead scoring, prioritization, follow-up strategies, and how to use lead management features. Provide specific, actionable advice.`,
  '/builder/properties': `You are an AI assistant helping builders manage properties. Explain how to add properties, optimize listings, track performance, and distribute to portals. Be practical and specific.`,
  '/builder/revenue': `You are an AI assistant helping builders track revenue and payments. Explain revenue tracking, payment methods, billing, subscriptions, and forecasting. Provide clear guidance.`,
  '/builder/analytics': `You are an AI assistant helping builders understand analytics. Explain metrics, dashboards, conversion rates, lead quality, and how to improve performance. Use data-driven insights.`,
  '/builder/messaging': `You are an AI assistant helping builders communicate with clients. Explain messaging features, automated follow-ups, WhatsApp integration, and communication best practices.`,
  '/builder/settings': `You are an AI assistant helping builders configure settings. Explain profile management, integrations, team setup, notifications, and security settings. Be clear and step-by-step.`,
}

// Fallback responses when OpenAI is not available
const FALLBACK_RESPONSES: Record<string, string> = {
  'lead': `**Lead Management Guide:**

1. **Lead Scoring**: Leads are automatically scored (0-100) based on engagement, property interest, and behavior. Hot leads (80+) need immediate attention.

2. **Prioritization**:
   - **Hot leads (80-100)**: Respond within 1 hour, highest conversion potential
   - **Warm leads (50-79)**: Follow up within 24 hours, nurture with targeted content
   - **Cold leads (0-49)**: Use automated campaigns, long-term nurturing

3. **Actions Available**:
   - Click any lead card to view detailed information
   - Log interactions to track communication history
   - Export leads for external analysis
   - Use advanced filters to segment leads
   - View pipeline to see leads by stage

4. **Best Practices**:
   - Check dashboard daily for new hot leads
   - Set up automated follow-up sequences
   - Use pipeline view for visual workflow
   - Track conversion rates by lead source

Would you like details on any specific aspect?`,
  
  'property': `**Property Management Guide:**

1. **Adding Properties**:
   - Click "Add Property" button in Properties page
   - Fill required details: name, location, price, size
   - Upload high-quality images (minimum 5 recommended)
   - Add features, amenities, and property details
   - Set availability and pricing information

2. **Optimization**:
   - Use AI-powered optimization suggestions
   - Ensure all fields are complete
   - Write compelling descriptions
   - Add virtual tours and 3D floor plans
   - Optimize for search with relevant keywords

3. **Performance Tracking**:
   - Monitor views, inquiries, and conversion rates
   - Use analytics to identify top performers
   - A/B test descriptions and images
   - Track ROI by property

4. **Distribution**:
   - Publish to multiple portals automatically
   - Share on social media platforms
   - Generate property links for marketing
   - Use microsites for premium properties

Need help with a specific property task?`,
  
  'revenue': `**Revenue & Payments Guide:**

1. **Revenue Tracking**:
   - View total revenue in Revenue dashboard
   - Track by property, lead source, or time period
   - Monitor payment status and pending amounts
   - Analyze revenue trends and patterns

2. **Payment Methods**:
   - Configure in Settings > Billing
   - Accept via Razorpay (cards, UPI, net banking)
   - View payment history and download invoices
   - Set up recurring subscriptions

3. **Forecasting**:
   - Use revenue forecasting for predictions
   - Analyze trends and seasonal patterns
   - Set revenue goals and track progress
   - Identify growth opportunities

4. **Subscriptions**:
   - Manage subscription in Settings
   - Upgrade/downgrade plans as needed
   - View billing history and invoices
   - Track trial days and usage

Have questions about specific payment or billing?`,
  
  'analytics': `**Analytics & Insights Guide:**

1. **Key Metrics**:
   - Lead conversion rate (target: >5%)
   - Average response time (target: <1 hour)
   - Property view-to-inquiry ratio
   - Revenue per lead
   - Lead quality distribution

2. **Dashboard Overview**:
   - Real-time metrics on Analytics page
   - Filter by time period (day/week/month)
   - Export data for external analysis
   - Compare performance across periods

3. **Lead Quality Analysis**:
   - Monitor lead scoring trends
   - Identify high-performing sources
   - Track progression through funnel
   - Analyze conversion by lead type

4. **Performance Optimization**:
   - Compare metrics over time
   - Identify bottlenecks
   - Use insights to improve conversion
   - Test and iterate strategies

What specific metric would you like to understand?`,
  
  'message': `**Client Communication Guide:**

1. **Sending Messages**:
   - Go to Client Outreach page
   - Choose email, SMS, or WhatsApp
   - Use templates for common communications
   - Personalize with lead data

2. **Automated Messages**:
   - Set up in Settings > Notifications
   - Configure triggers (new lead, no response, etc.)
   - Personalize with dynamic content
   - Schedule follow-up sequences

3. **Communication History**:
   - View all interactions in Communications
   - Track response rates and engagement
   - Export communication logs
   - Analyze communication effectiveness

4. **WhatsApp Integration**:
   - Connect in Settings > Integrations
   - Send automated notifications
   - Receive messages in dashboard
   - Two-way communication support

Need help setting up a specific workflow?`,
  
  'setting': `**Settings & Configuration Guide:**

1. **Profile Settings**:
   - Update personal information
   - Change password and security
   - Manage notification preferences
   - Upload profile photo

2. **Company Settings**:
   - Add company details and logo
   - Configure business information
   - Set up team members and roles
   - Manage company branding

3. **Integrations**:
   - Connect Google Calendar for scheduling
   - Integrate Zoho CRM for lead sync
   - Set up WhatsApp Business
   - Connect tools via Zapier

4. **Team Management**:
   - Invite team members
   - Assign roles and permissions
   - Track team activity
   - Manage access levels

What would you like to configure?`,
}

function generateFallbackResponse(query: string, currentPath: string): string {
  const lowerQuery = query.toLowerCase()
  
  // Check for specific topics
  if (lowerQuery.includes('lead') || lowerQuery.includes('manage') || lowerQuery.includes('prioritize') || lowerQuery.includes('score')) {
    return FALLBACK_RESPONSES['lead']
  }
  if (lowerQuery.includes('property') || lowerQuery.includes('listing') || lowerQuery.includes('add') || lowerQuery.includes('optimize')) {
    return FALLBACK_RESPONSES['property']
  }
  if (lowerQuery.includes('revenue') || lowerQuery.includes('payment') || lowerQuery.includes('billing') || lowerQuery.includes('subscription')) {
    return FALLBACK_RESPONSES['revenue']
  }
  if (lowerQuery.includes('analytics') || lowerQuery.includes('metrics') || lowerQuery.includes('insight') || lowerQuery.includes('performance')) {
    return FALLBACK_RESPONSES['analytics']
  }
  if (lowerQuery.includes('message') || lowerQuery.includes('communication') || lowerQuery.includes('whatsapp') || lowerQuery.includes('follow')) {
    return FALLBACK_RESPONSES['message']
  }
  if (lowerQuery.includes('setting') || lowerQuery.includes('configure') || lowerQuery.includes('integration') || lowerQuery.includes('team')) {
    return FALLBACK_RESPONSES['setting']
  }
  
  // Default helpful response
  const contextualHelp = CONTEXTUAL_PROMPTS[currentPath] || CONTEXTUAL_PROMPTS['/builder']
  return `I understand you're asking about "${query}". 

Based on your current page, I can help you with:
- Understanding features and workflows
- Best practices for your business
- Troubleshooting common issues
- Setting up automations
- Optimizing your processes

Could you provide more specific details about what you'd like help with?`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a builder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'builder') {
      return NextResponse.json(
        { error: 'Forbidden - Builders only' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { message, currentPath = '/builder', conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Try to use OpenAI if available
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (openaiApiKey) {
      try {
        // Build conversation context
        const systemPrompt = CONTEXTUAL_PROMPTS[currentPath] || CONTEXTUAL_PROMPTS['/builder']
        
        const messages: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-6), // Last 6 messages for context
          { role: 'user', content: message }
        ]

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Cost-effective and fast
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 500,
            stream: false
          })
        })

        if (response.ok) {
          const data = await response.json()
          const aiResponse = data.choices[0]?.message?.content || ''
          
          if (aiResponse) {
            return NextResponse.json({
              success: true,
              response: aiResponse,
              model: 'gpt-4o-mini'
            })
          }
        }
      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError.message)
        // Fall through to fallback - don't throw error
      }
    }

    // Fallback to intelligent pattern matching - always succeeds
    const fallbackResponse = generateFallbackResponse(message, currentPath)
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      model: 'fallback'
    })

  } catch (error: any) {
    console.error('AI Chat API error:', error)
    // Always return a helpful response, never fail completely
    const fallbackResponse = generateFallbackResponse(
      typeof error === 'string' ? error : 'I encountered an issue, but I can still help!',
      '/builder'
    )
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      model: 'fallback-error'
    })
  }
}

