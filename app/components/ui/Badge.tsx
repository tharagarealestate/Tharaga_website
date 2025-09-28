import * as React from 'react'
import { clsx } from 'clsx'

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'brand' | 'neutral' | 'success' | 'warning'
}

export function Badge({ className, tone = 'brand', ...props }: Props) {
  const tones: Record<Required<Props>['tone'], string> = {
    brand: 'bg-gold/15 text-deepBlue border-gold/50',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium', tones[tone], className)} {...props} />
  )
}

