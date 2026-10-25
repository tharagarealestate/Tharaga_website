"use client"

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StandardSearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Standard Search Bar - Matches Leads Page Design
 * Gold border glow effect, consistent styling
 */
export function StandardSearchBar({ 
  placeholder = "Search...", 
  value, 
  onChange,
  className 
}: StandardSearchBarProps) {
  return (
    <div className={cn("relative flex-1 w-full lg:max-w-md", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:glow-border transition-all"
      />
    </div>
  )
}
