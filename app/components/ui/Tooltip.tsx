"use client"

import * as React from 'react'

type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && (
        <div className="absolute z-20 -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64 rounded-md bg-fg text-onEmphasis text-sm p-3 shadow-card border border-borderMuted">
          {content}
        </div>
      )}
    </div>
  )
}

