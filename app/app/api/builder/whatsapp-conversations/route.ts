/**
 * GET /api/builder/whatsapp-conversations
 *
 * Returns WhatsApp conversation threads for the authenticated builder.
 * Aggregates whatsapp_messages by phone number into conversation threads,
 * showing last message, lead name, and unread count.
 *
 * Gracefully returns empty array if table doesn't exist.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser, getServiceSupabase } from '../_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authed = await getBuilderUser(request)
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceSupabase()

    // Fetch recent WhatsApp messages for this builder
    const { data: messages, error } = await serviceClient
      .from('whatsapp_messages')
      .select('id,phone,message_content,is_bot_response,created_at,property_id,builder_id')
      .eq('builder_id', authed.user.id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      // Table doesn't exist yet or permission denied — return empty gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ conversations: [], total: 0 })
      }
      // If builder_id column doesn't exist, try without filter (admin scenario)
      if (authed.isAdmin || error.message?.includes('column')) {
        const { data: allMsgs } = await serviceClient
          .from('whatsapp_messages')
          .select('id,phone,message_content,is_bot_response,created_at,property_id')
          .order('created_at', { ascending: false })
          .limit(500)

        return NextResponse.json(buildThreads(allMsgs || []))
      }
      return NextResponse.json({ conversations: [], total: 0 })
    }

    return NextResponse.json(buildThreads(messages || []))
  } catch (err: any) {
    console.error('[whatsapp-conversations] Error:', err?.message || err)
    return NextResponse.json({ conversations: [], total: 0 })
  }
}

interface Msg {
  id: string
  phone: string
  message_content: string
  is_bot_response: boolean
  created_at: string
  property_id?: string | null
}

function buildThreads(messages: Msg[]) {
  // Group by phone number
  const threads: Record<string, Msg[]> = {}
  messages.forEach(m => {
    if (!threads[m.phone]) threads[m.phone] = []
    threads[m.phone].push(m)
  })

  // Build conversation summary per phone
  const conversations = Object.entries(threads)
    .map(([phone, msgs]) => {
      // Sort by time ascending for display
      const sorted = [...msgs].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const lastMsg  = sorted[sorted.length - 1]
      const lastUser = sorted.slice().reverse().find(m => !m.is_bot_response)

      // Count unread (user messages since last bot response)
      let unread = 0
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].is_bot_response) break
        unread++
      }

      return {
        phone,
        displayName:  formatPhone(phone),
        lastMessage:  lastMsg.message_content.slice(0, 80),
        lastMessageAt: lastMsg.created_at,
        isLastBot:    lastMsg.is_bot_response,
        messageCount: msgs.length,
        unread,
        propertyId:   lastMsg.property_id || null,
        // Lead-like stage approximation based on message count
        stage: msgs.length <= 2 ? 'GREETING'
             : msgs.length <= 6 ? 'QUALIFICATION'
             : msgs.length <= 10 ? 'BUDGET_CHECK'
             : msgs.length <= 15 ? 'TIMELINE_CHECK'
             : msgs.length <= 20 ? 'OBJECTION_HANDLING'
             : 'BOOKING',
      }
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

  return { conversations, total: conversations.length }
}

function formatPhone(phone: string): string {
  // Format +91xxxxxxxxxx → +91 XXXXX XXXXX
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}
