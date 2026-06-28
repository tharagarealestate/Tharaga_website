'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

export function Popover({
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(!!defaultOpen)
  const isControlled = typeof openProp === 'boolean'
  const open = isControlled ? (openProp as boolean) : uncontrolledOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, setOpen])

  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen])

  return (
    <PopoverContext.Provider value={value}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ asChild, children, className }: { asChild?: boolean; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    ctx.setOpen(!ctx.open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: React.MouseEvent) => {
        // @ts-expect-error - preserve child handler
        children.props?.onClick?.(e)
        handleClick(e)
      },
      className: cn(children.props?.className, className),
      'aria-haspopup': 'dialog',
      'aria-expanded': ctx.open,
    })
  }

  return (
    <button onClick={handleClick} className={cn(className)} aria-haspopup="dialog" aria-expanded={ctx.open}>
      {children}
    </button>
  )
}

export function PopoverContent({
  children,
  className,
  align = 'start',
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
}) {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) return null
  if (!ctx.open) return null

  const alignmentClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'

  return (
    <div
      role="dialog"
      className={cn(
        'absolute z-50 mt-2 min-w-[12rem] rounded-md border border-gray-200 bg-white p-2 shadow-lg focus:outline-none',
        alignmentClass,
        className
      )}
    >
      {children}
    </div>
  )
}
