'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick)
    }
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const context: DropdownMenuContextValue = React.useMemo(
    () => ({ open, setOpen, close: () => setOpen(false) }),
    [open]
  )

  return (
    <DropdownMenuContext.Provider value={context}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
}: {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    ctx.setOpen(!ctx.open)
  }

  if (asChild && React.isValidElement(children)) {
    const childProps = (children as React.ReactElement).props as any
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: React.MouseEvent) => {
        // Preserve child onClick
        childProps?.onClick?.(e)
        handleClick(e)
      },
      className: cn(childProps?.className, className),
      'aria-haspopup': 'menu',
      'aria-expanded': ctx.open,
    })
  }

  return (
    <button onClick={handleClick} className={cn(className)} aria-haspopup="menu" aria-expanded={ctx.open}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  className,
  align = 'start',
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
}) {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) return null
  if (!ctx.open) return null

  const alignmentClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'

  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-2 min-w-[12rem] rounded-md border border-amber-300/25 bg-slate-900/98 backdrop-blur-md p-1 shadow-xl shadow-black/50 focus:outline-none',
        alignmentClass,
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  className,
  asChild,
  onSelect,
}: {
  children: React.ReactNode
  className?: string
  asChild?: boolean
  onSelect?: () => void
}) {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) return null

  const handleClick = () => {
    onSelect?.()
    ctx.close()
  }

  const baseClasses = cn(
    'flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm text-white hover:bg-amber-500/20 hover:text-amber-300 focus:bg-amber-500/20 focus:text-amber-300 focus:outline-none transition-all duration-200',
    className
  )

  if (asChild && React.isValidElement(children)) {
    const childProps = (children as React.ReactElement).props as any
    return React.cloneElement(children as React.ReactElement, {
      className: cn(childProps?.className, baseClasses),
      onClick: (e: React.MouseEvent) => {
        childProps?.onClick?.(e)
        handleClick()
      },
      role: 'menuitem',
    })
  }

  return (
    <div className={baseClasses} role="menuitem" onClick={handleClick}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-amber-300/20" role="separator" />
}
