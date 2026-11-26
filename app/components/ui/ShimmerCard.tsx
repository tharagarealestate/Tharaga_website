import React from 'react'
import { cn } from '@/lib/utils'

interface ShimmerCardProps {
  children: React.ReactNode
  className?: string
}

export function ShimmerCard({ children, className }: ShimmerCardProps) {
  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        'before:translate-x-[-100%] hover:before:translate-x-[100%]',
        'before:transition-transform before:duration-1000',
        className
      )}
    >
      {children}
    </div>
  )
}

