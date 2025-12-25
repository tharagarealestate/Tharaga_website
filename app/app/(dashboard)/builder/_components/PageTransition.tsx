"use client"

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1], // Smooth AI-style easing
        }
      }}
      exit={{ 
        opacity: 0, 
        y: -20, 
        scale: 0.98,
        transition: {
          duration: 0.3,
          ease: [0.4, 0, 1, 1],
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}






