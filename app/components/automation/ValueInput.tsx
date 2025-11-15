'use client'

import { useState } from 'react'

interface ValueInputProps {
  value?: any
  onChange: (value: any) => void
  fieldType?: string
  operator?: string
  disabled?: boolean
}

export function ValueInput({ value, onChange, fieldType, operator, disabled }: ValueInputProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || '')

  const handleChange = (newValue: string) => {
    setInputValue(newValue)
    
    // Parse value based on field type
    let parsedValue: any = newValue
    
    if (fieldType === 'number') {
      parsedValue = newValue ? Number(newValue) : null
    } else if (fieldType === 'boolean') {
      parsedValue = newValue === 'true'
    } else if (fieldType === 'array' || operator === 'in' || operator === 'not_in') {
      parsedValue = newValue.split(',').map(v => v.trim()).filter(v => v)
    } else if (fieldType === 'date') {
      parsedValue = newValue
    }
    
    onChange(parsedValue)
  }

  // Render appropriate input based on type
  if (fieldType === 'date') {
    return (
      <input
        type="date"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50"
      />
    )
  }

  if (fieldType === 'boolean') {
    return (
      <select
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50"
      >
        <option value="">Select...</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    )
  }

  return (
    <input
      type={fieldType === 'number' ? 'number' : 'text'}
      value={inputValue}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled}
      placeholder={operator === 'in' || operator === 'not_in' ? 'Comma-separated values' : 'Enter value'}
      className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50"
    />
  )
}

