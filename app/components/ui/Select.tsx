"use client"

import * as React from 'react'
import clsx from 'clsx'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-border bg-canvas text-fg px-3 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-canvas focus-visible:ring-[color:var(--color-accent-muted)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})
