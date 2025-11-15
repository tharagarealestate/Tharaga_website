"use client"
import React from 'react'

export function ContactForm({ propertyId, brochureUrl }: { propertyId: string; brochureUrl?: string }){
  async function onSubmit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      property_id: propertyId,
      name: String(fd.get('name')||''),
      phone: String(fd.get('phone')||''),
      email: String(fd.get('email')||''),
      message: 'Property detail form'
    }
    try {
      const res = await fetch('/api/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const j = await res.json()
      ;(window as any).thgTrack && (window as any).thgTrack('lead_submit', { ok: !!j?.ok, property_id: propertyId })
      alert(j?.ok ? 'Thanks! We will contact you shortly.' : (j?.error || 'Failed'))
    } catch {
      alert('Failed')
    }
  }
  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      <input type="hidden" name="property_id" defaultValue={propertyId} />
      <div>
        <input className="w-full border rounded px-3 py-2" name="name" placeholder="Name" />
      </div>
      <div>
        <input className="w-full border rounded px-3 py-2" type="tel" name="phone" placeholder="Phone" required />
      </div>
      <div>
        <input className="w-full border rounded px-3 py-2" type="email" name="email" placeholder="Email" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" className="rounded bg-yellow-600 text-white px-3 py-2" data-track-id="schedule_visit">Schedule Site Visit</button>
        <button type="submit" className="rounded bg-primary-600 text-white px-3 py-2" data-track-id="instant_callback">Get Instant Callback</button>
      </div>
      {brochureUrl ? (
        <a href={brochureUrl} target="_blank" rel="noreferrer" className="block w-full text-center rounded border px-3 py-2" data-track-id="download_brochure">Download Brochure</a>
      ) : (
        <button type="button" className="w-full rounded border px-3 py-2" disabled>Download Brochure</button>
      )}
    </form>
  )
}
