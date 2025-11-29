"use client"

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export function FloatingLabelInput({
  label,
  error,
  helperText,
  className,
  value,
  defaultValue,
  ...props
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    
    const checkValue = () => {
      setHasValue(!!(input.value || input.value === '0'))
    }
    
    checkValue()
    input.addEventListener('input', checkValue)
    return () => input.removeEventListener('input', checkValue)
  }, [])

  useEffect(() => {
    if (value !== undefined) {
      setHasValue(!!value)
    } else if (defaultValue !== undefined) {
      setHasValue(!!defaultValue)
    }
  }, [value, defaultValue])

  const isFloating = isFocused || hasValue

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          {...props}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          className={cn(
            "peer w-full px-4 pt-6 pb-2 bg-white/80 backdrop-blur-sm border rounded-xl",
            "text-slate-900 placeholder-transparent",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500",
            error 
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/50" 
              : "border-slate-300",
            className
          )}
        />
        <label
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none",
            isFloating
              ? "top-2 text-xs font-medium text-slate-600"
              : "top-4 text-base text-slate-500",
            error && "text-red-600"
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  )
}

interface FloatingLabelTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helperText?: string
}

export function FloatingLabelTextarea({
  label,
  error,
  helperText,
  className,
  value,
  defaultValue,
  ...props
}: FloatingLabelTextareaProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const checkValue = () => {
      setHasValue(!!textarea.value)
    }
    
    checkValue()
    textarea.addEventListener('input', checkValue)
    return () => textarea.removeEventListener('input', checkValue)
  }, [])

  useEffect(() => {
    if (value !== undefined) {
      setHasValue(!!value)
    } else if (defaultValue !== undefined) {
      setHasValue(!!defaultValue)
    }
  }, [value, defaultValue])

  const isFloating = isFocused || hasValue

  return (
    <div className="relative w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          {...props}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          className={cn(
            "peer w-full px-4 pt-6 pb-2 bg-white/80 backdrop-blur-sm border rounded-xl",
            "text-slate-900 placeholder-transparent resize-none",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500",
            error 
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/50" 
              : "border-slate-300",
            className
          )}
        />
        <label
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none",
            isFloating
              ? "top-2 text-xs font-medium text-slate-600"
              : "top-4 text-base text-slate-500",
            error && "text-red-600"
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  )
}

