'use client'

import { useState } from 'react'
import { Share2, Facebook, Twitter, MessageCircle, Mail, Copy, Check, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface SharePropertyProps {
  propertyId: string
  title: string
  url?: string
}

export default function ShareProperty({ propertyId, title, url }: SharePropertyProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : `https://tharaga.co.in/properties/${propertyId}`)
  const shareText = `Check out this property: ${title}`

  const shareActions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={20} />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} - ${shareUrl}`)}`
        window.open(whatsappUrl, '_blank')
      }
    },
    {
      name: 'Facebook',
      icon: <Facebook size={20} />,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        window.open(facebookUrl, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'Twitter',
      icon: <Twitter size={20} />,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        window.open(twitterUrl, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'Email',
      icon: <Mail size={20} />,
      color: 'bg-slate-600 hover:bg-slate-700',
      action: () => {
        const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Check out this property: ${shareUrl}`)}`
        window.location.href = emailUrl
      }
    },
    {
      name: 'Copy Link',
      icon: copied ? <Check size={20} /> : <Copy size={20} />,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          toast.success('Link copied to clipboard!')
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          toast.error('Failed to copy link')
        }
      }
    },
    {
      name: 'Print',
      icon: <Printer size={20} />,
      color: 'bg-slate-600 hover:bg-slate-700',
      action: () => {
        window.print()
      }
    }
  ]

  // Use native share API if available (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl
        })
      } catch (err) {
        // User cancelled or error
      }
    }
  }

  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Share2 size={24} className="text-amber-300" />
        Share Property
      </h2>

      {/* Native share button for mobile */}
      {typeof window !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          className="w-full mb-4 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Share2 size={18} />
          Share via...
        </button>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {shareActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`${action.color} text-white p-3 rounded-lg transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 min-h-[80px]`}
            title={action.name}
          >
            {action.icon}
            <span className="text-xs font-medium">{action.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-slate-700/50 border border-amber-300/30 rounded-lg">
        <div className="text-xs text-slate-400 mb-1">Property Link</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-slate-800 border border-amber-300/30 rounded px-3 py-2 text-sm text-white"
          />
          <button
            onClick={shareActions[4].action}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded font-medium text-sm"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}













