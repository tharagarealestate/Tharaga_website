'use client'

/**
 * MobileContactBar — Fixed mobile bottom CTA bar (lg:hidden)
 * Separate client component so we can use window.location safely.
 */

import { useState } from 'react'
import { Phone, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContactForm as ContactFormClient } from './ContactForm'

interface MobileContactBarProps {
  propertyId: string
  priceDisplay: string
  brochureUrl?: string
}

export default function MobileContactBar({ propertyId, priceDisplay, brochureUrl }: MobileContactBarProps) {
  const [showContact, setShowContact] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://tharaga.co.in/properties/${propertyId}`

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this property on Tharaga: ${shareUrl}`)}`

  return (
    <>
      {/* WhatsApp FAB — positioned above the bar */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[76px] right-4 z-50 w-11 h-11 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-lg shadow-green-900/40 transition-colors lg:hidden"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={18} className="text-white" />
      </a>

      {/* Bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/96 backdrop-blur-xl border-t border-white/[0.07] px-4 py-3 lg:hidden"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider leading-none">Price</p>
            <p className="text-lg font-black text-amber-400 leading-tight">{priceDisplay}</p>
          </div>
          <button
            onClick={() => setShowContact(true)}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Phone size={14} />
            Schedule Visit
          </button>
        </div>
      </div>

      {/* Contact form sheet */}
      {showContact && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContact(false)} />
          <div className="relative w-full bg-zinc-950 border-t border-white/[0.08] rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">Schedule a Visit</h3>
              <button onClick={() => setShowContact(false)} className="p-1 text-zinc-500 hover:text-zinc-300">
                <X size={18} />
              </button>
            </div>
            <ContactFormClient propertyId={propertyId} brochureUrl={brochureUrl} />
          </div>
        </div>
      )}
    </>
  )
}
