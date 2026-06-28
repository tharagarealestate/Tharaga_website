import React from 'react'
import { cn } from '@/lib/utils'

interface GlassContainerProps {
  children: React.ReactNode
  className?: string
  intensity?: 'light' | 'medium' | 'strong'
}

export function GlassContainer({ 
  children, 
  className,
  intensity = 'medium' 
}: GlassContainerProps) {
  const intensityClasses = {
    light: 'bg-white/10 border-white/15',
    medium: 'bg-white/15 border-white/25',
    strong: 'bg-white/20 border-white/30',
  }

  return (
    <div 
      className={cn(
        'backdrop-blur-glass rounded-2xl border',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
        intensityClasses[intensity],
        className
      )}
    >
      {children}
    </div>
  )
}

