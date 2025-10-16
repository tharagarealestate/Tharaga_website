import React from 'react'
import { motion } from 'framer-motion'

export const Crane: React.FC<{ color?: string; className?: string }> = ({ color = '#1A73E8', className }) => {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 300 300"
      className={className}
      initial={{ rotate: -5, y: -16, opacity: 0 }}
      animate={{ rotate: 0, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 110, damping: 10 }}
    >
      <g fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 230h240" />
        <path d="M60 230V110l60-40h70l40 30" />
        <path d="M120 70v40h80V60" />
        <path d="M140 110l60 40" />
        <path d="M200 150v80" />
      </g>
      <g stroke={color} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M200 160 l30 40" />
        <motion.circle cx="230" cy="200" r="14" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} />
      </g>
    </motion.svg>
  )
}

export default Crane
