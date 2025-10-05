'use client'

import React, { useState } from 'react'
import { Button, Input, TextArea } from '@/components/ui'

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
    <section className="mx-auto w-full max-w-2xl rounded-2xl p-5 shadow-card-md border border-border bg-canvas">
      <h2 className="m-0 text-lg font-bold tracking-tight text-fg">Get 3 verified matches</h2>
      <p className="m-0 mt-1 text-fgMuted text-sm">Share your WhatsApp or phone. Our team sends hand‑picked options fast.</p>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <Input placeholder="Your name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input inputMode="tel" placeholder="WhatsApp / phone" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
          <Input type="email" placeholder="Email (optional)" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        </div>
        <Input placeholder="City / Budget (optional)" value={ctx} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCtx(e.target.value)} />
        <TextArea className="min-h-[96px]" placeholder="Anything specific? Locality, BHK, timeline…" value={message} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)} />
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-fgMuted">Low effort, high signal: no spam, only verified listings.</div>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Sending…' : 'Request matches'}</Button>
        </div>
        {note ? <div className="text-sm text-fg">{note}</div> : null}
      </div>
    </section>
  )
}

