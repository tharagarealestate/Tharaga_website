/**
 * WhatsApp Incoming Webhook Handler
 * Handles incoming WhatsApp messages and routes them to AI chatbot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropicClient } from '@/lib/ai/anthropic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    if (!from || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Extract phone number (remove whatsapp: prefix)
    const phone = from.replace('whatsapp:', '').replace('+91', '')

    const supabase = await createClient()

    // Get conversation context
    const { data: conversation } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get property context (from most recent property mentioned or default)
    const { data: recentProperty } = await supabase
      .from('whatsapp_messages')
      .select('property_id')
      .eq('phone', phone)
      .not('property_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let property = null
    if (recentProperty?.property_id) {
      const { data } = await supabase.from('properties').select('*').eq('id', recentProperty.property_id).single()
      property = data
    }

    // Generate AI response
    const chatContext = {
      property: property,
      user_message: body,
      conversation_history: (conversation || []).map((m: any) => ({
        role: m.is_bot_response ? 'assistant' : 'user',
        content: m.message_content,
      })),
    }

    const aiPrompt = property
      ? `You are a helpful real estate assistant for Tharaga. A customer is asking about this property:

${property.title}
${property.location}
₹${(property.price || property.price_inr)?.toLocaleString('en-IN')}
${property.bhk_type} | ${property.carpet_area} sq.ft

Amenities: ${(property.amenities || []).join(', ')}
RERA: ${property.rera_id || 'N/A'}

Conversation History:
${chatContext.conversation_history.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User's Question: "${body}"

Provide a helpful, concise response (max 160 chars for WhatsApp). If they want to:
- Book site visit → Provide link: ${property.landing_page_url || `https://tharaga.co.in/property/${property.id}`}
- Know price details → Share price breakdown
- Ask about amenities → List key amenities
- EMI calculation → Offer calculator link
- Talk to sales → Offer to connect with builder

Response:`
      : `You are a helpful real estate assistant for Tharaga. A customer is asking: "${body}"

Conversation History:
${chatContext.conversation_history.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Provide a helpful, concise response (max 160 chars for WhatsApp). Guide them to browse properties or ask specific questions.`

    const aiResponse = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: aiPrompt }],
    })

    const reply = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : 'I apologize, I could not process your request. Please contact our support team.'

    // Send AI response via WhatsApp (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              To: from,
              Body: reply,
            }),
          }
        )

        const twilioResult = await twilioResponse.json()

        // Log conversation
        await supabase.from('whatsapp_messages').insert([
          {
            phone,
            message_content: body,
            message_type: 'text',
            message_sid: messageSid,
            status: 'delivered',
            is_bot_response: false,
            conversation_id: phone,
          },
          {
            phone,
            message_content: reply,
            message_type: 'text',
            message_sid: twilioResult.sid,
            status: 'sent',
            is_bot_response: true,
            conversation_id: phone,
            property_id: property?.id || null,
          },
        ])

        // Return TwiML response (empty for webhook)
        return new NextResponse('', { status: 200 })
      } catch (error) {
        console.error('[WhatsApp Webhook] Error sending response:', error)
        return new NextResponse('', { status: 500 })
      }
    }

    // Log conversation even if Twilio is not configured
    await supabase.from('whatsapp_messages').insert({
      phone,
      message_content: body,
      message_type: 'text',
      message_sid: messageSid,
      status: 'received',
      is_bot_response: false,
      conversation_id: phone,
      property_id: property?.id || null,
    })

    return new NextResponse('', { status: 200 })
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

































































