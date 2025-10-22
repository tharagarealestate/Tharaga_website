"use client"

import { HelpCircle } from 'lucide-react'
import { Tooltip } from './Tooltip'

type HelpTooltipProps = {
  children: React.ReactNode
  href?: string
  className?: string
}

export function HelpTooltip({ children, href, className }: HelpTooltipProps) {
  return (
    <Tooltip
      content={
        <div>
          <div className="text-sm">{children}</div>
          {href && (
            <a href={href} className="text-gold-500 block mt-2 text-xs">
              Learn more →
            </a>
          )}
        </div>
      }
    >
      <span className={className}>
        <HelpCircle className="inline w-4 h-4 text-gray-400 ml-1 align-middle" />
      </span>
    </Tooltip>
  )
}
