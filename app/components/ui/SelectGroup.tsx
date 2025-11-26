"use client"

import * as React from 'react'
import clsx from 'clsx'

// Simple Select component group matching shadcn/ui pattern
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-white/20 bg-white/5 text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ring-offset-transparent',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = 'Select'

export const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <option value="">{placeholder || 'Select...'}</option>
}

export const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ children, ...props }, ref) => {
  return (
    <option ref={ref} {...props}>
      {children}
    </option>
  )
})
SelectItem.displayName = 'SelectItem'







