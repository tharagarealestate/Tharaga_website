"use client"
import Image from 'next/image'
import React from 'react'
import { Share2, Maximize2, ExternalLink, FileDown, X, ChevronLeft, ChevronRight, Copy } from 'lucide-react'

export type GalleryProps = {
  images: string[]
  tourUrl?: string
  brochureUrl?: string
}

export function Gallery({ images, tourUrl, brochureUrl }: GalleryProps) {
  const [index, setIndex] = React.useState(0)
  const [lightbox, setLightbox] = React.useState(false)
  const [zoomed, setZoomed] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const main = images?.[index] || images?.[0]

  React.useEffect(() => { setIndex(0) }, [images?.[0]])

  function open(i: number) { setIndex(i); setLightbox(true); track('gallery_open', { i }) }
  function next() { setIndex((i) => (i + 1) % Math.max(1, images.length)); track('gallery_next', { i: index }) }
  function prev() { setIndex((i) => (i - 1 + Math.max(1, images.length)) % Math.max(1, images.length)); track('gallery_prev', { i: index }) }
  function close() { setLightbox(false); setZoomed(false) }

  function share() {
    const url = typeof location !== 'undefined' ? location.href : ''
    const title = 'Check out this property on Tharaga'
    if (navigator.share) {
      navigator.share({ title, url }).catch(()=>{})
    } else {
      copy(url)
      alert('Link copied')
    }
    track('share_click')
  }

  function copy(text: string){
    try { navigator.clipboard?.writeText(text) } catch {}
  }

  function enterFullscreen(){
    const el = containerRef.current
    if (el && el.requestFullscreen) el.requestFullscreen()
    track('fullscreen_click')
  }

  // Swipe support
  const touchStartX = React.useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent){ touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent){
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 40) prev(); else if (dx < -40) next()
    touchStartX.current = null
  }

  function track(event: string, props?: Record<string, any>){
    try { ;(window as any).thgTrack && (window as any).thgTrack(event, props||{}) } catch {}
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="w-full h-[70vh] relative overflow-hidden group">
        {main ? (
          <Image src={main} alt="Property" fill priority className="object-cover transition-transform duration-300 group-hover:scale-[1.03] cursor-zoom-in" onClick={()=>open(index)} sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        <div className="absolute right-4 top-4 flex gap-2">
          <button onClick={enterFullscreen} className="rounded-md bg-black/60 text-white px-3 py-2 text-sm flex items-center gap-2" data-track-id="fullscreen"><Maximize2 size={16}/> Fullscreen</button>
          <button onClick={share} className="rounded-md bg-black/60 text-white px-3 py-2 text-sm flex items-center gap-2" data-track-id="share"><Share2 size={16}/> Share</button>
          {tourUrl ? (
            <a href={tourUrl} target="_blank" rel="noreferrer" className="rounded-md bg-black/60 text-white px-3 py-2 text-sm flex items-center gap-2" data-track-id="tour"><ExternalLink size={16}/> 360° Tour</a>
          ) : null}
          {brochureUrl ? (
            <a href={brochureUrl} target="_blank" rel="noreferrer" className="rounded-md bg-black/60 text-white px-3 py-2 text-sm flex items-center gap-2" data-track-id="brochure"><FileDown size={16}/> Brochure</a>
          ) : null}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="mt-3 grid grid-cols-4 gap-2 overflow-x-auto lg:overflow-visible">
          {(images||[]).slice(0, 20).map((src, i) => (
            <button key={i} type="button" className="relative h-24" onClick={()=>open(i)}>
              <Image src={src} alt="thumb" fill className="object-cover rounded" loading="lazy" sizes="25vw" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button className="absolute top-4 right-4 text-white" aria-label="Close" onClick={close}><X size={28}/></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white" aria-label="Prev" onClick={prev}><ChevronLeft size={32}/></button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white" aria-label="Next" onClick={next}><ChevronRight size={32}/></button>
          <div className="relative w-[90vw] h-[80vh] overflow-hidden">
            <Image
              src={images[index]}
              alt={`photo ${index+1}`}
              fill
              sizes="100vw"
              className={`object-contain transition-transform duration-200 ${zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={()=>setZoomed(z=>!z)}
              priority
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <button onClick={()=>{
              const url = typeof location !== 'undefined' ? location.href : ''
              copy(url); track('copy_link');
            }} className="text-white/80 hover:text-white flex items-center gap-1"><Copy size={16}/> Copy link</button>
            <a className="text-white/80 hover:text-white" href={`https://wa.me/?text=${encodeURIComponent(typeof location !== 'undefined' ? (location.href || '') : '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="text-white/80 hover:text-white" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof location !== 'undefined' ? (location.href || '') : '')}`} target="_blank" rel="noreferrer">Facebook</a>
            <a className="text-white/80 hover:text-white" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof location !== 'undefined' ? (location.href || '') : '')}`} target="_blank" rel="noreferrer">Twitter</a>
          </div>
        </div>
      )}
    </div>
  )
}
