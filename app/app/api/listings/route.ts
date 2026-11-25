import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LISTING_BUCKET, STAGES, makeReference, serviceClient, userFromRequest } from '@/lib/server/listings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  land: 'Land / plots',
  solar_quarry: 'Solar site / quarry',
  commercial: 'Commercial building',
  industrial: 'Industrial / warehouse',
  residential: 'Home / villa / flat',
  other: 'Other',
}

const clean = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max)
const esc = (v: unknown) => String(v ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string))

/** Short, factual desk summary. Optional: skipped quietly if no key or slow. */
async function summarise(input: { category: string; location: string; extent: string; description: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (!apiKey || !input.description) return null
  try {
    const anthropic = new Anthropic({ apiKey })
    const res = await anthropic.messages.create(
      {
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `An owner in Tamil Nadu is listing a property with a real estate desk. Using ONLY the facts below (do not invent numbers or claims), return JSON: {"title": "<= 60 chars, property type + place", "summary": "2 plain sentences", "highlights": ["up to 4 short facts from the text"], "missing": ["up to 3 facts a buyer will ask for that are not given"]}.

Category: ${input.category}
Location: ${input.location}
Extent: ${input.extent || 'not given'}
Owner's description: ${input.description}`,
          },
        ],
      },
      { timeout: 9000 },
    )
    const text = res.content.find(b => b.type === 'text')
    const raw = text && 'text' in text ? text.text : ''
    const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
    return json ? JSON.parse(json) : null
  } catch (e: any) {
    console.warn('listing summary skipped:', e?.message)
    return null
  }
}

async function alertDesk(listing: Record<string, any>, mediaLinks: string[]) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.LISTINGS_FROM_EMAIL || 'Tharaga Listings <listings@tharaga.in>',
        to: [process.env.LISTINGS_ALERT_EMAIL || 'tharagarealestate@gmail.com'],
        reply_to: listing.seller_email || undefined,
        subject: `New listing ${listing.reference} · ${CATEGORY_LABELS[listing.category] || listing.category} · ${listing.location}`,
        html: `<div style="font-family:Arial,sans-serif;color:#15213A">
<h2 style="margin:0 0 8px">${esc(listing.ai_summary?.title || 'New owner listing')}</h2>
<p><b>Reference:</b> ${listing.reference}<br/><b>Type:</b> ${esc(CATEGORY_LABELS[listing.category] || listing.category)}<br/><b>Location:</b> ${esc(listing.location)}<br/><b>Extent:</b> ${esc(listing.extent || '—')}<br/><b>Asking:</b> ${esc(listing.asking_price || '—')}<br/><b>Rental income:</b> ${esc(listing.rental_income || '—')}</p>
<p><b>Owner:</b> ${esc(listing.seller_name)} · <a href="tel:${esc(listing.seller_phone)}">${esc(listing.seller_phone)}</a> · ${esc(listing.seller_email || '')}</p>
<p style="white-space:pre-wrap">${esc(listing.description || '')}</p>
${mediaLinks.length ? `<p><b>Media (links valid 7 days):</b><br/>${mediaLinks.map((u, i) => `<a href="${u}">File ${i + 1}</a>`).join(' · ')}</p>` : '<p>No media attached.</p>'}
</div>`,
      }),
      signal: AbortSignal.timeout(6000),
    })
  } catch (e: any) {
    console.warn('desk alert skipped:', e?.message)
  }
}

