import React from 'react'
import { motion } from 'framer-motion'

export const HandshakeAndDashboard: React.FC<{ color?: string; className?: string }> = ({ color = '#10B981', className }) => {
  return (
    <motion.svg aria-hidden="true" viewBox="0 0 300 300" className={className}>
      {/* Dashboard frame */}
      <g stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="60" y="60" width="180" height="110" rx="10" />
        <path d="M70 80h160" />
      </g>
      {/* Chart line */}
      <motion.path
        d="M80 150 l40 -30 l40 10 l40 -35 l20 15"
        stroke={color}
        strokeWidth="4"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />
      {/* Handshake */}
      <motion.g initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35 }}>
        <g stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M110 200 l30 20 l30 -20" />
          <path d="M100 200 l40 0" />
          <path d="M170 200 l40 0" />
        </g>
        <motion.circle cx="150" cy="200" r="10" fill={color} animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
      </motion.g>
      {/* Phone with WhatsApp badge */}
      <motion.g initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
        <rect x="210" y="170" width="40" height="70" rx="8" stroke="#111827" strokeWidth="3" fill="white" />
        <circle cx="230" cy="182" r="8" fill={color} />
      </motion.g>
      {/* Calendar */}
      <motion.g initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
        <rect x="50" y="170" width="60" height="50" rx="6" stroke="#111827" strokeWidth="3" fill="white" />
        <path d="M50 190h60" stroke="#111827" strokeWidth="3" />
        <circle cx="65" cy="180" r="3" fill={color} />
      </motion.g>
    </motion.svg>
  )
}

export default HandshakeAndDashboard
