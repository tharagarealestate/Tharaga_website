"use client"

import * as React from 'react'
import { clsx } from 'clsx'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', ...props },
  ref,
) {
  const base = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold/60 disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<Required<ButtonProps>['variant'], string> = {
    primary: 'bg-deepBlue text-brandWhite hover:bg-deepBlue/90 shadow-subtle',
    secondary: 'bg-brandWhite text-deepBlue border border-deepBlue/20 hover:bg-deepBlue/5',
    ghost: 'bg-transparent text-deepBlue hover:bg-deepBlue/5',
  }
  const sizes: Record<Required<ButtonProps>['size'], string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  }
  return (
    <button ref={ref} className={clsx(base, variants[variant], sizes[size], className)} {...props} />
  )
})

