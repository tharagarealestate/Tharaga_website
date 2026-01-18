"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface KeyboardShortcutIndicatorProps {
  keys: string
  description: string
}

export function KeyboardShortcutIndicator({ keys, description }: KeyboardShortcutIndicatorProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const showIndicator = () => {
      setShow(true)
      timeout = setTimeout(() => setShow(false), 2000)
    }

    // Listen for keyboard shortcut usage
    const handler = (e: KeyboardEvent) => {
      const keyString = keys.toLowerCase().replace(/\+/g, '').replace(/\s/g, '')
      const pressedKey = e.key.toLowerCase()
      
      if (keyString.includes(pressedKey)) {
        showIndicator()
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      clearTimeout(timeout)
    }
  }, [keys])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/[0.08] backdrop-blur-[16px] glow-border rounded-xl px-4 py-2 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#D4AF37]/20 glow-border rounded text-xs font-mono font-semibold text-[#D4AF37]">
              {keys}
            </kbd>
            <span className="text-sm text-white">{description}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



