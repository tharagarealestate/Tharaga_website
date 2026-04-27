/**
 * THARAGA — Public AI Widget Chat API
 *
 * No auth required — powers the floating Tharaga AI chat widget on all pages.
 * Rate limited by IP (10 req/min) to prevent abuse.
 *
 * AI cascade: Groq Llama-3 (free/fast) → OpenAI GPT-4o-mini → Pattern fallback
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Rate limiter (in-memory, resets on cold start) ───────────────────────────

const IP_WINDOWS = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 10   // requests per window
const WINDOW_MS  = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = IP_WINDOWS.get(ip)

  if (!entry || now > entry.reset) {
    IP_WINDOWS.set(ip, { count: 1, reset: now + WINDOW_MS })
    return true // allowed
  }

  if (entry.count >= RATE_LIMIT) return false // blocked

  entry.count++
  return true // allowed
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(pathname: string): string {
  const base = `You are Tharaga AI, an intelligent and friendly AI assistant for Tharaga — India's first AI-powered zero-commission real estate platform focused on Chennai. You help home buyers find properties, understand real estate, calculate EMIs/ROI, and connect with verified builders. You also help builders manage leads and grow their business.

Key facts:
- Tharaga is based in Chennai, Tamil Nadu
- Zero-commission model — buyers save 1-2% brokerage
- AI-powered lead qualification via WhatsApp (6-question flow)
- All builders are RERA-verified
- Properties primarily in Chennai: Anna Nagar, OMR, Porur, Adyar, Velachery, T Nagar, Chromepet, Tambaram

Guidelines:
- Be concise and helpful (2-4 short paragraphs max)
- Use ₹ for Indian Rupees (lakhs/crores notation)
- Be friendly and professional
- If you don't know something specific, direct them to tharagarealestate@gmail.com
- Never hallucinate property prices or specific project details`

  if (pathname.startsWith('/builder'))
    return `${base}\n\nContext: The user is a real estate builder/developer using the Tharaga Builder Dashboard. Help them with lead management, property listings, AI automation, WhatsApp campaigns, revenue tracking, and dashboard navigation.`

  if (pathname.startsWith('/propert'))
    return `${base}\n\nContext: The user is browsing property listings. Help them find the right property, understand features, calculate budgets, and connect with builders.`

  if (pathname.startsWith('/tools'))
    return `${base}\n\nContext: The user is using Tharaga's financial tools. Help them with EMI calculations, ROI analysis, loan eligibility, and neighborhood comparisons.`

  if (pathname.startsWith('/pricing'))
    return `${base}\n\nContext: The user is evaluating Tharaga Builder plans. The Pro plan is ₹4,999/month and includes unlimited leads, AI qualification, WhatsApp automation, Meta CAPI, CRM sync, and priority support.`

  if (pathname.startsWith('/about'))
    return `${base}\n\nContext: The user wants to learn about Tharaga. Explain the mission, how the platform works, and how to get started.`

  return `${base}\n\nContext: The user is on the Tharaga homepage. Help them discover properties, understand the platform, or get started as a buyer or builder.`
}

// ─── Fallback pattern-based responses ────────────────────────────────────────

function patternFallback(messages: { role: string; content: string }[]): string {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || ''

  if (lastUserMsg.includes('emi') || lastUserMsg.includes('loan') || lastUserMsg.includes('interest')) {
    return `**EMI Calculation for Home Loans:**

Use our EMI calculator at [tharaga.co.in/tools?t=emi](/tools?t=emi).

For a quick estimate: On a ₹75L loan at 8.5% for 20 years, EMI ≈ ₹65,000/month. For ₹50L at 8.5% for 20 years ≈ ₹43,000/month.

SBI, HDFC, and ICICI typically offer 8.4-9.2% rates for salaried professionals. First-time buyers may qualify for PM Awas Yojana subsidies.

Want me to calculate EMI for a specific loan amount?`
  }

  if (lastUserMsg.includes('roi') || lastUserMsg.includes('investment') || lastUserMsg.includes('return')) {
    return `**Property ROI in Chennai (2026):**

Chennai real estate has delivered 8-12% annual appreciation in key corridors:
- **OMR / IT Corridor**: 10-14% YoY (high rental demand from IT professionals)
- **Anna Nagar / T Nagar**: 6-9% YoY (stable, premium segment)
- **Porur / Maduravoyal**: 12-15% YoY (infrastructure-driven growth)
- **Chromepet / Tambaram**: 9-12% YoY (affordability + metro connectivity)

Rental yield averages 3-4% per year in Chennai. Combined with appreciation, total returns are 11-16% annually.

Use our ROI Calculator at [tharaga.co.in/tools?t=roi](/tools?t=roi) for a detailed analysis.`
  }

  if (lastUserMsg.includes('2bhk') || lastUserMsg.includes('3bhk') || lastUserMsg.includes('flat') || lastUserMsg.includes('apartment')) {
    return `**Finding Properties in Chennai:**

Browse our verified listings at [tharaga.co.in/property-listing](/property-listing).

**Popular options:**
- 2BHK in Porur: ₹48L–₹75L (850–1200 sqft)
- 2BHK in Chromepet: ₹38L–₹60L (750–1100 sqft)
- 3BHK in Anna Nagar: ₹95L–₹1.8Cr (1400–2000 sqft)
- 3BHK on OMR: ₹72L–₹1.2Cr (1200–1800 sqft)

All listings are RERA-verified with zero brokerage. Fill the lead form and Tharaga AI will qualify your requirements and match you with the best options.`
  }

  if (lastUserMsg.includes('commission') || lastUserMsg.includes('brokerage') || lastUserMsg.includes('zero')) {
    return `**Zero Commission Model:**

Traditional brokers charge 1-2% on property purchase price (that's ₹75,000–₹1.5L on a ₹75L home). Tharaga eliminates this entirely.

**How it works:**
- Builders pay Tharaga a platform subscription (₹4,999/mo)
- Buyers pay ZERO brokerage — connect directly with builders
- All deals are transparent and RERA-verified

You save the full brokerage amount. On a ₹1Cr property, that's ₹1-2 lakhs saved directly.`
  }

  if (lastUserMsg.includes('whatsapp') || lastUserMsg.includes('contact') || lastUserMsg.includes('call')) {
    return `**Connect with Tharaga:**

📧 Email: tharagarealestate@gmail.com
🌐 Website: tharaga.co.in

**For property inquiries:** Fill our lead form and Tharaga AI will reach you on WhatsApp within minutes to understand your requirements and match you with verified builders.

**For builders:** Visit [tharaga.co.in/builder](/builder) to start your free trial.`
  }

  if (lastUserMsg.includes('builder') || lastUserMsg.includes('developer') || lastUserMsg.includes('list my') || lastUserMsg.includes('list project')) {
    return `**For Real Estate Builders & Developers:**

Tharaga's Builder Platform includes:
- 🤖 **AI Lead Qualification** — WhatsApp bot qualifies leads in 6 questions, 24/7
- 📊 **SmartScore AI** — Every lead scored 0-100 automatically
- 📱 **Meta Lead Ads Integration** — Facebook/Instagram leads sync instantly
- 🎯 **Auto Distribution** — HOT leads (Lion tier) assigned in 15 minutes
- 📈 **Full Attribution** — UTM tracking, Meta CAPI, Google Ads

**Tharaga Pro: ₹4,999/month**

Start at [tharaga.co.in/builder](/builder) or email tharagarealestate@gmail.com.`
  }

  return `**Welcome to Tharaga AI!**

I'm your intelligent assistant for Chennai real estate. I can help you:

- 🏠 **Find properties** — 2BHK/3BHK in any Chennai neighborhood
- 💰 **Calculate finances** — EMI, loan eligibility, ROI
- 🤖 **Understand the platform** — How AI qualification works
- 🏗️ **For builders** — Lead management, automation, analytics

What would you like to know? Try asking about property prices in a specific area, EMI for your budget, or how Tharaga AI works!`
}

// ─── Groq API call ────────────────────────────────────────────────────────────

async function callGroq(
  messages: { role: string; content: string }[],
  signal: AbortSignal,
): Promise<string | null> {
  const key = process.env.GROQ_API_KEY
  if (!key) return null

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.65,
        max_tokens: 450,
        stream: false,
      }),
      signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

// ─── OpenAI API call ──────────────────────────────────────────────────────────

async function callOpenAI(
  messages: { role: string; content: string }[],
  signal: AbortSignal,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 450,
        stream: false,
      }),
      signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { messages: rawMessages, pathname = '/' } = body as {
      messages?: { role: string; content: string }[]
      pathname?: string
    }

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    // Sanitize messages: keep last 12, ensure roles are valid
    const sanitized = rawMessages
      .filter(m => ['user', 'assistant', 'system'].includes(m.role) && typeof m.content === 'string')
      .slice(-12)

    // Inject system prompt if missing
    const hasSystem = sanitized.some(m => m.role === 'system')
    const aiMessages = hasSystem
      ? sanitized
      : [{ role: 'system', content: buildSystemPrompt(pathname) }, ...sanitized]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    let reply: string | null = null

    // Tier 1: Groq (free, fastest — Llama 3.3 70B)
    reply = await callGroq(aiMessages, controller.signal)

    // Tier 2: OpenAI GPT-4o-mini
    if (!reply) {
      reply = await callOpenAI(aiMessages, controller.signal)
    }

    clearTimeout(timeout)

    // Tier 3: Smart pattern fallback — always succeeds
    if (!reply) {
      reply = patternFallback(sanitized)
    }

    return NextResponse.json({
      message: { role: 'assistant', content: reply },
      model: reply ? 'ai' : 'fallback',
    })
  } catch (err: any) {
    const fallback = patternFallback([{ role: 'user', content: '' }])
    return NextResponse.json({
      message: { role: 'assistant', content: fallback },
      model: 'fallback-error',
    })
  }
}
