'use client'

/**
 * Tharaga — Floating AI Chat Widget
 *
 * Persistent on ALL pages. Intercom-style bottom-right bubble that opens a
 * full glassmorphism chat panel. Connects to /api/ai/chat.
 *
 * Design: AI-world system — bg-zinc-950 / amber accents / backdrop-blur
 * Architecture: streaming fetch → incremental token display
 */

import {
  useState, useEffect, useRef, useCallback, useLayoutEffect,
  type KeyboardEvent, type ChangeEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import {
  X, Send, Sparkles, ChevronDown, RotateCcw, Loader2,
  Home, Calculator, MapPin, TrendingUp, MessageCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant' | 'system'

interface Message {
  id: string
  role: Role
  content: string
  ts: number
  isStreaming?: boolean
}

// ─── Quick-reply suggestions by page context ──────────────────────────────────

function getSuggestions(pathname: string): string[] {
  if (pathname.startsWith('/builder')) {
    return [
      'How do I add a new property?',
      'Why is my lead count low?',
      'How does SmartScore work?',
      'Set up WhatsApp automation',
    ]
  }
  if (pathname.startsWith('/property') || pathname.startsWith('/properties')) {
    return [
      'Find 2BHK under ₹60L in Chennai',
      'RERA-verified flats in Porur',
      'Best areas for investment?',
      'Calculate EMI for ₹75L loan',
    ]
  }
  if (pathname.startsWith('/tools')) {
    return [
      'Calculate home loan EMI',
      'ROI on ₹80L property?',
      'Budget planner for first home',
      'Best neighborhoods in Chennai',
    ]
  }
  if (pathname.startsWith('/pricing')) {
    return [
      "What's included in Pro plan?",
      'How does billing work?',
      'Can I upgrade later?',
      'Free trial available?',
    ]
  }
  return [
    'Find properties in Chennai',
    'How does Tharaga AI work?',
    'Zero commission explained',
    'I want to list my project',
  ]
}

// ─── System prompt by pathname ────────────────────────────────────────────────

function getSystemPrompt(pathname: string): string {
  const base = `You are Tharaga AI, an intelligent assistant for Tharaga — India's first AI-powered zero-commission real estate platform based in Chennai. You are friendly, concise, and deeply knowledgeable about Chennai real estate, property investments, lead management, and the Tharaga platform. Always respond in 2-4 short paragraphs. Use ₹ for Indian Rupees. Never be verbose.`

  if (pathname.startsWith('/builder'))
    return `${base} The user is a builder/developer using the Tharaga Builder Dashboard. Help them with leads, properties, AI automation, revenue tracking, WhatsApp campaigns, and dashboard features.`
  if (pathname.startsWith('/property') || pathname.startsWith('/properties'))
    return `${base} The user is browsing properties. Help them find suitable options, understand property details, calculate budgets, and connect with builders.`
  if (pathname.startsWith('/tools'))
    return `${base} The user is using Tharaga's financial tools. Help them with EMI calculations, ROI analysis, loan eligibility, and neighborhood insights.`
  if (pathname.startsWith('/pricing'))
    return `${base} The user is evaluating Tharaga's pricing. Explain the Tharaga Pro plan (₹4,999/mo), its features, and benefits clearly.`

  return `${base} Help users discover properties in Chennai, understand how Tharaga works, and get started with the platform.`
}

// ─── Token counter ─────────────────────────────────────────────────────────────

let _msgId = 0
const uid = () => `msg-${++_msgId}-${Date.now()}`

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AIAvatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md'
    ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shrink-0'
    : 'w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0'
  const iconCls = size === 'md' ? 'w-4 h-4 text-amber-400' : 'w-3 h-3 text-amber-400'
  return (
    <div className={cls}>
      <Sparkles className={iconCls} />
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && <AIAvatar />}

      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-amber-500/15 border border-amber-500/25 text-zinc-100 rounded-tr-sm'
              : 'bg-white/[0.05] border border-white/[0.07] text-zinc-200 rounded-tl-sm'
          }`}
        >
          {msg.isStreaming ? (
            <span>
              {msg.content}
              <span className="inline-block w-1 h-3.5 ml-0.5 bg-amber-400/80 rounded-sm animate-pulse align-middle" />
            </span>
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
        </div>
        <span className="text-[10px] text-zinc-600 px-1">
          {new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-2.5">
      <AIAvatar />
      <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
          />
        ))}
      </div>
    </div>
  )
}

// ─── Welcome panel ─────────────────────────────────────────────────────────────

function WelcomePanel({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (s: string) => void
}) {
  const pageIcons = [Home, Calculator, MapPin, TrendingUp]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center gap-6">
      {/* AI avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-amber-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-1.5"
      >
        <h3 className="text-base font-bold text-zinc-100">Hi, I'm Tharaga AI</h3>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-[220px]">
          Your intelligent guide for Chennai real estate. Ask me anything.
        </p>
      </motion.div>

      {/* Quick suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full space-y-2"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Quick start</p>
        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((s, i) => {
            const Icon = pageIcons[i % pageIcons.length]
            return (
              <motion.button
                key={s}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                onClick={() => onSelect(s)}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-amber-500/25 text-left text-sm text-zinc-300 hover:text-zinc-100 transition-all duration-200 group"
              >
                <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
                <span>{s}</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function FloatingAIChat() {
  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  const [mounted, setMounted]     = useState(false)
  const [pathname, setPathname]   = useState('/')
  const [unread, setUnread]       = useState(0)

  const scrollRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const abortRef    = useRef<AbortController | null>(null)

  // Spring for FAB scale
  const scale = useSpring(1, { stiffness: 400, damping: 22 })
  const scaleTransform = useTransform(scale, v => `scale(${v})`)

  useLayoutEffect(() => {
    setMounted(true)
    setPathname(window.location.pathname)
  }, [])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 250)
    }
  }, [open])

  // Auto-resize textarea
  const resizeInput = useCallback(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`
  }, [])

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg: Message = { id: uid(), role: 'user', content: trimmed, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (inputRef.current) { inputRef.current.style.height = 'auto' }
    setIsTyping(true)

    if (!open) {
      setUnread(u => u + 1)
    }

    // Cancel any in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const systemPrompt = getSystemPrompt(pathname)
    const history = messages.slice(-10) // last 10 messages for context

    try {
      const res = await fetch('/api/ai/widget-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: trimmed },
          ],
          pathname,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      const content =
        json.message?.content ||
        json.choices?.[0]?.message?.content ||
        json.content ||
        json.reply ||
        'I apologize, I couldn\'t process that. Please try again.'

      setIsTyping(false)
      setMessages(prev => [...prev, { id: uid(), role: 'assistant', content, ts: Date.now() }])
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setIsTyping(false)

      // Graceful fallback response
      const fallback = `I'm having trouble connecting right now. Please try again in a moment, or reach us at **tharagarealestate@gmail.com** for immediate help.`
      setMessages(prev => [...prev, { id: uid(), role: 'assistant', content: fallback, ts: Date.now() }])
    }
  }, [input, isTyping, messages, open, pathname])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }, [input, sendMessage])

  const handleClear = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setIsTyping(false)
  }, [])

  const suggestions = getSuggestions(pathname)
  const hasMessages = messages.length > 0

  if (!mounted) return null

  return createPortal(
    <>
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.18 } }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[88px] right-4 sm:right-6 z-[250] w-[calc(100vw-32px)] sm:w-[380px] max-h-[80vh] flex flex-col"
            style={{ maxHeight: 'min(80vh, 580px)' }}
          >
            {/* Glow border */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-400/5 to-transparent pointer-events-none rounded-bl-xl" />

            <div className="relative flex flex-col h-full rounded-2xl rounded-br-lg bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.07] shadow-2xl shadow-black/60 overflow-hidden">

              {/* Ambient orbs */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-amber-500/6 blur-[60px]" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-amber-600/4 blur-[50px]" />
              </div>

              {/* ── Header ── */}
              <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <AIAvatar size="md" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-100">Tharaga AI</span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">AI Real Estate Assistant</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {hasMessages && (
                    <button
                      onClick={handleClear}
                      title="Clear chat"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    title="Close"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Messages / Welcome ── */}
              <div
                ref={scrollRef}
                className="relative flex-1 overflow-y-auto overscroll-contain scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
              >
                {!hasMessages ? (
                  <WelcomePanel suggestions={suggestions} onSelect={(s) => sendMessage(s)} />
                ) : (
                  <div className="px-4 py-4 space-y-4">
                    {messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {isTyping && <TypingDots />}
                  </div>
                )}
              </div>

              {/* ── Input ── */}
              <div className="relative border-t border-white/[0.06] px-3 py-3">
                <div className="flex items-end gap-2 rounded-xl bg-white/[0.04] border border-white/[0.07] focus-within:border-amber-500/30 focus-within:bg-white/[0.06] transition-all duration-200 px-3 py-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                      setInput(e.target.value)
                      resizeInput()
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about properties, prices, EMI…"
                    disabled={isTyping}
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none resize-none leading-relaxed disabled:opacity-40 max-h-24"
                    style={{ minHeight: '24px' }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-950 disabled:text-zinc-500 transition-all duration-200"
                  >
                    {isTyping
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                  </motion.button>
                </div>
                <p className="text-[9px] text-zinc-700 text-center mt-1.5">
                  Powered by Tharaga AI · Enter to send · Shift+Enter for newline
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB (Floating Action Button) ── */}
      <motion.div
        className="fixed bottom-5 right-4 sm:right-6 z-[251]"
        style={{ scale: scaleTransform }}
      >
        <motion.button
          onClick={() => setOpen(o => !o)}
          onHoverStart={() => scale.set(1.08)}
          onHoverEnd={() => scale.set(1)}
          whileTap={{ scale: 0.92 }}
          aria-label="Open Tharaga AI chat"
          className="relative w-14 h-14 rounded-2xl shadow-2xl shadow-black/50 flex items-center justify-center focus:outline-none group"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
          }}
        >
          {/* Glow ring */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-amber-400/50 to-amber-600/30 blur-sm opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <X className="w-6 h-6 text-zinc-950" />
                </motion.div>
              ) : (
                <motion.div
                  key="sparkles"
                  initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <MessageCircle className="w-6 h-6 text-zinc-950" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Unread badge */}
          <AnimatePresence>
            {unread > 0 && !open && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-zinc-950 flex items-center justify-center z-20"
              >
                <span className="text-[9px] font-bold text-white">{unread}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring when closed */}
          {!open && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-amber-400/40"
              animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>

        {/* Tooltip label */}
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: 2, duration: 0.3 }}
              className="absolute right-[68px] top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/[0.07] shadow-xl whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-zinc-200">Ask Tharaga AI</span>
                <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-zinc-900 border-r border-t border-white/[0.07] rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>,
    document.body
  )
}
