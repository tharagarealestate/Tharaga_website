"use client"

import * as React from 'react'
import clsx from 'clsx'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'invisible' | 'danger'
  size?: 'sm' | 'md'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', ...props },
  ref,
) {
  const base = 'inline-flex items-center justify-center rounded-md border font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants: Record<string, string> = {
    primary: 'bg-accent text-onEmphasis border-border hover:bg-accentEmphasis focus-visible:ring-[color:var(--color-accent-muted)]',
    secondary: 'bg-canvas text-fg border-border hover:bg-canvasSubtle',
    invisible: 'bg-transparent text-fg border-transparent hover:bg-canvasSubtle',
    danger: 'bg-dangerEmphasis text-onEmphasis border-border hover:brightness-110',
  }
  const sizes: Record<string, string> = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3 py-2',
  }
  return (
    <button ref={ref} className={clsx(base, variants[variant], sizes[size], className)} {...props} />
  )
})
