import React from 'react'
import { motion } from 'framer-motion'

export const AIBrain: React.FC<{ color?: string; className?: string }> = ({ color = '#FF6B35', className }) => {
  return (
    <motion.svg aria-hidden="true" viewBox="0 0 300 300" className={className}>
      <g stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="90" y="90" width="120" height="120" rx="24" />
        <path d="M150 90v120" />
        <path d="M90 150h120" />
      </g>
      <motion.g
        initial={{ opacity: 0.4, scale: 0.95 }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1.06, 0.96] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="150" cy="150" r="24" stroke={color} strokeWidth="4" fill="none" />
        <circle cx="150" cy="150" r="8" fill={color} />
      </motion.g>
    </motion.svg>
  )
}

export default AIBrain
