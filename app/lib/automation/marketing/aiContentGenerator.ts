/**
 * AI Content Generation Helper Functions
 * Generates 50+ content variants for property marketing
 */

import { anthropicClient } from '@/lib/ai/anthropic'

export interface ContentVariants {
  property_descriptions: {
    short_50_words: string
    medium_150_words: string
    long_300_words: string
    luxury_tone: string
    practical_tone: string
    emotional_storytelling: string
    data_driven: string
    lifestyle_focused: string
    investment_focused: string
    family_oriented: string
  }
  headlines: {
    google_ads: string[]
    facebook_primary: string[]
    instagram_captions: string[]
    email_subject_lines: string[]
    seo_titles: string[]
  }
  ad_copy: {
    google_search_ads: Array<{
      headline_1: string
      headline_2: string
      headline_3: string
      description_1: string
      description_2: string
    }>
    facebook_carousel: Array<{
      card_1_text: string
      card_2_text: string
      card_3_text: string
      card_4_text: string
      card_5_text: string
    }>
    instagram_stories: Array<{
      slide_1: string
      slide_2: string
      slide_3: string
      slide_4: string
    }>
  }
  social_media_posts: {
    linkedin: string[]
    twitter: string[]
    facebook: string[]
    instagram: string[]
  }
  email_templates: {
    launch_announcement: {
      subject: string
      preview_text: string
      body_html: string
      cta_text: string
    }
    drip_sequence: Array<{
      day: number
      subject: string
      body: string
      cta: string
    }>
  }
  seo_content: {
    meta_description: string
    focus_keywords: string[]
    blog_article_outline: {
      title: string
      sections: Array<{
        heading: string
        content_points: string[]
      }>
    }
    faq_schema: Array<{
      question: string
      answer: string
    }>
  }
  whatsapp_messages: {
    broadcast_text: string
    chatbot_responses: {
      greeting: string
      pricing_query: string
      location_query: string
      amenities_query: string
    }
  }
  sms_templates: string[]
  video_scripts: {
    '15_second_teaser': {
      scene_1: string
      scene_2: string
      scene_3: string
    }
    '60_second_overview': {
      intro: string
      features: string
      location: string
      cta: string
    }
  }
  press_release: {
    headline: string
    dateline: string
    lead_paragraph: string
    body: string
    boilerplate: string
    contact: string
  }
}

export async function generateMasterContentSet(
  property: any,
  strategy: any
): Promise<ContentVariants> {
  const contentPrompt = `You are a master real estate copywriter. Generate comprehensive marketing content for this property.

PROPERTY: ${property.title}
LOCATION: ${property.location}
PRICE: ₹${(property.price || property.price_inr)?.toLocaleString('en-IN')}
TYPE: ${property.bhk_type} ${property.property_type}
TARGET AUDIENCE: ${JSON.stringify(strategy.target_audience?.primary || {})}
USPs: ${(strategy.unique_selling_propositions || []).join(', ')}
PRIMARY MESSAGE: ${strategy.messaging_strategy?.primary_message || ''}

Generate content in JSON format:
{
  "property_descriptions": {
    "short_50_words": "compelling 50-word description",
    "medium_150_words": "detailed 150-word description",
    "long_300_words": "comprehensive 300-word description",
    "luxury_tone": "high-end aspirational description",
    "practical_tone": "value-focused practical description",
    "emotional_storytelling": "narrative-driven description",
    "data_driven": "statistics and facts focused",
    "lifestyle_focused": "lifestyle benefits description",
    "investment_focused": "ROI and investment angle",
    "family_oriented": "family benefits focused"
  },
  "headlines": {
    "google_ads": ["headline 1 (30 chars)", "headline 2", "headline 3", "headline 4", "headline 5", "headline 6", "headline 7", "headline 8", "headline 9", "headline 10"],
    "facebook_primary": ["attention-grabbing headline 1", "headline 2", "headline 3", "headline 4", "headline 5"],
    "instagram_captions": ["caption 1 with hashtags", "caption 2", "caption 3"],
    "email_subject_lines": ["subject 1 (<60 chars)", "subject 2", "subject 3", "subject 4", "subject 5"],
    "seo_titles": ["SEO title 1 (60 chars, keyword-rich)", "SEO title 2", "SEO title 3"]
  },
  "ad_copy": {
    "google_search_ads": [
      {"headline_1": "headline", "headline_2": "headline", "headline_3": "headline", "description_1": "90 char description", "description_2": "90 char description"}
    ],
    "facebook_carousel": [
      {"card_1_text": "text", "card_2_text": "text", "card_3_text": "text", "card_4_text": "text", "card_5_text": "text"}
    ],
    "instagram_stories": [
      {"slide_1": "text overlay", "slide_2": "text overlay", "slide_3": "text overlay", "slide_4": "CTA text"}
    ]
  },
  "social_media_posts": {
    "linkedin": ["professional post 1 (with industry insights)", "professional post 2", "professional post 3"],
    "twitter": ["tweet 1 (280 chars)", "tweet 2", "tweet 3", "tweet 4", "tweet 5"],
    "facebook": ["post 1 (conversational tone)", "post 2", "post 3"],
    "instagram": ["post 1 (visual-first, hashtags)", "post 2", "post 3"]
  },
  "email_templates": {
    "launch_announcement": {
      "subject": "subject line",
      "preview_text": "preview text",
      "body_html": "complete email HTML",
      "cta_text": "CTA button text"
    },
    "drip_sequence": [
      {"day": 0, "subject": "subject", "body": "email body", "cta": "CTA"},
      {"day": 3, "subject": "subject", "body": "email body", "cta": "CTA"},
      {"day": 7, "subject": "subject", "body": "email body", "cta": "CTA"}
    ]
  },
  "seo_content": {
    "meta_description": "155 char meta description",
    "focus_keywords": ["keyword 1", "keyword 2", "keyword 3"],
    "blog_article_outline": {
      "title": "SEO article title",
      "sections": [
        {"heading": "H2 heading", "content_points": ["point 1", "point 2", "point 3"]}
      ]
    },
    "faq_schema": [
      {"question": "FAQ question 1", "answer": "detailed answer"},
      {"question": "FAQ question 2", "answer": "detailed answer"}
    ]
  },
  "whatsapp_messages": {
    "broadcast_text": "WhatsApp broadcast message (160 chars)",
    "chatbot_responses": {
      "greeting": "chatbot greeting",
      "pricing_query": "response to pricing question",
      "location_query": "response to location question",
      "amenities_query": "response to amenities question"
    }
  },
  "sms_templates": ["SMS 1 (160 chars)", "SMS 2", "SMS 3"],
  "video_scripts": {
    "15_second_teaser": {
      "scene_1": "visual + voiceover",
      "scene_2": "visual + voiceover",
      "scene_3": "CTA + voiceover"
    },
    "60_second_overview": {
      "intro": "0-10s: visual + script",
      "features": "10-35s: visual + script",
      "location": "35-50s: visual + script",
      "cta": "50-60s: visual + script"
    }
  },
  "press_release": {
    "headline": "press release headline",
    "dateline": "city, date",
    "lead_paragraph": "who, what, when, where, why",
    "body": "detailed press release body",
    "boilerplate": "about the builder",
    "contact": "media contact info"
  }
}`

  const response = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    temperature: 0.8,
    messages: [{ role: 'user', content: contentPrompt }],
  })

  const contentText = response.content[0].type === 'text' ? response.content[0].text : ''
  
  // Extract JSON from response
  const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                   contentText.match(/```\s*([\s\S]*?)\s*```/) ||
                   [null, contentText]
  
  try {
    return JSON.parse(jsonMatch[1] || jsonMatch[0] || contentText) as ContentVariants
  } catch (error) {
    console.error('[AI Content Generator] Error parsing response:', error)
    throw new Error('Failed to parse AI content generation response')
  }
}