/** Submit a listing. */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user = await userFromRequest(req)

    const listing = {
      seller_name: clean(body.seller_name, 120),
      seller_phone: clean(body.seller_phone, 20),
      seller_email: clean(body.seller_email, 160) || user?.email || null,
      category: clean(body.category, 40),
      location: clean(body.location, 200),
      extent: clean(body.extent, 120) || null,
      description: clean(body.description, 4000) || null,
      asking_price: clean(body.asking_price, 80) || null,
      rental_income: clean(body.rental_income, 80) || null,
    }
    const phoneDigits = listing.seller_phone.replace(/\D/g, '')
    if (!listing.seller_name || phoneDigits.length < 10)
      return NextResponse.json({ error: 'Please add your name and a 10-digit phone number.' }, { status: 400 })
    if (!CATEGORY_LABELS[listing.category]) return NextResponse.json({ error: 'Please choose the property type.' }, { status: 400 })
    if (!listing.location) return NextResponse.json({ error: 'Please add where the property is.' }, { status: 400 })

    const media = (Array.isArray(body.media) ? body.media : [])
      .slice(0, 15)
      .filter((m: any) => typeof m?.path === 'string' && /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\/[\w.-]+$/.test(m.path))
      .map((m: any) => ({ path: m.path, name: clean(m.name, 120), type: clean(m.type, 60), size: Number(m.size) || 0 }))

    if (!listing.description && !media.length)
      return NextResponse.json({ error: 'Please describe the property or add a photo.' }, { status: 400 })

    const ai_summary = await summarise({
      category: CATEGORY_LABELS[listing.category],
      location: listing.location,
      extent: listing.extent || '',
      description: listing.description || '',
    })

    const now = new Date().toISOString()
    const db = serviceClient()
    let inserted: any = null
    for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
      const { data, error } = await db
        .from('owner_listings')
        .insert({
          ...listing,
          reference: makeReference(),
          user_id: user?.id ?? null,
          media,
          ai_summary,
          status: 'received',
          history: [{ status: 'received', at: now, note: 'Submitted on tharaga.in' }],
        })
        .select('id, reference, created_at')
        .single()
      if (!error) inserted = data
      else if (!/duplicate key/i.test(error.message)) throw new Error(error.message)
    }
    if (!inserted) throw new Error('Could not create a reference')

    let links: string[] = []
    if (media.length) {
      const { data } = await db.storage.from(LISTING_BUCKET).createSignedUrls(media.map((m: any) => m.path), 60 * 60 * 24 * 7)
      links = (data || []).map(d => d.signedUrl).filter(Boolean) as string[]
    }
    await alertDesk({ ...listing, reference: inserted.reference, ai_summary }, links)

    return NextResponse.json({ ok: true, id: inserted.id, reference: inserted.reference, title: ai_summary?.title || null })
  } catch (e: any) {
    console.error('listing submit error', e?.message)
    return NextResponse.json(
      { error: 'We could not save your listing just now. Send it to the desk on WhatsApp — nothing you typed is lost.' },
      { status: 500 },
    )
  }
}

/** The signed-in owner's own listings (for the status tracker). */
export async function GET(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Sign in to see your listings.' }, { status: 401 })
  try {
    const { data, error } = await serviceClient()
      .from('owner_listings')
      .select('id, reference, created_at, category, location, extent, description, media, ai_summary, status, status_note, history')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    const listings = (data || []).map(l => {
      const idx = Math.max(0, STAGES.findIndex(s => s.key === l.status))
      return {
        id: l.id,
        reference: l.reference,
        title: l.ai_summary?.title || `${CATEGORY_LABELS[l.category] || 'Property'} · ${l.location}`,
        category: CATEGORY_LABELS[l.category] || l.category,
        location: l.location,
        extent: l.extent,
        media_count: Array.isArray(l.media) ? l.media.length : 0,
        status: l.status,
        status_note: l.status_note,
        created_at: l.created_at,
        stages: STAGES.filter(s => s.key !== 'closed' || l.status === 'closed').map((s, i) => ({
          key: s.key,
          label: s.label,
          state: i < idx ? 'done' : i === idx ? 'current' : 'next',
          at: (l.history || []).find((h: any) => h.status === s.key)?.at || null,
        })),
      }
    })
    return NextResponse.json({ listings })
  } catch (e: any) {
    console.error('listing list error', e?.message)
    return NextResponse.json({ error: 'Could not load your listings.' }, { status: 500 })
  }
}
