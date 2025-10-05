"use client"

import * as React from 'react'
import clsx from 'clsx'

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-border bg-canvas text-fg placeholder:text-fgMuted px-3 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-canvas focus-visible:ring-[color:var(--color-accent-muted)]',
        className,
      )}
      {...props}
    />
  )
})