export async function generateLocalizedVariants(
  masterContent: ContentVariants,
  property: any,
  languages: string[] = ['hi', 'ta', 'kn', 'te']
): Promise<Record<string, any>> {
  const localizedContent: Record<string, any> = {}

  for (const lang of languages) {
    const translationPrompt = `Translate and culturally adapt this property marketing content to ${lang} (use native script).

ENGLISH CONTENT:
Title: ${property.title}
Description: ${masterContent.property_descriptions.medium_150_words}
Headline: ${masterContent.headlines.facebook_primary[0]}

Requirements:
1. Translate to ${lang} with native script
2. Culturally adapt idioms and references
3. Maintain emotional impact
4. Keep key numbers and facts in original
5. Adapt tone for regional preferences

Return JSON:
{
  "title": "translated title",
  "description": "translated description",
  "headline": "translated headline",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`

    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: translationPrompt }],
    })

    const translationText = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = translationText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     translationText.match(/```\s*([\s\S]*?)\s*```/) ||
                     [null, translationText]
    
    try {
      localizedContent[lang] = JSON.parse(jsonMatch[1] || jsonMatch[0] || translationText)
    } catch (error) {
      console.error(`[AI Content Generator] Error parsing ${lang} translation:`, error)
      localizedContent[lang] = { error: 'Translation failed' }
    }
  }

  return localizedContent
}

export function generateABTestVariants(masterContent: ContentVariants) {
  return {
    variant_A_emotional: {
      approach: 'emotional',
      headline: masterContent.headlines.facebook_primary[0],
      description: masterContent.property_descriptions.emotional_storytelling,
      cta: 'Find Your Dream Home',
    },
    variant_B_rational: {
      approach: 'rational',
      headline: masterContent.headlines.facebook_primary[1],
      description: masterContent.property_descriptions.data_driven,
      cta: 'View Detailed Analysis',
    },
    variant_C_urgency: {
      approach: 'urgency',
      headline: masterContent.headlines.facebook_primary[2],
      description: masterContent.property_descriptions.short_50_words,
      cta: 'Limited Units - Book Now',
    },
    variant_D_luxury: {
      approach: 'luxury',
      headline: masterContent.headlines.facebook_primary[3],
      description: masterContent.property_descriptions.luxury_tone,
      cta: 'Experience Luxury Living',
    },
    variant_E_investment: {
      approach: 'investment',
      headline: masterContent.headlines.facebook_primary[4],
      description: masterContent.property_descriptions.investment_focused,
      cta: 'Calculate Your Returns',
    },
  }
}






