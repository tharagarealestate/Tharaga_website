import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput, LeadSchema, sanitizeInput } from '@/lib/security/validation'
import { leadSubmissionRateLimiter } from '@/lib/security/rate-limiter'
import { logSecurityEvent, AuditResourceTypes } from '@/lib/security/audit'
import { getClientIp } from '@/lib/security/auth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIp(req)
    const rateCheck = leadSubmissionRateLimiter.check(ip)
    if (!rateCheck.allowed) {
      await logSecurityEvent(
        req,
        'rate_limit_exceeded',
        'api',
        undefined,
        undefined,
        { endpoint: '/api/leads', ip, remaining: rateCheck.remaining }
      )
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(leadSubmissionRateLimiter.config.maxRequests),
            'X-RateLimit-Remaining': String(rateCheck.remaining),
            'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
          }
        }
      )
    }

    const body = await req.json().catch(() => ({}))
    
    // Validate input
    const validation = await validateInput(LeadSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    const { property_id, name, email, phone, message, builder_id } = validation.data

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })

    const supabase = createClient(url, key)
    const source = req.headers.get('referer') || req.headers.get('origin') || ''
    
    // Sanitize inputs before inserting
    const sanitizedName = sanitizeInput(name || '')
    const sanitizedEmail = email ? sanitizeInput(email) : null
    const sanitizedPhone = phone ? sanitizeInput(phone) : null
    const sanitizedMessage = message ? sanitizeInput(message) : null
    
    const { error, data } = await supabase.from('leads').insert([{
      property_id: property_id || null,
      builder_id: builder_id || null,
      name: sanitizedName,
      email: sanitizedEmail || undefined,
      phone: sanitizedPhone || undefined,
      message: sanitizedMessage || undefined,
      source
    }]).select('id').single()
    
    if (error) {
      await logSecurityEvent(
        req,
        'lead_create_failed',
        AuditResourceTypes.LEAD,
        undefined,
        undefined,
        { error: error.message }
      )
      return NextResponse.json({ error: error.message }, { status: 200 })
    }
    
    // Log successful lead creation
    await logSecurityEvent(
      req,
      'lead_created',
      AuditResourceTypes.LEAD,
      data?.id,
      undefined,
      { property_id, builder_id, hasEmail: !!email, hasPhone: !!phone }
    )
    
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    await logSecurityEvent(
      req,
      'lead_create_error',
      AuditResourceTypes.LEAD,
      undefined,
      undefined,
      { error: e?.message }
    )
    return NextResponse.json({ error: e?.message || 'Unexpected' }, { status: 500 })
  }
}
