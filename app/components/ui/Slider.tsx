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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

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
    <div className={clsx('w-full relative', className)}>
      <div className="relative h-2 bg-gray-200 rounded-full">
        {/* Active range track */}
        <div
          className="absolute h-2 bg-indigo-500 rounded-full"
          style={{
            left: `${((internal[0] - min) / (max - min)) * 100}%`,
            width: `${((internal[1] - internal[0]) / (max - min)) * 100}%`,
          }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internal[0]}
          onChange={onChangeMin}
          className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
          style={{
            background: 'transparent',
          }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internal[1]}
          onChange={onChangeMax}
          className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
          style={{
            background: 'transparent',
          }}
        />
        {/* Visual thumbs */}
        <div
          className="absolute w-4 h-4 bg-indigo-600 rounded-full shadow-md border-2 border-white -top-1 z-30"
          style={{
            left: `calc(${((internal[0] - min) / (max - min)) * 100}% - 8px)`,
          }}
        />
        <div
          className="absolute w-4 h-4 bg-indigo-600 rounded-full shadow-md border-2 border-white -top-1 z-30"
          style={{
            left: `calc(${((internal[1] - min) / (max - min)) * 100}% - 8px)`,
          }}
        />
      </div>
    </div>
  )
}
