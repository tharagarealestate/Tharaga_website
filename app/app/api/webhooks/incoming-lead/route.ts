import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    // This is a server-side webhook (called by Apps Script, Meta, etc.) — no user session.
    // Service role client bypasses RLS so inserts/selects work regardless of auth state.
    const supabase = getAdminClient()

    // 1. Standardize incoming payload from various sources (Meta, 99Acres, Web, Apps Script)
    const {
      name,
      email,
      phone,
      source = 'Website Form',
      property_id,
      builder_id,
      
      // Email parsing specifics (Google Apps Script properties)
      property,
      subject,
      sender,
      messageId,
      threadId,
      receivedAt,
      rawText
    } = payload

    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone number or Email is required' }, { status: 400 })
    }

    // 1.5. Clean phone and create BigInt version for DB compatibility
    const phoneString = phone ? String(phone).replace(/\D/g, '') : null;
    const numericPhone = phoneString ? BigInt(phoneString).toString() : null; // Safe Postgres representation
    
    // Check for message deduplication instantly using phone_number (bigint) OR external_message_id
    if (messageId || numericPhone) {
      let query = supabase.from('leads').select('id')
      if (messageId) {
        query = query.eq('external_message_id', String(messageId))
      } else if (numericPhone) {
        query = query.eq('phone_number', numericPhone) // Matches backend bigint column format
      }
      
      const { data: existingLead } = await query.maybeSingle()

      if (existingLead) {
        console.log(`[Incoming Lead] Skipping duplicate check matched lead_id: ${existingLead.id}`)
        return NextResponse.json({ success: true, lead_id: existingLead.id, status: 'duplicate_skipped' })
      }
    }

    const normalizedPhone = phone ? String(phone).replace(/[^\d+]/g, '') : null

    // 2. Insert into leads table
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: name || 'Unknown',
        email,
        phone_number: numericPhone ? Number(numericPhone) : null, // Mapped accurately for DB
        phone: normalizedPhone,
        phone_normalized: normalizedPhone,
        source,
        property_id,
        builder_id,
        external_message_id: messageId ? String(messageId) : null,
        property_inquiry: property || null,
        email_metadata: {
          subject,
          sender,
          threadId,
          receivedAt,
          rawText: rawText ? rawText.substring(0, 500) : null // cap length to prevent bloat
        },
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
    if (process.env.AISENSY_API_KEY && process.env.AISENSY_API_URL && normalizedPhone) {
      const greeting = `Hi ${name.split(' ')[0]}, thanks for your interest via ${source}! I'm Tharaga AI. To help you find the right property, which type interests you most — 2BHK, 3BHK, or a Villa? 🏡`
      
      try {
        const aisensyPhone = normalizedPhone.startsWith('+') ? normalizedPhone.replace('+', '') : ('91' + normalizedPhone).replace(/^9191/, '91')
        
        // We MUST use the campaigns API for the first text because of WhatsApp's 24-hour Meta rules.
        // It's impossible to send raw text if the user hasn't explicitly messaged us in the last 24h.
        const campaignName = process.env.AISENSY_GREETING_CAMPAIGN || 'property_greeting'
        
        await fetch(`${process.env.AISENSY_API_URL}/campaigns/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: process.env.AISENSY_API_KEY,
            campaignName: campaignName,
            destination: aisensyPhone,
            userName: name.split(' ')[0] || 'Sir/Madam',
            templateParams: [name.split(' ')[0] || 'Sir/Madam', source],
            source: 'new-lead-webhook'
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
