"use client"

import * as React from 'react'
import clsx from 'clsx'

export interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('space-y-2', className)}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === RadioGroupItem) {
            return React.cloneElement(child as React.ReactElement<any>, {
              checked: child.props.value === value,
              onCheckedChange: () => onValueChange?.(child.props.value),
            })
          }
          return child
        })}
      </div>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'

export interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string
  checked?: boolean
  onCheckedChange?: () => void
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, checked, onCheckedChange, id, ...props }, ref) => {
    const inputId = id || `radio-${value}`
    return (
      <input
        type="radio"
        ref={ref}
        id={inputId}
        value={value}
        checked={checked}
        onChange={onCheckedChange}
        className={clsx(
          'w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 cursor-pointer',
          className
        )}
        {...props}
      />
    )
  }
)

RadioGroupItem.displayName = 'RadioGroupItem'

