'use client'

import React, { useState } from 'react'

export function HomeCta() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [ctx, setCtx] = useState('')
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setNote('')
    if (!phone && !email) {
      setNote('Provide WhatsApp/phone or email.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        property_id: null,
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
        message: [ctx, message].filter(Boolean).join(' • '),
      }
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data && data.ok) {
        setNote('Thanks! We will WhatsApp you verified matches soon.')
        setName(''); setPhone(''); setEmail(''); setCtx(''); setMessage('')
      } else {
        setNote('Could not submit right now. Please try again.')
      }
    } catch (_) {
      setNote('Network issue. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  React.useEffect(()=>{
    // Offer install banner and push subscribe
    let deferred: any = null
    function onBeforeInstall(e: any){ e.preventDefault(); deferred = e }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    // Attempt push registration (no-op if unsupported)
    ;(async function(){
      try{
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: undefined })
        await fetch('/api/push/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.toJSON().keys }) })
      } catch(_){ }
    })()
    return ()=> window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  },[])

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl text-white p-5 shadow-xl border border-white/10"
      style={{
        background: 'radial-gradient(1200px 200px at 20% -50%, rgba(110,13,37,0.45), transparent), linear-gradient(180deg, #151316, #0f0d0e)'
      }}>
      <h2 className="m-0 text-lg font-bold tracking-tight">Get 3 verified matches</h2>
      <p className="m-0 mt-1 text-white/90 text-sm">Share your WhatsApp or phone. Our team sends hand‑picked options fast.</p>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <input className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 outline-none placeholder:text-white/60" placeholder="Your name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 outline-none placeholder:text-white/60" inputMode="tel" placeholder="WhatsApp / phone" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
          <input className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 outline-none placeholder:text-white/60" type="email" placeholder="Email (optional)" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        </div>
        <input className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 outline-none placeholder:text-white/60" placeholder="City / Budget (optional)" value={ctx} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCtx(e.target.value)} />
        <textarea className="min-h-[96px] rounded-xl border border-white/15 bg-white/10 px-3 py-2 outline-none placeholder:text-white/60" placeholder="Anything specific? Locality, BHK, timeline…" value={message} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)} />
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-white/70">Low effort, high signal: no spam, only verified listings.</div>
          <button className="rounded-xl bg-burgundy hover:bg-burgundyHover text-white font-semibold px-4 py-2 disabled:opacity-60" onClick={submit} disabled={submitting}>{submitting ? 'Sending…' : 'Request matches'}</button>
        </div>
        {note ? <div className="text-sm text-white/90">{note}</div> : null}
      </div>
    </section>
  )
}

