import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // 3. Trigger 8-second SLA initial WhatsApp Greeting via AiSensy (USP 1)
    if (process.env.AISENSY_API_KEY && process.env.AISENSY_API_URL) {
      const greeting = `Hi ${name.split(' ')[0]}, thanks for your interest via ${source}! I'm Tharaga AI. To help you find the right property, which type interests you most — 2BHK, 3BHK, or a Villa? 🏡`
      
      try {
        const aisensyPhone = normalizedPhone.startsWith('+') ? normalizedPhone.replace('+', '') : ('91' + normalizedPhone).replace(/^9191/, '91')
        
        await fetch(`${process.env.AISENSY_API_URL}/messages/sendText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: process.env.AISENSY_API_KEY,
            to: aisensyPhone,
            text: greeting
          })
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
      } catch (aiSensyError) {
        console.error('[Incoming Lead] AiSensy Error:', aiSensyError)
        // Non-fatal, lead is still captured
      }
    }

    return NextResponse.json({ success: true, lead_id: lead.id })

  } catch (error) {
    console.error('[Incoming Lead] Processing Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
