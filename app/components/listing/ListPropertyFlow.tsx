'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Building2, Check, FileText, Home, ImagePlus, Lock, MapPin, Phone,
  Plus, ShieldCheck, Sun, Trees, Video, Warehouse, X,
} from 'lucide-react'
import { TharagaWordmark } from '@/components/brand/TharagaWordmark'
import { Grain } from '@/components/portfolio/primitives'
import { openAuthModal } from '@/components/auth/AuthModal'
import { getSupabase } from '@/lib/supabase'
import { useAuthUser } from '@/lib/useAuthUser'
import { DESK_PHONE_DISPLAY, DESK_PHONE_E164, telLink } from '@/lib/mandates'

const EASE = [0.22, 1, 0.36, 1] as const
const DRAFT_KEY = 'tharaga.listing.draft.v1'
const MAX_FILES = 15
const MAX_BYTES = 100 * 1024 * 1024

const TYPES = [
  { id: 'land', label: 'Land / plots', hint: 'Farm land, layouts, industrial land', icon: Trees },
  { id: 'solar_quarry', label: 'Solar site / quarry', hint: 'Solar plants, quarries, crushers', icon: Sun },
  { id: 'commercial', label: 'Commercial building', hint: 'Shops, offices, showrooms', icon: Building2 },
  { id: 'industrial', label: 'Industrial / warehouse', hint: 'Factories, sheds, godowns', icon: Warehouse },
  { id: 'residential', label: 'Home / villa / flat', hint: 'Independent houses, apartments', icon: Home },
  { id: 'other', label: 'Something else', hint: 'Marriage halls, hotels, schools…', icon: Plus },
] as const

const CHIPS: Record<string, string[]> = {
  land: ['Clear patta', 'Road frontage', 'EB connection', 'Near highway', 'Water source', 'DTCP approved'],
  solar_quarry: ['Licence current', 'Substation nearby', 'Operational', 'Machinery included', 'Road access'],
  commercial: ['Tenanted', 'Corner property', 'Lift', 'Car parking', 'Main road', 'Clear title'],
  industrial: ['Three-phase power', 'Truck access', 'Near SIPCOT', 'Office block', 'Clear title'],
  residential: ['Gated community', 'Car parking', 'East facing', 'Ready to move', 'Near metro'],
  other: ['Running business', 'Clear title', 'Main road', 'Parking'],
}

const STEPS = ['Property type', 'Location & details', 'Photos & videos', 'Your contact']

type Draft = {
  category: string; location: string; extent: string; description: string
  asking_price: string; rental_income: string; seller_name: string; seller_phone: string; seller_email: string
}
const EMPTY: Draft = { category: '', location: '', extent: '', description: '', asking_price: '', rental_income: '', seller_name: '', seller_phone: '', seller_email: '' }

type Picked = { id: string; file: File; preview?: string; progress: number; done: boolean; error?: string }

const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

/** Shrinks very large phone photos before upload so they go up fast; keeps everything else as is. */
async function prepare(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < 3.5 * 1024 * 1024 || /heic|heif/.test(file.type)) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 2600 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.86))
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}

function putWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (anon) {
      xhr.setRequestHeader('apikey', anon)
      xhr.setRequestHeader('Authorization', `Bearer ${anon}`)
    }
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error('Network error during upload'))
    const fd = new FormData()
    fd.append('cacheControl', '3600')
    fd.append('', file)
    xhr.send(fd)
  })
}

