"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AddPropertyPage() {
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', city: '', locality: '', property_type: 'Apartment',
    bedrooms: '', bathrooms: '', price_inr: '', sqft: '', images: [] as string[]
  })

  async function ensureAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) return session
    const email = prompt('Enter your email to continue:')
    if (!email) throw new Error('Email required')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
    alert('Check your email for a login link, then return to this page.')
    throw new Error('Pending login')
  }

  async function onUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files.length) return
    setBusy(true); setMsg('Uploading images…')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Login required')
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}_${file.name}`
        const { data, error } = await supabase.storage.from('property-images').upload(path, file)
        if (error) throw error
        const { data: pub } = supabase.storage.from('property-images').getPublicUrl(data.path)
        urls.push(pub.publicUrl)
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }))
      setMsg('Images uploaded ✔')
    } catch (e: any) {
      setMsg(e?.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg('Saving…')
    try {
      const session = await ensureAuth()
      const builder_id = session.user.id
      const payload = {
        title: form.title.trim(), description: form.description.trim(),
        city: form.city.trim(), locality: form.locality.trim() || null,
        property_type: form.property_type, bedrooms: Number(form.bedrooms)||null,
        bathrooms: Number(form.bathrooms)||null, price_inr: Number(form.price_inr)||0, sqft: Number(form.sqft)||null,
        images: form.images, builder_id, listing_status: 'active'
      }
      const { error } = await supabase.from('properties').insert([payload])
      if (error) throw error
      setMsg('Submitted! Pending verification.')
      setStep(3)
    } catch (e: any) {
      setMsg(e?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-deepBlue mb-2">List your property</h1>
      <p className="text-deepBlue/70 mb-6">Simple onboarding for builders. Logged in users can save drafts and submit for verification.</p>

      {msg && <div className="mb-4 rounded-lg border border-deepBlue/10 bg-white p-3 text-sm text-deepBlue/80">{msg}</div>}

      {step === 1 && (
        <form onSubmit={(e)=>{ e.preventDefault(); setStep(2) }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input required className="w-full rounded-lg border px-3 py-2" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea required className="w-full rounded-lg border px-3 py-2" rows={4} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input required className="w-full rounded-lg border px-3 py-2" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Locality</label>
              <input className="w-full rounded-lg border px-3 py-2" value={form.locality} onChange={e=>setForm({...form, locality:e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select className="w-full rounded-lg border px-3 py-2" value={form.property_type} onChange={e=>setForm({...form, property_type:e.target.value})}>
                <option>Apartment</option>
                <option>Villa</option>
                <option>Plot</option>
                <option>Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Bedrooms</label>
              <input className="w-full rounded-lg border px-3 py-2" value={form.bedrooms} onChange={e=>setForm({...form, bedrooms:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Bathrooms</label>
              <input className="w-full rounded-lg border px-3 py-2" value={form.bathrooms} onChange={e=>setForm({...form, bathrooms:e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Price (₹)</label>
              <input required className="w-full rounded-lg border px-3 py-2" value={form.price_inr} onChange={e=>setForm({...form, price_inr:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Area (sqft)</label>
              <input className="w-full rounded-lg border px-3 py-2" value={form.sqft} onChange={e=>setForm({...form, sqft:e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="rounded-lg bg-deepBlue text-white px-4 py-2">Next</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Upload images</label>
            <input type="file" accept="image/*" multiple onChange={onUploadImages} />
            {form.images.length>0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {form.images.map((u,i)=> (
                  <img key={i} src={u} alt="" className="h-24 w-full object-cover rounded" />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button type="button" className="rounded-lg border px-4 py-2" onClick={()=>setStep(1)}>Back</button>
            <button disabled={busy} className="rounded-lg bg-gold text-deepBlue px-4 py-2 border border-transparent hover:brightness-105">Submit</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="rounded-lg border border-deepBlue/10 bg-white p-4">
          <div className="font-semibold text-deepBlue">Thanks! Your property is submitted.</div>
          <div className="text-deepBlue/70 text-sm">We’ll verify details and make it visible to buyers shortly.</div>
        </div>
      )}
    </main>
  )
}

