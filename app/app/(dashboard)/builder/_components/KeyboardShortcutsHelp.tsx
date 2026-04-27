"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const [showOnMount, setShowOnMount] = useState(false)

  useEffect(() => {
    // Show help on first visit (check localStorage)
    const hasSeenHelp = localStorage.getItem('tharaga-keyboard-shortcuts-seen')
    if (!hasSeenHelp) {
      setTimeout(() => {
        setShowOnMount(true)
        setIsOpen(true)
        localStorage.setItem('tharaga-keyboard-shortcuts-seen', 'true')
      }, 2000) // Show after 2 seconds
    }
  }, [])

  // Toggle with ? key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault()
          setIsOpen(!isOpen)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const shortcuts = [
    { key: '1-7', description: 'Switch to section (Overview, Leads, Pipeline, etc.)' },
    { key: 'Alt + ←/→', description: 'Navigate between sections' },
    { key: '⌘/Ctrl + K', description: 'Focus search' },
    { key: '?', description: 'Show keyboard shortcuts' },
  ]

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] text-[#0a1628] shadow-lg shadow-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
        title="Keyboard Shortcuts (Press ?)"
        aria-label="Keyboard shortcuts help"
      >
        <Keyboard className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center">
                      <Keyboard className="w-5 h-5 text-[#0a1628]" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={shortcut.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]"
                    >
                      <span className="text-sm text-gray-300">{shortcut.description}</span>
                      <kbd className="px-3 py-1.5 bg-white/[0.08] border border-white/[0.12] rounded-lg text-xs font-mono font-semibold text-[#D4AF37]">
                        {shortcut.key}
                      </kbd>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <p className="text-xs text-gray-400 text-center">
                    Press <kbd className="px-2 py-1 bg-white/[0.08] rounded text-[#D4AF37]">?</kbd> anytime to toggle this help
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}



