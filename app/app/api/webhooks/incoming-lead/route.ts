import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const supabase = await createClient()

    // 1. Standardize incoming payload from various sources (Meta, 99Acres, Web)
    const {
      name,
      email,
      phone,
      source = 'Website Form',
      property_id,
      builder_id
    } = payload

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const normalizedPhone = phone.replace(/[^\d+]/g, '')

    // 2. Insert into leads table
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: name || 'Unknown',
        email,
        phone: normalizedPhone,
        phone_normalized: normalizedPhone,
        source,
        property_id,
        builder_id,
        status: 'new',
        smartscore: 10, // Initial base score
        ai_stage: 'GREETING',
        sla_deadline: new Date(Date.now() + 15 * 60000).toISOString(), // 15 min SLA initially
      })
      .select()
      .single()

    if (error) {
      console.error('[Incoming Lead] DB Insert Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Trigger 8-second SLA initial WhatsApp Greeting (USP 1)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      
      const greeting = `Hi ${name.split(' ')[0]}, thanks for your interest via ${source}! I'm Tharaga AI. To help you find the right property, which type interests you most — 2BHK, 3BHK, or a Villa? 🏡`
      
      try {
        await twilioClient.messages.create({
          body: greeting,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${normalizedPhone.startsWith('+') ? normalizedPhone : '+91' + normalizedPhone}`
        })

        // Log the outgoing bot message
        await supabase.from('whatsapp_messages').insert({
          phone: normalizedPhone,
          message_content: greeting,
          message_type: 'text',
          status: 'sent',
          is_bot_response: true,
          conversation_id: normalizedPhone,
          property_id: property_id || null,
        })
      } catch (twError) {
        console.error('[Incoming Lead] Twilio Error:', twError)
        // Non-fatal, lead is still captured
      }
    }

    return NextResponse.json({ success: true, lead_id: lead.id })

  } catch (error) {
    console.error('[Incoming Lead] Processing Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
