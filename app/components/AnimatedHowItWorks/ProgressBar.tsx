import React from 'react'
import { motion } from 'framer-motion'

export type ProgressBarProps = {
  step: number
  total: number
  onStepChange?: (s: number) => void
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ step, total, onStepChange }) => {
  const pct = ((step - 1) / (total - 1)) * 100
  return (
    <div className="mt-6 w-full" aria-label={`Step ${step} of ${total}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Step {step}/{total}</span>
        <div className="flex gap-1" role="tablist">
          {Array.from({ length: total }).map((_, idx) => {
            const active = idx + 1 === step
            return (
              <button
                key={idx}
                role="tab"
                tabIndex={0}
                aria-selected={active}
                onClick={() => onStepChange?.(idx + 1)}
                className={`h-2 w-8 rounded-sm ${active ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-400'}`}
              />
            )
          })}
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-gray-200">
        <motion.div
          className="h-1 rounded-full bg-gray-900"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
