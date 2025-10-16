import React from 'react'
import { motion } from 'framer-motion'

export type BuilderExpression = 'neutral' | 'smile' | 'confident'

export type BuilderAvatarProps = {
  expression?: BuilderExpression
  accentColor?: string
  className?: string
  // scaled size is controlled by the parent via Tailwind; the svg is responsive via viewBox
}

// Monochrome line avatar with simple facial expression variants.
export const BuilderAvatar: React.FC<BuilderAvatarProps> = ({ expression = 'neutral', className, accentColor = '#111827' }) => {
  // mouth paths for expressions
  const mouthD = {
    neutral: 'M135 180 q15 5 30 0',
    smile: 'M130 178 q20 20 40 0',
    confident: 'M132 176 q22 14 44 0',
  }[expression]

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 300 300"
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Head */}
      <g stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="150" cy="110" r="42" />
        {/* Eyes */}
        <circle cx="136" cy="108" r="3" />
        <circle cx="164" cy="108" r="3" />
        {/* Mouth */}
        <path d={mouthD} />
      </g>
      {/* Body */}
      <g stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M110 210h80" />
        <rect x="95" y="150" width="110" height="70" rx="12" />
        {/* Laptop */}
        <rect x="105" y="165" width="90" height="45" rx="4" />
        <path d="M105 212h90" />
      </g>
      {/* Accent badge on cap */}
      <g fill={accentColor}>
        <path d="M150 60 l18 8 -18 8 -18 -8 18 -8z" opacity="0.12" />
      </g>
    </motion.svg>
  )
}

export default BuilderAvatar
