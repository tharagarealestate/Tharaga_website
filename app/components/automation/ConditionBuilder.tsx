'use client'

import { useState } from 'react'
import { ConditionGroup } from './ConditionGroup'
import { Condition } from '@/lib/automation/triggers/triggerEvaluator'

interface ConditionBuilderProps {
  value?: Condition
  onChange: (condition: Condition) => void
  disabled?: boolean
}

export function ConditionBuilder({ value, onChange, disabled }: ConditionBuilderProps) {
  const [rootCondition, setRootCondition] = useState<Condition>(
    value || { and: [] }
  )

  const handleChange = (newCondition: Condition) => {
    setRootCondition(newCondition)
    onChange(newCondition)
  }

  // Determine if root is AND or OR
  const rootLogic = rootCondition.and ? 'and' : rootCondition.or ? 'or' : 'and'
  const rootConditions = rootCondition[rootLogic] || []

  if (rootConditions.length === 0 && !rootCondition.field) {
    // Empty condition - show initial state
    return (
      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
        <ConditionGroup
          condition={{ and: [] }}
          onChange={(cond) => {
            const newRoot = { and: cond.and || [] }
            handleChange(newRoot)
          }}
          logic="and"
          disabled={disabled}
        />
      </div>
    )
  }

  // If root has a single field condition, wrap it
  if (rootCondition.field) {
    return (
      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
        <ConditionGroup
          condition={{ and: [rootCondition] }}
          onChange={(cond) => {
            if (cond.and && cond.and.length === 1) {
              handleChange(cond.and[0])
            } else {
              handleChange(cond)
            }
          }}
          logic="and"
          disabled={disabled}
        />
      </div>
    )
  }

  // Root is a group
  return (
    <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
      <ConditionGroup
        condition={rootCondition}
        onChange={handleChange}
        logic={rootLogic}
        disabled={disabled}
      />
    </div>
  )
}









