import * as React from 'react'
import clsx from 'clsx'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'success' | 'attention' | 'danger'
}

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  const tones: Record<string, string> = {
    default: 'bg-canvasSubtle text-fg border-border',
    success: 'bg-canvasSubtle text-success border-border',
    attention: 'bg-canvasSubtle text-attention border-border',
    danger: 'bg-canvasSubtle text-danger border-border',
  }
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', tones[tone], className)} {...props} />
  )
}
