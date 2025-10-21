"use client"

import * as React from 'react'
import clsx from 'clsx'

export interface SliderProps {
  value: [number, number] | number
  onValueChange?: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className }: SliderProps) {
  const [internal, setInternal] = React.useState<[number, number]>(
    Array.isArray(value) ? value : [Number(value) || min, Number(value) || max]
  )

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setInternal([value[0], value[1]])
    }
  }, [Array.isArray(value) ? value[0] : undefined, Array.isArray(value) ? value[1] : undefined])

  const onChangeMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next: [number, number] = [Number(e.target.value), internal[1]]
    if (next[0] > next[1]) next[0] = next[1]
    setInternal(next)
    onValueChange?.(next)
  }
  const onChangeMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next: [number, number] = [internal[0], Number(e.target.value)]
    if (next[1] < next[0]) next[1] = next[0]
    setInternal(next)
    onValueChange?.(next)
  }

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internal[0]}
          onChange={onChangeMin}
          className="w-full accent-[color:var(--color-accent)]"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internal[1]}
          onChange={onChangeMax}
          className="w-full accent-[color:var(--color-accent)]"
        />
      </div>
    </div>
  )
}
