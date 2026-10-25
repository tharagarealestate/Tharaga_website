/**
 * OpenAI Lead Service
 * Advanced AI-powered features for lead management
 */

interface OpenAILeadEnrichment {
  company?: string
  job_title?: string
  industry?: string
  linkedin_url?: string
  social_profiles?: string[]
  estimated_income?: number
  buying_power_score?: number
  interests?: string[]
  risk_factors?: string[]
  enrichment_confidence: number
}

interface OpenAIWorkflowRecommendation {
  action: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimated_impact: string
  steps: string[]
  confidence: number
}

interface OpenAIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  intent: 'buying' | 'browsing' | 'researching' | 'not_interested'
  urgency: 'high' | 'medium' | 'low'
  key_insights: string[]
  recommended_approach: string
  conversation_starter?: string
}

export class OpenAILeadService {
  private apiKey: string | null = null
  private baseUrl = 'https://api.openai.com/v1'

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. AI features will be limited.')
    }
  }

  /**
   * Enrich lead data using OpenAI
   */
  async enrichLead(leadData: {
    name: string
    email: string
    phone?: string
    message?: string
    source?: string
  }): Promise<OpenAILeadEnrichment> {
    if (!this.apiKey) {
      return {
        enrichment_confidence: 0,
      }
    }

    try {
      const prompt = `Analyze this real estate lead and provide enrichment data in JSON format:

Lead Information:
- Name: ${leadData.name}
- Email: ${leadData.email}
- Phone: ${leadData.phone || 'Not provided'}
- Message: ${leadData.message || 'No message'}
- Source: ${leadData.source || 'Unknown'}

Provide enrichment data including:
1. Likely company/job title (if inferable from email domain or name)
2. Industry (if inferable)
3. Estimated income range (for Indian market)
4. Buying power score (0-100)
5. Key interests (based on message/content)
6. Risk factors (if any)

Return JSON only with this structure:
{
  "company": "string or null",
  "job_title": "string or null",
  "industry": "string or null",
  "estimated_income": number or null,
  "buying_power_score": number (0-100),
  "interests": ["string"],
  "risk_factors": ["string"],
  "enrichment_confidence": number (0-1)
}`

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a real estate lead enrichment specialist. Analyze leads and provide structured enrichment data in JSON format only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const enrichment = JSON.parse(content) as OpenAILeadEnrichment
      return enrichment
    } catch (error: any) {
      console.error('OpenAI enrichment error:', error)
      return {
        enrichment_confidence: 0,
      }
    }
  }

  /**
   * Analyze lead message/conversation for intent and sentiment
   */
  async analyzeLeadIntent(leadData: {
    message?: string
    interactions?: Array<{ type: string; notes?: string }>
    behavior?: {
      total_views: number
      engagement_score: number
    }
  }): Promise<OpenAIAnalysis> {
    if (!this.apiKey) {
      return {
        sentiment: 'neutral',
        intent: 'browsing',
        urgency: 'low',
        key_insights: [],
        recommended_approach: 'Standard follow-up process',
      }
    }

    try {
      const conversationContext = leadData.interactions
        ?.map(i => `${i.type}: ${i.notes || 'No notes'}`)
        .join('\n') || 'No previous interactions'

      const prompt = `Analyze this real estate lead's intent and provide insights:

Message: ${leadData.message || 'No message provided'}
Previous Interactions:
${conversationContext}
Behavior: ${leadData.behavior?.total_views || 0} property views, engagement score: ${leadData.behavior?.engagement_score || 0}

Provide analysis in JSON format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "intent": "buying" | "browsing" | "researching" | "not_interested",
  "urgency": "high" | "medium" | "low",
  "key_insights": ["insight1", "insight2"],
  "recommended_approach": "string describing best approach",
  "conversation_starter": "suggested opening message"
}`

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a real estate sales expert analyzing lead intent and sentiment. Provide structured analysis in JSON format only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 400,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content) as OpenAIAnalysis
    } catch (error: any) {
      console.error('OpenAI intent analysis error:', error)
      return {
        sentiment: 'neutral',
        intent: 'browsing',
        urgency: 'low',
        key_insights: [],
        recommended_approach: 'Standard follow-up process',
      }
    }
  }

  /**
   * Generate workflow recommendations based on lead data
   */
  async generateWorkflowRecommendation(leadData: {
    score: number
    category: string
    last_activity?: string
    interactions_count: number
    conversion_probability?: number
  }): Promise<OpenAIWorkflowRecommendation> {
    if (!this.apiKey) {
      return {
        action: 'Standard follow-up',
        reason: 'AI analysis unavailable',
        priority: 'medium',
        estimated_impact: 'Moderate',
        steps: ['Contact lead', 'Schedule viewing', 'Follow up'],
        confidence: 0.5,
      }
    }

    try {
      const prompt = `Based on this lead data, recommend the best workflow action:

Lead Score: ${leadData.score}/10
Category: ${leadData.category}
Last Activity: ${leadData.last_activity || 'Never'}
Interactions: ${leadData.interactions_count}
Conversion Probability: ${leadData.conversion_probability || 0}

Provide workflow recommendation in JSON:
{
  "action": "specific action to take",
  "reason": "why this action is recommended",
  "priority": "high" | "medium" | "low",
  "estimated_impact": "High" | "Medium" | "Low",
  "steps": ["step1", "step2", "step3"],
  "confidence": number (0-1)
}`

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a real estate workflow optimization expert. Recommend specific, actionable workflows in JSON format only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content) as OpenAIWorkflowRecommendation
    } catch (error: any) {
      console.error('OpenAI workflow recommendation error:', error)
      return {
        action: 'Standard follow-up',
        reason: 'AI analysis unavailable',
        priority: 'medium',
        estimated_impact: 'Moderate',
        steps: ['Contact lead', 'Schedule viewing', 'Follow up'],
        confidence: 0.5,
      }
    }
  }

  /**
   * Generate personalized message for lead
   */
  async generatePersonalizedMessage(leadData: {
    name: string
    message?: string
    property_title?: string
    property_location?: string
    intent?: string
  }): Promise<string> {
    if (!this.apiKey) {
      return `Hi ${leadData.name}, thank you for your interest. We'd love to help you find the perfect property.`
    }

    try {
      const prompt = `Generate a personalized, warm, and professional message for this real estate lead:

Name: ${leadData.name}
Their Message: ${leadData.message || 'No message provided'}
Property: ${leadData.property_title || 'General inquiry'}
Location: ${leadData.property_location || 'Not specified'}
Intent: ${leadData.intent || 'Unknown'}

Create a message that:
- Is warm and welcoming
- Acknowledges their specific interest
- Offers value (property details, viewing, consultation)
- Has a clear call-to-action
- Is concise (2-3 sentences)
- Feels personal, not templated`

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional real estate sales representative. Write warm, personalized messages that build rapport and drive action.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || `Hi ${leadData.name}, thank you for your interest.`
    } catch (error: any) {
      console.error('OpenAI message generation error:', error)
      return `Hi ${leadData.name}, thank you for your interest. We'd love to help you find the perfect property.`
    }
  }
}

// Export singleton instance
export const openAILeadService = new OpenAILeadService()

