"use client"
import { useState } from 'react'

type Props = {
  propertyId: string
  open: boolean
  onClose: () => void
}

export function LeadModal({ propertyId, open, onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState<string | null>(null)

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setOk(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, name, phone, email, message })
      })
      const j = await res.json()
      setOk(j?.ok ? 'Thanks! We will contact you shortly.' : (j?.error || 'Failed'))
      if (j?.ok) setTimeout(onClose, 900)
    } catch {
      setOk('Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white border border-plum/10 p-4 shadow-subtle" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-plum">Request details</div>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        {ok && <div className="mb-2 text-sm text-plum/80">{ok}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm">Name</label>
            <input required className="w-full rounded-lg border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">WhatsApp / Phone</label>
              <input className="w-full rounded-lg border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm">Email</label>
              <input type="email" className="w-full rounded-lg border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm">Message (optional)</label>
            <textarea className="w-full rounded-lg border px-3 py-2" rows={2} value={message} onChange={e=>setMessage(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border px-3 py-2" onClick={onClose}>Cancel</button>
            <button disabled={busy} className="rounded-lg bg-plum text-white px-4 py-2">Send</button>
          </div>
        </form>
      </div>
    </div>
  )
}
