"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  href?: string
  onClick?: () => void
  label?: string
}

/**
 * Compact Back Button Component
 * Matches HOME button style - compact, clean, consistent
 */
export function BackButton({ href, onClick, label = "BACK" }: BackButtonProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    } else if (!href) {
      e.preventDefault()
      router.back()
    }
  }

  const buttonContent = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="inline-flex items-center justify-center group relative overflow-hidden rounded-lg px-3 py-2 border border-amber-300/25 hover:border-amber-300/40 transition-all duration-300 bg-slate-800/50 hover:bg-slate-800/70"
    >
      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <ArrowLeft className="w-3 h-3 text-slate-900" />
      </div>
      <span className="ml-2 text-xs font-semibold text-amber-300">{label}</span>
    </motion.button>
  )

  if (href && !onClick) {
    return (
      <Link href={href}>
        {buttonContent}
      </Link>
    )
  }

  return buttonContent
}




