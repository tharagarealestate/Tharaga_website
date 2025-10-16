import React from 'react'
import { motion } from 'framer-motion'

export const UploadFolder: React.FC<{ color?: string; className?: string }> = ({ color = '#1A73E8', className }) => {
  return (
    <motion.svg aria-hidden="true" viewBox="0 0 300 300" className={className}>
      <g stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="70" y="120" width="160" height="100" rx="14" />
        <path d="M70 140h160" />
      </g>
      <motion.g initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
        <rect x="120" y="110" width="60" height="40" rx="6" fill={color} opacity="0.15" />
        <g stroke={color} strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M150 112v28" />
          <path d="M140 122h20" />
        </g>
      </motion.g>
    </motion.svg>
  )
}

export default UploadFolder