export function ListPropertyFlow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuthUser()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [d, setD] = useState<Draft>(EMPTY)
  const [files, setFiles] = useState<Picked[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<'form' | 'sending' | 'done'>('form')
  const [sendLabel, setSendLabel] = useState('')
  const [failure, setFailure] = useState('')
  const [result, setResult] = useState<{ reference: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Restore the draft, then prefill from the account.
  useEffect(() => {
    if (!isOpen) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setD(prev => ({ ...prev, ...JSON.parse(raw) }))
    } catch {}
  }, [isOpen])
  useEffect(() => {
    if (!user) return
    setD(prev => ({ ...prev, seller_name: prev.seller_name || user.name, seller_email: prev.seller_email || user.email }))
  }, [user])
  useEffect(() => {
    if (!isOpen || phase !== 'form') return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch {}
  }, [d, isOpen, phase])

  // Lock the page behind the panel; Escape closes.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && phase !== 'sending' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase])

  const set = (k: keyof Draft) => (v: string) => {
    setD(prev => ({ ...prev, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const close = useCallback(() => {
    onClose()
    if (phase === 'done') {
      setTimeout(() => {
        setPhase('form')
        setStep(0)
        setFiles([])
        setResult(null)
      }, 400)
    }
  }, [onClose, phase])

  const validate = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 0 && !d.category) e.category = 'Choose what you are listing.'
    if (s === 1) {
      if (!d.location.trim()) e.location = 'Where is the property? A village, area or city is enough.'
      if (!d.description.trim() && files.length === 0) e.description = 'A few lines help us present it well.'
    }
    if (s === 3) {
      if (!d.seller_name.trim()) e.seller_name = 'Your name, please.'
      if (d.seller_phone.replace(/\D/g, '').length < 10) e.seller_phone = 'A 10-digit mobile number, please.'
      if (d.seller_email && !/^\S+@\S+\.\S+$/.test(d.seller_email)) e.seller_email = 'That email looks incomplete.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const go = (to: number) => {
    if (to > step && !validate(step)) return
    setDir(to > step ? 1 : -1)
    setStep(to)
  }

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return
    const incoming = Array.from(list)
    const next: Picked[] = []
    for (const f of incoming) {
      if (files.length + next.length >= MAX_FILES) break
      const ok = /^(image|video)\//.test(f.type) || f.type === 'application/pdf'
      next.push({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        preview: f.type.startsWith('image/') && !/heic|heif/.test(f.type) ? URL.createObjectURL(f) : undefined,
        progress: 0,
        done: false,
        error: !ok ? 'Photos, videos or PDFs only' : f.size > MAX_BYTES ? 'Over 100 MB' : undefined,
      })
    }
    setFiles(prev => [...prev, ...next])
  }
  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const whatsappText = useMemo(() => {
    const t = TYPES.find(x => x.id === d.category)?.label || 'Property'
    return [
      `Hello Tharaga Estates, I would like to list my property${result ? ` (ref ${result.reference})` : ''}.`,
      `Type: ${t}`,
      d.location && `Location: ${d.location}`,
      d.extent && `Extent: ${d.extent}`,
      d.asking_price && `Asking: ${d.asking_price}`,
      d.description && `Details: ${d.description}`,
      d.seller_name && `Name: ${d.seller_name}`,
      d.seller_phone && `Phone: ${d.seller_phone}`,
    ]
      .filter(Boolean)
      .join('\n')
  }, [d, result])
  const waHref = `https://wa.me/${DESK_PHONE_E164}?text=${encodeURIComponent(whatsappText)}`

  const submit = async () => {
    if (!validate(3)) return
    setPhase('sending')
    setFailure('')
    try {
      const good = files.filter(f => !f.error)
      let media: { path: string; name: string; type: string; size: number }[] = []
      if (good.length) {
        setSendLabel('Preparing uploads…')
        const prepared = await Promise.all(good.map(f => prepare(f.file)))
        const res = await fetch('/api/listings/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: prepared.map(f => ({ name: f.name, type: f.type, size: f.size })) }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error || 'Upload failed')
        let finished = 0
        setSendLabel(`Uploading ${good.length} file${good.length > 1 ? 's' : ''}…`)
        const queue = prepared.map((file, i) => ({ file, i }))
        const worker = async () => {
          while (queue.length) {
            const { file, i } = queue.shift()!
            const up = j.uploads[i]
            await putWithProgress(up.signedUrl, file, p =>
              setFiles(prev => prev.map(f => (f.id === good[i].id ? { ...f, progress: p } : f))),
            )
            finished++
            setFiles(prev => prev.map(f => (f.id === good[i].id ? { ...f, progress: 1, done: true } : f)))
            setSendLabel(`Uploaded ${finished} of ${good.length}…`)
          }
        }
        await Promise.all([worker(), worker(), worker()])
        media = prepared.map((f, i) => ({ path: j.uploads[i].path, name: f.name, type: f.type, size: f.size }))
      }

      setSendLabel('Saving your listing…')
      let token = ''
      try {
        token = (await getSupabase().auth.getSession()).data.session?.access_token || ''
      } catch {}
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...d, media }),
      })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error || 'Could not save')
      setResult({ reference: out.reference })
      setPhase('done')
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {}
      window.dispatchEvent(new CustomEvent('tharaga:listing-created'))
    } catch (e: any) {
      setFailure(e?.message || 'Something went wrong.')
      setPhase('form')
    }
  }

  const totalProgress = useMemo(() => {
    const good = files.filter(f => !f.error)
    if (!good.length) return 0
    return good.reduce((a, f) => a + f.progress, 0) / good.length
  }, [files])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="dialog"
          aria-modal="true"
          aria-label="List your property"
        >
          <motion.button
            aria-label="Close"
            onClick={() => phase !== 'sending' && close()}
            className="absolute inset-0 cursor-default bg-[#0B1220]/75 backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ y: 40, opacity: 0, clipPath: 'inset(6% 4% 6% 4%)' }}
            animate={{ y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ y: 30, opacity: 0, clipPath: 'inset(4% 3% 4% 3%)' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative flex h-[100dvh] w-full max-w-5xl overflow-hidden bg-[#FBF8F2] shadow-[0_60px_140px_-40px_rgba(0,0,0,0.7)] sm:h-[min(780px,92vh)]"
          >
            {/* ── Brand side (desktop) ── */}
            <aside className="relative hidden w-[34%] shrink-0 flex-col justify-between overflow-hidden bg-[#15213A] p-9 text-[#F7F3EC] lg:flex">
              <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(230,201,160,0.32),transparent_65%)] blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(176,131,74,0.28),transparent_65%)] blur-2xl" />
              <Grain opacity={0.1} />
              <div aria-hidden className="pointer-events-none absolute inset-3 border border-[#E6C9A0]/15" />
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease: EASE }} className="relative">
                <TharagaWordmark tone="ivory" height={56} />
                <h2 className="mt-8 font-display text-[1.9rem] leading-[1.1] tracking-[0.02em] text-[#FBF8F2]">List your property</h2>
                <p className="mt-3 font-serif text-[1.15rem] italic leading-snug text-[#EBCB9C]">Quietly, to the right buyers.</p>
              </motion.div>

              <ol className="relative mt-8 space-y-1">
                {STEPS.map((label, i) => {
                  const state = phase === 'done' || i < step ? 'done' : i === step ? 'current' : 'next'
                  return (
                    <motion.li
                      key={label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.07, duration: 0.6, ease: EASE }}
                      className="flex items-center gap-4 py-2.5"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-sans text-[12px] font-semibold transition-colors duration-500 ${
                          state === 'done' ? 'border-[#E6C9A0] bg-[#E6C9A0] text-[#15213A]' : state === 'current' ? 'border-[#E6C9A0] text-[#F7F3EC]' : 'border-white/20 text-white/45'
                        }`}
                      >
                        {state === 'done' ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                      </span>
                      <span className={`font-sans text-[14px] transition-colors duration-500 ${state === 'next' ? 'text-white/50' : 'text-[#F7F3EC]'}`}>{label}</span>
                    </motion.li>
                  )
                })}
              </ol>

              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }} className="relative mt-8 space-y-3 border-t border-white/10 pt-6">
                {[
                  [ShieldCheck, 'No fee to list'],
                  [Lock, 'Reviewed by our desk before any buyer sees it'],
                  [Phone, 'Your number is never shown publicly'],
                ].map(([Icon, t]: any) => (
                  <li key={t} className="flex items-start gap-3 font-sans text-[13.5px] leading-snug text-white/75">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D9AE78]" strokeWidth={1.7} /> {t}
                  </li>
                ))}
              </motion.ul>
            </aside>

            {/* ── Form side ── */}
            <section className="relative flex min-w-0 flex-1 flex-col">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-[#E4DACA] px-5 py-4 sm:px-8">
                <div className="min-w-0">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94643A]">
                    {phase === 'done' ? 'Listing received' : `Step ${step + 1} of ${STEPS.length}`}
                  </p>
                  <p className="truncate font-display text-[1.05rem] tracking-[0.02em] text-[#15213A] lg:hidden">
                    {phase === 'done' ? 'Thank you' : STEPS[step]}
                  </p>
                </div>
                <button
                  onClick={() => phase !== 'sending' && close()}
                  aria-label="Close"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#4A5163] transition-colors hover:bg-[#EFE8DC] hover:text-[#15213A]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="h-[2px] bg-[#EFE8DC]">
                <motion.div
                  className="h-full origin-left bg-[#B0834A]"
                  animate={{ scaleX: phase === 'done' ? 1 : (step + (phase === 'sending' ? 1 : 0.35)) / STEPS.length }}
                  transition={{ duration: 0.6, ease: EASE }}
                />
              </div>

              {/* Body */}
              <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 py-7 sm:px-10 sm:py-9">
                <AnimatePresence mode="wait" custom={dir}>
                  {phase === 'done' && result ? (
                    <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mx-auto max-w-lg text-center">
                      <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" aria-hidden>
                        <motion.circle cx="60" cy="60" r="52" fill="none" stroke="#B0834A" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: EASE }} />
                        <motion.circle cx="60" cy="60" r="44" fill="#15213A" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, duration: 0.6, ease: EASE }} style={{ transformOrigin: '60px 60px' }} />
                        <motion.path d="M42 61 l12 12 l24 -26" fill="none" stroke="#E6C9A0" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.6, ease: EASE }} />
                      </svg>
                      <h3 className="mt-6 font-display text-[1.9rem] leading-tight tracking-[0.02em] text-[#15213A]">Listing received</h3>
                      <p className="mt-3 font-sans text-[15px] leading-relaxed text-[#4A5163]">
                        Your reference is <span className="font-semibold text-[#15213A]">{result.reference}</span>. The Tharaga desk reviews every property before any buyer sees it.
                      </p>
                      <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left">
                        {['Received — we have your details and media', 'Desk review and title check', 'Private buyer matching, then site visits'].map((t, i) => (
                          <li key={t} className="flex items-center gap-3 font-sans text-[14px] text-[#2E3648]">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${i === 0 ? 'bg-[#15213A] text-[#F7F3EC]' : 'border border-[#B0834A]/50 text-[#94643A]'}`}>{i === 0 ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                            {t}
                          </li>
                        ))}
                      </ol>
                      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 bg-[#15213A] px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F7F3EC] hover:bg-[#0E1729] hover:text-[#F7F3EC]">
                          Message the desk <ArrowRight className="h-4 w-4" />
                        </a>
                        {user ? (
                          <a href="/#status" onClick={close} className="inline-flex h-12 items-center justify-center border border-[#15213A] px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#15213A] hover:text-[#15213A]">
                            Track this listing
                          </a>
                        ) : (
                          <button onClick={() => openAuthModal()} className="inline-flex h-12 items-center justify-center border border-[#15213A] px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#15213A]">
                            Sign in to track it
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : phase === 'sending' ? (
                    <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
                      <div className="relative h-20 w-20">
                        <span className="absolute inset-0 animate-ping rounded-full bg-[#E6C9A0]/30" />
                        <span className="absolute inset-3 animate-spin rounded-full border-2 border-[#E6C9A0]/30 border-t-[#B0834A]" />
                      </div>
                      <p className="mt-8 font-display text-[1.4rem] tracking-[0.02em] text-[#15213A]">{sendLabel || 'Sending…'}</p>
                      {files.some(f => !f.error) && (
                        <div className="mt-6 w-full">
                          <div className="h-1.5 w-full overflow-hidden bg-[#EFE8DC]">
                            <motion.div className="h-full bg-[#B0834A]" animate={{ width: `${Math.round(totalProgress * 100)}%` }} transition={{ ease: 'easeOut' }} />
                          </div>
                          <p className="mt-2 font-sans text-[12.5px] text-[#5F6575]">{Math.round(totalProgress * 100)}% · keep this window open</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`step-${step}`}
                      custom={dir}
                      initial={{ opacity: 0, x: dir * 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: dir * -28 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      {failure && (
                        <div role="alert" className="mb-6 flex flex-col gap-3 border border-[#B0834A]/40 bg-[#F7EFE3] p-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-sans text-[14px] text-[#15213A]">{failure}</p>
                          <a href={waHref} target="_blank" rel="noreferrer" className="shrink-0 font-sans text-[13px] font-semibold text-[#94643A] underline underline-offset-4 hover:text-[#15213A]">
                            Send on WhatsApp instead
                          </a>
                        </div>
                      )}

                      {step === 0 && (
                        <div>
                          <h3 className="font-display text-[1.7rem] leading-tight tracking-[0.02em] text-[#15213A] sm:text-[2rem]">What are you listing?</h3>
                          <p className="mt-2 font-sans text-[15px] text-[#4A5163]">Choose the closest fit — you can describe it fully in the next step.</p>
                          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {TYPES.map((t, i) => {
                              const on = d.category === t.id
                              return (
                                <motion.button
                                  key={t.id}
                                  type="button"
                                  initial={{ opacity: 0, y: 14 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.05 * i, duration: 0.45, ease: EASE }}
                                  onClick={() => {
                                    set('category')(t.id)
                                    setTimeout(() => {
                                      setDir(1)
                                      setStep(1)
                                    }, 260)
                                  }}
                                  className={`group relative flex min-h-[132px] flex-col items-start justify-between border p-4 text-left transition-all duration-300 sm:p-5 ${
                                    on ? 'border-[#15213A] bg-[#15213A] text-[#F7F3EC] shadow-[0_18px_40px_-22px_rgba(21,33,58,0.8)]' : 'border-[#D6CAB5] bg-white hover:-translate-y-0.5 hover:border-[#B0834A] hover:shadow-[0_18px_40px_-28px_rgba(21,33,58,0.6)]'
                                  }`}
                                >
                                  <t.icon className={`h-6 w-6 ${on ? 'text-[#E6C9A0]' : 'text-[#94643A]'}`} strokeWidth={1.5} />
                                  <span>
                                    <span className={`block font-sans text-[14.5px] font-semibold ${on ? 'text-[#F7F3EC]' : 'text-[#15213A]'}`}>{t.label}</span>
                                    <span className={`mt-1 block font-sans text-[12.5px] leading-snug ${on ? 'text-white/70' : 'text-[#5F6575]'}`}>{t.hint}</span>
                                  </span>
                                </motion.button>
                              )
                            })}
                          </div>
                          {errors.category && <p className="mt-3 font-sans text-[13px] text-[#A3412B]">{errors.category}</p>}
                        </div>
                      )}

                      {step === 1 && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-display text-[1.7rem] leading-tight tracking-[0.02em] text-[#15213A] sm:text-[2rem]">Where is it, and what is it like?</h3>
                            <p className="mt-2 font-sans text-[15px] text-[#4A5163]">Plain words are perfect. Prices stay private — only verified buyers ever hear them.</p>
                          </div>
                          <Field label="Location" required error={errors.location} icon={<MapPin className="h-4 w-4" />}>
                            <input value={d.location} onChange={e => set('location')(e.target.value)} placeholder="e.g. Pulivalam, Tiruchirappalli or OMR, Chennai" className={inputCls} autoFocus />
                          </Field>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Size / extent">
                              <input value={d.extent} onChange={e => set('extent')(e.target.value)} placeholder="e.g. 16 acres · 3,600 sq.ft" className={inputCls} />
                            </Field>
                            <Field label="Asking price" hint="Private">
                              <input value={d.asking_price} onChange={e => set('asking_price')(e.target.value)} placeholder="e.g. ₹4.5 Cr or ₹60 L per acre" className={inputCls} />
                            </Field>
                          </div>
                          {(d.category === 'commercial' || d.category === 'industrial') && (
                            <Field label="Monthly rent today" hint="If tenanted">
                              <input value={d.rental_income} onChange={e => set('rental_income')(e.target.value)} placeholder="e.g. ₹3.2 L per month" className={inputCls} />
                            </Field>
                          )}
                          <Field label="About the property" error={errors.description}>
                            <textarea value={d.description} onChange={e => set('description')(e.target.value)} rows={5} placeholder="Road access, approvals, what is on the land, why you are selling — anything a buyer should know." className={`${inputCls} resize-none py-3 leading-relaxed`} />
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(CHIPS[d.category] || CHIPS.other).map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => set('description')(d.description.includes(c) ? d.description : `${d.description}${d.description && !/[\s,.]$/.test(d.description) ? ', ' : ''}${c}`)}
                                  className="inline-flex h-8 items-center gap-1.5 border border-[#D6CAB5] bg-white px-3 font-sans text-[12.5px] text-[#2E3648] transition-colors hover:border-[#15213A]"
                                >
                                  <Plus className="h-3 w-3 text-[#94643A]" /> {c}
                                </button>
                              ))}
                            </div>
                          </Field>
                        </div>
                      )}

                      {step === 2 && (
                        <div>
                          <h3 className="font-display text-[1.7rem] leading-tight tracking-[0.02em] text-[#15213A] sm:text-[2rem]">Show us the property</h3>
                          <p className="mt-2 font-sans text-[15px] text-[#4A5163]">Photos and a short walk-around video help most. Plans or documents as PDF are welcome. Optional.</p>
                          <div
                            onDragOver={e => {
                              e.preventDefault()
                              setDragging(true)
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={e => {
                              e.preventDefault()
                              setDragging(false)
                              addFiles(e.dataTransfer.files)
                            }}
                            onClick={() => inputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                            className={`mt-6 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition-colors duration-300 ${
                              dragging ? 'border-[#B0834A] bg-[#F7EFE3]' : 'border-[#D6CAB5] bg-white hover:border-[#B0834A]'
                            }`}
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#15213A] text-[#E6C9A0]">
                              <ImagePlus className="h-6 w-6" strokeWidth={1.6} />
                            </span>
                            <p className="mt-4 font-sans text-[15px] font-semibold text-[#15213A]">Tap to add photos & videos</p>
                            <p className="mt-1 font-sans text-[13px] text-[#5F6575]">or drag them here · up to {MAX_FILES} files, 100 MB each</p>
                            <input ref={inputRef} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
                          </div>
                          {files.length > 0 && (
                            <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
                              <AnimatePresence>
                                {files.map(f => (
                                  <motion.li key={f.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative aspect-square overflow-hidden border border-[#E4DACA] bg-[#EFE8DC]">
                                    {f.preview ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={f.preview} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-[#15213A]">
                                        {f.file.type.startsWith('video/') ? <Video className="h-6 w-6 text-[#94643A]" /> : <FileText className="h-6 w-6 text-[#94643A]" />}
                                        <span className="line-clamp-2 break-all text-center font-sans text-[10.5px] text-[#4A5163]">{f.file.name}</span>
                                      </div>
                                    )}
                                    <span className={`absolute inset-x-0 bottom-0 px-1.5 py-1 font-sans text-[10.5px] ${f.error ? 'bg-[#A3412B] text-white' : 'bg-[#0B1220]/70 text-white'}`}>{f.error || fmtSize(f.file.size)}</span>
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation()
                                        removeFile(f.id)
                                      }}
                                      aria-label={`Remove ${f.file.name}`}
                                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#0B1220]/75 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </motion.li>
                                ))}
                              </AnimatePresence>
                            </ul>
                          )}
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-display text-[1.7rem] leading-tight tracking-[0.02em] text-[#15213A] sm:text-[2rem]">How should we reach you?</h3>
                            <p className="mt-2 font-sans text-[15px] text-[#4A5163]">A person from the desk will call you. Your number is never shown on the site.</p>
                          </div>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Your name" required error={errors.seller_name}>
                              <input value={d.seller_name} onChange={e => set('seller_name')(e.target.value)} autoComplete="name" className={inputCls} />
                            </Field>
                            <Field label="Mobile number" required error={errors.seller_phone}>
                              <div className="flex">
                                <span className="flex h-12 items-center border border-r-0 border-[#D6CAB5] bg-[#EFE8DC] px-3 font-sans text-[14px] text-[#4A5163]">+91</span>
                                <input value={d.seller_phone} onChange={e => set('seller_phone')(e.target.value.replace(/[^\d\s]/g, '').slice(0, 14))} inputMode="tel" autoComplete="tel-national" placeholder="98xxx xxxxx" className={`${inputCls} min-w-0 flex-1`} />
                              </div>
                            </Field>
                          </div>
                          <Field label="Email" hint="Optional" error={errors.seller_email}>
                            <input value={d.seller_email} onChange={e => set('seller_email')(e.target.value)} type="email" autoComplete="email" className={inputCls} />
                          </Field>

                          <div className="border border-[#E4DACA] bg-white p-5">
                            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94643A]">Your listing</p>
                            <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 font-sans text-[14px]">
                              {[
                                ['Type', TYPES.find(t => t.id === d.category)?.label, 0],
                                ['Location', d.location, 1],
                                ['Size', d.extent || '—', 1],
                                ['Media', files.filter(f => !f.error).length ? `${files.filter(f => !f.error).length} file(s)` : 'None yet', 2],
                              ].map(([k, v, s]) => (
                                <div key={k as string} className="contents">
                                  <dt className="text-[#5F6575]">{k}</dt>
                                  <dd className="flex items-center justify-between gap-3 text-[#15213A]">
                                    <span className="truncate">{v as string}</span>
                                    <button type="button" onClick={() => go(s as number)} className="shrink-0 text-[12.5px] text-[#94643A] underline underline-offset-4">Edit</button>
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>

                          {!user && (
                            <button type="button" onClick={() => openAuthModal()} className="flex w-full items-center justify-between border border-dashed border-[#B0834A]/60 px-4 py-3 text-left font-sans text-[13.5px] text-[#2E3648] hover:border-[#15213A]">
                              <span>Sign in first to track this listing from your account</span>
                              <ArrowRight className="h-4 w-4 text-[#94643A]" />
                            </button>
                          )}
                          <p className="font-sans text-[12.5px] leading-relaxed text-[#5F6575]">
                            By submitting, you agree to be contacted by Tharaga Estates about this property. See our <a href="/privacy" className="underline underline-offset-2">privacy policy</a>.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer actions */}
              {phase === 'form' && (
                <div className="flex items-center justify-between gap-3 border-t border-[#E4DACA] bg-[#FBF8F2] px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-8">
                  {step > 0 ? (
                    <button onClick={() => go(step - 1)} className="inline-flex h-12 items-center gap-2 px-2 font-sans text-[13px] font-semibold text-[#4A5163] hover:text-[#15213A]">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                  ) : (
                    <a href={telLink} className="hidden h-12 items-center gap-2 font-sans text-[13px] text-[#4A5163] hover:text-[#15213A] sm:inline-flex">
                      <Phone className="h-4 w-4" /> Prefer to talk? {DESK_PHONE_DISPLAY}
                    </a>
                  )}
                  <span className="flex-1 sm:hidden" />
                  {step < 3 ? (
                    <button
                      onClick={() => go(step + 1)}
                      className="group inline-flex h-12 items-center gap-3 bg-[#15213A] px-7 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F7F3EC] transition-colors hover:bg-[#0E1729]"
                    >
                      {step === 2 && files.length === 0 ? 'Skip for now' : 'Continue'}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <button
                      onClick={submit}
                      className="group inline-flex h-12 items-center gap-3 bg-[#B0834A] px-7 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#FBF8F2] transition-colors hover:bg-[#94643A]"
                    >
                      Submit listing <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                </div>
              )}
              {phase === 'done' && (
                <div className="flex justify-center border-t border-[#E4DACA] px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                  <button onClick={close} className="h-11 px-6 font-sans text-[13px] font-semibold text-[#4A5163] hover:text-[#15213A]">
                    Done
                  </button>
                </div>
              )}
            </section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const inputCls =
  'h-12 w-full border border-[#D6CAB5] bg-white px-4 font-sans text-[15px] text-[#15213A] placeholder:text-[#9AA0AE] outline-none transition-colors focus:border-[#15213A] focus:ring-2 focus:ring-[#B0834A]/25'

function Field({ label, hint, required, error, icon, children }: { label: string; hint?: string; required?: boolean; error?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 font-sans text-[13px] font-semibold text-[#15213A]">
        {icon && <span className="text-[#94643A]">{icon}</span>}
        {label}
        {required && <span className="text-[#B0834A]">*</span>}
        {hint && <span className="ml-auto font-normal text-[#5F6575]">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block font-sans text-[13px] text-[#A3412B]">{error}</span>}
    </label>
  )
}
