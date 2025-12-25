"use client"
import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Button, Input, Select, TextArea, Card, Badge } from '@/components/ui'
// TODO: Re-enable when ComprehensivePropertyData component is created
// import ComprehensivePropertyData from '@/components/property/ComprehensivePropertyData'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('Supabase environment variables are not configured')
    }
    supabaseClient = createClient(url, anonKey)
  }
  return supabaseClient
}

export default function AddPropertyPage() {
  const searchParams = useSearchParams()
  const propertyId = searchParams?.get('id')
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [tier, setTier] = useState<'starter'|'growth'|'scale'>('starter')
  const [limit, setLimit] = useState<number>(1)
  const [showComprehensiveData, setShowComprehensiveData] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', city: 'Chennai', locality: '', property_type: 'Apartment',
    bedrooms: '', bathrooms: '', price_inr: '', sqft: '', images: [] as string[]
  })

  useEffect(() => {
    if (propertyId) {
      // Load existing property data for editing
      loadPropertyData(propertyId)
    }
  }, [propertyId])

  async function loadPropertyData(id: string) {
    try {
      const { data, error } = await getSupabase()
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      if (data) {
        setForm({
          title: data.title || '',
          description: data.description || '',
          city: data.city || '',
          locality: data.locality || '',
          property_type: data.property_type || 'Apartment',
          bedrooms: String(data.bedrooms || ''),
          bathrooms: String(data.bathrooms || ''),
          price_inr: String(data.price_inr || ''),
          sqft: String(data.sqft || ''),
          images: (data.images as string[]) || []
        })
        setStep(2)
      }
    } catch (e: any) {
      setMsg(e?.message || 'Failed to load property')
    }
  }

  async function ensureAuth() {
    const { data: { session } } = await getSupabase().auth.getSession()
    if (session) return session
    const email = prompt('Enter your email to continue:')
    if (!email) throw new Error('Email required')
    const { error } = await getSupabase().auth.signInWithOtp({ email })
    if (error) throw error
    alert('Check your email for a login link, then return to this page.')
    throw new Error('Pending login')
  }

  // Load entitlement to gate project count (simple example: Starter=1, Growth=5, Scale=Infinity)
  async function loadEntitlement(){
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      if (!session?.user?.email) return
      const { data } = await getSupabase().from('org_subscriptions').select('tier,status').eq('email', session.user.email).maybeSingle()
      const t = (data?.tier as any) || 'starter'
      setTier(t)
      setLimit(t === 'scale' ? Number.POSITIVE_INFINITY : (t === 'growth' ? 5 : 1))
    } catch(_) { /* ignore */ }
  }
  loadEntitlement()

  async function onUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files.length) return
    setBusy(true); setMsg('Uploading images…')
    try {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) throw new Error('Login required')
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}_${file.name}`
        const { data, error } = await getSupabase().storage.from('property-images').upload(path, file)
        if (error) throw error
        const { data: pub } = getSupabase().storage.from('property-images').getPublicUrl(data.path)
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
      
      // Check quota using new property-based pricing system
      if (!propertyId) {
        // Only check quota when creating new property, not when updating
        try {
          const quotaResponse = await fetch('/api/pricing/check-quota')
          const quotaData = await quotaResponse.json()
          
          if (quotaData.success && !quotaData.quota.allowed) {
            setMsg(`${quotaData.quota.message} Please upgrade your plan at /builder/billing`)
            setBusy(false)
            return
          }
        } catch (quotaError) {
          console.error('Quota check failed:', quotaError)
          // Continue with creation if quota check fails (graceful degradation)
        }
      }
      
      const payload = {
        title: form.title.trim(), description: form.description.trim(),
        city: form.city.trim(), locality: form.locality.trim() || null,
        property_type: form.property_type, bedrooms: Number(form.bedrooms)||null,
        bathrooms: Number(form.bathrooms)||null, price_inr: Number(form.price_inr)||0, sqft: Number(form.sqft)||null,
        images: form.images, builder_id, listing_status: 'active'
      }
      if (propertyId) {
        // Update existing property
        const { error } = await getSupabase()
          .from('properties')
          .update(payload)
          .eq('id', propertyId)
        if (error) throw error
        setMsg('Property updated successfully!')
      } else {
        // Insert new property
        const { data, error } = await getSupabase().from('properties').insert([payload]).select().single()
        if (error) throw error
        // Update propertyId for comprehensive data
        if (data?.id) {
          window.history.replaceState({}, '', `?id=${data.id}`)
        }
        setMsg('Submitted! Pending verification.')
        setStep(3)
      }
    } catch (e: any) {
      setMsg(e?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-fg mb-2">List your property</h1>
      <p className="text-fgMuted mb-2">Simple onboarding for builders. Logged in users can save drafts and submit for verification.</p>
      <div className="mb-6 text-sm text-fgMuted">Your plan: <b className="text-fg">{tier}</b>. Active project limit: {Number.isFinite(limit) ? limit : 'Unlimited'} • <a className="underline" href="/pricing/">See pricing</a></div>

      {msg && <Card className="mb-4 text-sm"><div>{msg}</div></Card>}

      {step === 1 && (
        <form onSubmit={(e)=>{ e.preventDefault(); setStep(2) }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <Input required value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <TextArea required rows={4} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">City</label>
              <Input required value={form.city} onChange={e=>setForm({...form, city:e.target.value})} placeholder="Chennai" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Locality</label>
              <Input value={form.locality} onChange={e=>setForm({...form, locality:e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <Select value={form.property_type} onChange={e=>setForm({...form, property_type:e.target.value})}>
                <option>Apartment</option>
                <option>Villa</option>
                <option>Plot</option>
                <option>Commercial</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium">Bedrooms</label>
              <Input value={form.bedrooms} onChange={e=>setForm({...form, bedrooms:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Bathrooms</label>
              <Input value={form.bathrooms} onChange={e=>setForm({...form, bathrooms:e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Price (₹)</label>
              <Input required value={form.price_inr} onChange={e=>setForm({...form, price_inr:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Area (sqft)</label>
              <Input value={form.sqft} onChange={e=>setForm({...form, sqft:e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Next</Button>
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
                  <div key={i} className="relative h-24 w-full">
                    <Image src={u} alt="" fill className="object-cover rounded" sizes="(max-width: 768px) 33vw, 200px" placeholder="blur" blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="secondary" onClick={()=>setStep(1)}>Back</Button>
            <Button disabled={busy}>Submit</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <Card>
          <div className="font-semibold text-fg">Thanks! Your property is submitted.</div>
          <div className="text-fgMuted text-sm">We'll verify details and make it visible to buyers shortly.</div>
          {propertyId && (
            <div className="mt-4">
              <Button onClick={() => setShowComprehensiveData(true)}>
                Add Comprehensive Property Data
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Comprehensive Property Data Section */}
      {/* TODO: Re-enable when ComprehensivePropertyData component is created
      {(showComprehensiveData || (propertyId && step === 2)) && propertyId && (
        <div className="mt-8">
          <ComprehensivePropertyData propertyId={propertyId} />
        </div>
      )}
      */}

      {/* Toggle button for comprehensive data when editing */}
      {propertyId && step === 2 && !showComprehensiveData && (
        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={() => setShowComprehensiveData(true)}>
            Manage Comprehensive Property Data (500+ fields)
          </Button>
        </div>
      )}
    </main>
  )
}

