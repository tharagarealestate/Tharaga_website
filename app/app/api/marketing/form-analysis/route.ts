/**
 * MARKETING FORM ANALYSIS API
 * 
 * Analyzes user form input using AI and sends personalized email
 * based on property data and user preferences.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const maxDuration = 300 // 5 minutes for AI analysis and email sending

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface FormData {
  name: string
  email: string
  phone: string
  budget?: string
  preferredLocation?: string
  propertyType?: string
  bhkPreference?: string
  timeline?: string
  additionalInfo?: string
}

/**
 * Analyze form data using OpenAI
 */
async function analyzeFormData(
  formData: FormData,
  property: any
): Promise<{
  userIntent: string
  matchScore: number
  keyInsights: string[]
  personalizedMessage: string
  recommendations: string[]
}> {
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    // Fallback analysis
    return {
      userIntent: 'Property inquiry',
      matchScore: 70,
      keyInsights: [
        `User is interested in ${formData.propertyType || 'properties'}`,
        `Budget range: ${formData.budget || 'Not specified'}`,
        `Timeline: ${formData.timeline || 'Not specified'}`,
      ],
      personalizedMessage: `Hi ${formData.name}, thank you for your interest in ${property.title || 'our property'}.`,
      recommendations: [
        'Schedule a property viewing',
        'Request detailed property brochure',
        'Connect with our property consultant',
      ],
    }
  }

  try {
    const analysisPrompt = `Analyze this real estate form submission and provide insights:

USER INFORMATION:
- Name: ${formData.name}
- Budget: ${formData.budget || 'Not specified'}
- Preferred Location: ${formData.preferredLocation || 'Not specified'}
- Property Type: ${formData.propertyType || 'Not specified'}
- BHK Preference: ${formData.bhkPreference || 'Not specified'}
- Timeline: ${formData.timeline || 'Not specified'}
- Additional Info: ${formData.additionalInfo || 'None'}

PROPERTY DETAILS:
- Title: ${property.title || 'Property'}
- Location: ${property.locality || property.city || 'Location'}
- Type: ${property.property_type || 'Apartment'}
- Price: ₹${(property.price_inr || 0).toLocaleString('en-IN')}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Size: ${property.sqft || 'N/A'} sq ft
- Amenities: ${(property.amenities || []).join(', ') || 'Modern amenities'}

Analyze and provide:
1. User Intent (one sentence describing what the user is looking for)
2. Match Score (0-100, how well property matches user preferences)
3. Key Insights (3-5 bullet points about user preferences and needs)
4. Personalized Message (warm, personalized greeting message)
5. Recommendations (3-5 actionable recommendations for the user)

Return as JSON:
{
  "userIntent": "...",
  "matchScore": 85,
  "keyInsights": ["...", "...", "..."],
  "personalizedMessage": "...",
  "recommendations": ["...", "...", "..."]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate analyst. Analyze user preferences and match them with property features to provide personalized insights.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''

      // Try to parse JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            userIntent: parsed.userIntent || 'Property inquiry',
            matchScore: parsed.matchScore || 70,
            keyInsights: parsed.keyInsights || [],
            personalizedMessage: parsed.personalizedMessage || `Hi ${formData.name}, thank you for your interest.`,
            recommendations: parsed.recommendations || [],
          }
        }
      } catch (e) {
        console.error('Failed to parse OpenAI JSON response:', e)
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
  }

  // Fallback
  return {
    userIntent: 'Property inquiry',
    matchScore: 70,
    keyInsights: [
      `User is interested in ${formData.propertyType || 'properties'}`,
      `Budget range: ${formData.budget || 'Not specified'}`,
      `Timeline: ${formData.timeline || 'Not specified'}`,
    ],
    personalizedMessage: `Hi ${formData.name}, thank you for your interest in ${property.title || 'our property'}.`,
    recommendations: [
      'Schedule a property viewing',
      'Request detailed property brochure',
      'Connect with our property consultant',
    ],
  }
}

/**
 * Generate personalized email content
 */
async function generateEmailContent(
  formData: FormData,
  property: any,
  analysis: Awaited<ReturnType<typeof analyzeFormData>>
): Promise<{
  subject: string
  html: string
  text: string
}> {
  const propertyPrice = property.price_inr
    ? property.price_inr >= 10000000
      ? `₹${(property.price_inr / 10000000).toFixed(2)} Cr`
      : property.price_inr >= 100000
      ? `₹${(property.price_inr / 100000).toFixed(2)} L`
      : `₹${property.price_inr.toLocaleString('en-IN')}`
    : 'Price on request'

  const subject = `Personalized Information: ${property.title || 'Property'} - ${property.locality || property.city || 'Location'}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #D4AF37 0%, #0F52BA 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Property Information</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
      ${analysis.personalizedMessage}
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
      <h2 style="color: #0F52BA; margin-top: 0;">${property.title || 'Property'}</h2>
      <p style="color: #666; margin: 10px 0;"><strong>Location:</strong> ${property.locality || property.city || 'Location'}</p>
      <p style="color: #666; margin: 10px 0;"><strong>Price:</strong> ${propertyPrice}</p>
      ${property.bedrooms ? `<p style="color: #666; margin: 10px 0;"><strong>Bedrooms:</strong> ${property.bedrooms} BHK</p>` : ''}
      ${property.sqft ? `<p style="color: #666; margin: 10px 0;"><strong>Size:</strong> ${property.sqft} sq ft</p>` : ''}
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #0F52BA; margin-top: 0;">Your Preferences Analysis</h3>
      <p style="color: #666; margin-bottom: 15px;"><strong>Match Score:</strong> <span style="color: #D4AF37; font-size: 20px; font-weight: bold;">${analysis.matchScore}%</span></p>
      <p style="color: #666; margin-bottom: 10px;"><strong>User Intent:</strong> ${analysis.userIntent}</p>
      
      <h4 style="color: #333; margin-top: 20px; margin-bottom: 10px;">Key Insights:</h4>
      <ul style="color: #666; padding-left: 20px;">
        ${analysis.keyInsights.map(insight => `<li style="margin-bottom: 8px;">${insight}</li>`).join('')}
      </ul>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #0F52BA; margin-top: 0;">Recommendations</h3>
      <ul style="color: #666; padding-left: 20px;">
        ${analysis.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
      </ul>
    </div>
    
    ${property.amenities && property.amenities.length > 0 ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #0F52BA; margin-top: 0;">Property Amenities</h3>
      <p style="color: #666;">${property.amenities.join(', ')}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'}/properties/${property.id}" 
         style="background: linear-gradient(135deg, #D4AF37 0%, #0F52BA 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        View Property Details
      </a>
    </div>
    
    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
      This email was sent based on your form submission. If you have any questions, please reply to this email.
    </p>
  </div>
</body>
</html>
  `.trim()

  const text = `
${analysis.personalizedMessage}

PROPERTY INFORMATION:
${property.title || 'Property'}
Location: ${property.locality || property.city || 'Location'}
Price: ${propertyPrice}
${property.bedrooms ? `Bedrooms: ${property.bedrooms} BHK` : ''}
${property.sqft ? `Size: ${property.sqft} sq ft` : ''}

YOUR PREFERENCES ANALYSIS:
Match Score: ${analysis.matchScore}%
User Intent: ${analysis.userIntent}

Key Insights:
${analysis.keyInsights.map(insight => `- ${insight}`).join('\n')}

Recommendations:
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

${property.amenities && property.amenities.length > 0 ? `\nAmenities: ${property.amenities.join(', ')}` : ''}

View Property: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'}/properties/${property.id}
  `.trim()

  return { subject, html, text }
}

/**
 * POST /api/marketing/form-analysis
 * Analyzes form data and sends personalized email
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id, form_data } = body

    if (!property_id || !form_data) {
      return NextResponse.json(
        { success: false, error: 'Missing property_id or form_data' },
        { status: 400 }
      )
    }

    // Fetch property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    // Step 1: Analyze form data using AI
    const analysis = await analyzeFormData(form_data, property)

    // Step 2: Create or update lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', form_data.email)
      .single()

    let leadId: string

    if (existingLead) {
      // Update existing lead
      await supabase
        .from('leads')
        .update({
          name: form_data.name,
          phone: form_data.phone,
          budget: form_data.budget ? parseFloat(form_data.budget.replace(/[^\d.]/g, '')) : null,
          property_id: property_id,
          builder_id: property.builder_id,
          status: 'qualified',
          lead_score: analysis.matchScore,
        })
        .eq('id', existingLead.id)
      leadId = existingLead.id
    } else {
      // Create new lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: form_data.name,
          email: form_data.email,
          phone: form_data.phone,
          budget: form_data.budget ? parseFloat(form_data.budget.replace(/[^\d.]/g, '')) : null,
          property_id: property_id,
          builder_id: property.builder_id,
          status: 'qualified',
          lead_score: analysis.matchScore,
          source: 'marketing_form',
        })
        .select()
        .single()

      if (leadError || !newLead) {
        throw new Error('Failed to create lead')
      }
      leadId = newLead.id
    }

    // Step 3: Generate email content
    const emailContent = await generateEmailContent(form_data, property, analysis)

    // Step 4: Send email
    if (resend) {
      try {
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Tharaga <leads@tharaga.co.in>',
          to: form_data.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          tags: [
            'marketing_form',
            `property:${property_id}`,
            `lead:${leadId}`,
            `builder:${property.builder_id}`,
          ],
        })

        // Log email delivery
        await supabase.from('email_delivery_logs').insert({
          property_id: property_id,
          builder_id: property.builder_id,
          lead_id: leadId,
          recipient_email: form_data.email,
          subject: emailContent.subject,
          status: emailResult.error ? 'failed' : 'sent',
          provider_message_id: emailResult.data?.id,
          sent_at: new Date().toISOString(),
          metadata: {
            form_type: 'marketing_form',
            analysis: analysis,
          },
        })
      } catch (emailError: any) {
        console.error('Email sending error:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Step 5: Log form submission
    await supabase.from('marketing_form_submissions').insert({
      property_id: property_id,
      builder_id: property.builder_id,
      lead_id: leadId,
      form_data: form_data,
      analysis_data: analysis,
      match_score: analysis.matchScore,
      email_sent: resend ? true : false,
      created_at: new Date().toISOString(),
    }).catch(err => {
      console.error('Failed to log form submission:', err)
      // Table might not exist, continue anyway
    })

    return NextResponse.json({
      success: true,
      message: 'Form analyzed and email sent successfully',
      lead_id: leadId,
      analysis: {
        matchScore: analysis.matchScore,
        userIntent: analysis.userIntent,
      },
    })
  } catch (error: any) {
    console.error('Marketing Form Analysis Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process form analysis',
        details: error.message,
      },
      { status: 500 }
    )
  }
}











