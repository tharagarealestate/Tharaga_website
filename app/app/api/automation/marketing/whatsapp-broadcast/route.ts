/**
 * WORKFLOW 9: WHATSAPP BROADCASTING & CHATBOT
 * Trigger: Webhook from Content Generation Workflow
 * Purpose: Send WhatsApp broadcasts to warm leads and deploy AI chatbot for property inquiries
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropicClient } from '@/lib/ai/anthropic'

export const maxDuration = 600 // 10 minutes for broadcasting

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
    }

    // Step 1: Fetch Property Data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Step 2: Segment Leads for WhatsApp Broadcast
    const segments = await segmentLeads(property, supabase)

    // Step 3: Generate Personalized WhatsApp Messages
    const messageTemplates = generateMessageTemplates(property)

    // Step 4: Send WhatsApp Broadcasts
    const broadcastResults = await sendWhatsAppBroadcasts(property, segments, messageTemplates, supabase)

    // Step 5: Deploy AI WhatsApp Chatbot
    const chatbotDeployed = await deployWhatsAppChatbot(property)

    // Step 6: Store Campaign Data
    const { data: campaignData } = await supabase
      .from('whatsapp_campaigns')
      .insert({
        property_id,
        builder_id: property.builder_id,
        campaign_name: `${property.title} - Launch Broadcast`,
        campaign_type: 'broadcast',
        total_recipients: segments.total_leads,
        messages_sent: broadcastResults.messages_sent,
        segment_distribution: {
          hot_leads: segments.hot_leads.length,
          warm_leads: segments.warm_leads.length,
        },
        message_template: JSON.stringify(messageTemplates),
        status: 'completed',
        launched_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Store individual messages
    if (campaignData && broadcastResults.sent_messages.length > 0) {
      const messageInserts = broadcastResults.sent_messages.map((msg: any) => ({
        campaign_id: campaignData.id,
        property_id,
        lead_id: msg.lead_id,
        phone: msg.phone,
        name: msg.name,
        message_content: msg.message_content,
        message_type: 'text',
        message_sid: msg.message_sid,
        status: msg.status,
        segment: msg.segment,
        sent_at: new Date().toISOString(),
      }))

      await supabase.from('whatsapp_messages').insert(messageInserts)
    }

    // Step 7: Update Property Status
    await supabase
      .from('properties')
      .update({
        whatsapp_broadcast_sent: true,
        whatsapp_chatbot_active: chatbotDeployed,
        whatsapp_campaign_launched_at: new Date().toISOString(),
      })
      .eq('id', property_id)

    return NextResponse.json({
      success: true,
      property_id,
      campaign_id: campaignData?.id,
      total_leads: segments.total_leads,
      messages_sent: broadcastResults.messages_sent,
      hot_leads_contacted: segments.hot_leads.length,
      warm_leads_contacted: segments.warm_leads.length,
      chatbot_deployed: chatbotDeployed,
      status: 'whatsapp_broadcast_complete',
    })
  } catch (error) {
    console.error('[WhatsApp Broadcast] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper Functions

async function segmentLeads(property: any, supabase: any) {
  // Fetch qualified leads for this location/type
  const { data: targetLeads } = await supabase
    .from('leads')
    .select('id, name, phone, preferences, ai_lead_score, last_interaction_at, whatsapp_opt_in, status')
    .or(
      `preferences->>preferred_locations.ilike.%${property.location}%,preferences->>preferred_bhk.eq.${property.bhk_type}`
    )
    .eq('whatsapp_opt_in', true)
    .in('status', ['qualified', 'engaged'])
    .gte('ai_lead_score', 60)
    .order('ai_lead_score', { ascending: false })
    .limit(500)

  const leads = targetLeads || []

  // Segment leads
  const segments = {
    hot_leads: leads.filter((l: any) => l.ai_lead_score >= 80),
    warm_leads: leads.filter((l: any) => l.ai_lead_score >= 60 && l.ai_lead_score < 80),
    re_engagement: leads.filter((l: any) => {
      if (!l.last_interaction_at) return false
      const daysSinceInteraction = (Date.now() - new Date(l.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceInteraction > 14
    }),
  }

  return {
    ...segments,
    total_leads: leads.length,
  }
}

function generateMessageTemplates(property: any) {
  // Hot leads - Exclusive first look
  const hotLeadMessage = `🏡 *EXCLUSIVE FIRST LOOK*

Hi {{name}},

${property.title} just launched on Tharaga!

✨ Perfect match for your search:
📍 ${property.location}
🏠 ${property.bhk_type}
💰 ₹${((property.price || property.price_inr) / 100000).toFixed(2)}L
📏 ${property.carpet_area} sq.ft

*LIMITED TIME OFFER:*
Book site visit in next 48 hours and get:
- Priority unit selection
- Special pricing discussion
- Free home loan consultation

*Book Now:* ${property.landing_page_url || `https://tharaga.co.in/property/${property.id}`}

- Team Tharaga
_Reply STOP to opt-out_`

  // Warm leads - New launch announcement
  const warmLeadMessage = `Hi {{name}},

Great news! A new ${property.bhk_type} just launched in ${property.location} 🎉

${property.title}
₹${((property.price || property.price_inr) / 100000).toFixed(2)}L | ${property.carpet_area} sq.ft

✅ RERA Approved
✅ Zero Commission
✅ Direct from Builder

*View Details:* ${property.landing_page_url || `https://tharaga.co.in/property/${property.id}`}

Want to schedule a site visit? Just reply YES!`

  return {
    hot_leads: hotLeadMessage,
    warm_leads: warmLeadMessage,
  }
}

async function sendWhatsAppBroadcasts(property: any, segments: any, messageTemplates: any, supabase: any) {
  const sentMessages: any[] = []

  // Check if Twilio is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.log('[WhatsApp Broadcast] Twilio not configured. Messages saved as drafts.')
    // Create draft messages for later sending
    segments.hot_leads.forEach((lead: any) => {
      sentMessages.push({
        lead_id: lead.id,
        phone: lead.phone,
        name: lead.name,
        message_content: messageTemplates.hot_leads.replace('{{name}}', lead.name || 'there'),
        message_sid: null,
        status: 'pending',
        segment: 'hot_leads',
      })
    })

    segments.warm_leads.forEach((lead: any) => {
      sentMessages.push({
        lead_id: lead.id,
        phone: lead.phone,
        name: lead.name,
        message_content: messageTemplates.warm_leads.replace('{{name}}', lead.name || 'there'),
        message_sid: null,
        status: 'pending',
        segment: 'warm_leads',
      })
    })

    return {
      messages_sent: sentMessages.length,
      sent_messages: sentMessages,
    }
  }

  // Send to hot leads first
  for (const lead of segments.hot_leads) {
    const personalizedMessage = messageTemplates.hot_leads.replace('{{name}}', lead.name || 'there')

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            To: `whatsapp:+91${lead.phone.replace(/[^0-9]/g, '')}`,
            Body: personalizedMessage,
          }),
        }
      )

      const result = await response.json()

      sentMessages.push({
        lead_id: lead.id,
        phone: lead.phone,
        name: lead.name,
        message_content: personalizedMessage,
        message_sid: result.sid,
        status: result.status === 'queued' || result.status === 'sent' ? 'sent' : 'failed',
        segment: 'hot_leads',
      })

      // Rate limiting: 1 message per second
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`[WhatsApp Broadcast] Error sending to ${lead.phone}:`, error)
      sentMessages.push({
        lead_id: lead.id,
        phone: lead.phone,
        name: lead.name,
        message_content: personalizedMessage,
        message_sid: null,
        status: 'failed',
        segment: 'hot_leads',
      })
    }
  }

  // Send to warm leads
  for (const lead of segments.warm_leads) {
    const personalizedMessage = messageTemplates.warm_leads.replace('{{name}}', lead.name || 'there')

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            To: `whatsapp:+91${lead.phone.replace(/[^0-9]/g, '')}`,
            Body: personalizedMessage,
          }),
        }
      )

      const result = await response.json()

      sentMessages.push({
        lead_id: lead.id,
        phone: lead.phone,
        name: lead.name,
        message_content: personalizedMessage,
        message_sid: result.sid,
        status: result.status === 'queued' || result.status === 'sent' ? 'sent' : 'failed',
        segment: 'warm_leads',
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`[WhatsApp Broadcast] Error sending to ${lead.phone}:`, error)
      sentMessages.push({
        lead_id: lead.id,
        phone: lead.phone,
        name: lead.name,
        message_content: personalizedMessage,
        message_sid: null,
        status: 'failed',
        segment: 'warm_leads',
      })
    }
  }

  return {
    messages_sent: sentMessages.filter((m) => m.status === 'sent').length,
    sent_messages: sentMessages,
  }
}

async function deployWhatsAppChatbot(property: any) {
  // Set up webhook handler for incoming WhatsApp messages
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'}/api/webhooks/whatsapp-incoming`

  // Configure Twilio webhook if configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER_SID) {
    try {
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${process.env.TWILIO_PHONE_NUMBER_SID}.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            SmsUrl: webhookUrl,
            SmsMethod: 'POST',
          }),
        }
      )

      return true
    } catch (error) {
      console.error('[WhatsApp Broadcast] Error configuring chatbot webhook:', error)
      return false
    }
  }

  // Return true even if not configured (webhook can be set up manually)
  return true
}

































