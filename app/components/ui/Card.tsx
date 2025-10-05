import * as React from 'react'
import clsx from 'clsx'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return <div className={clsx('rounded-lg border border-border bg-canvas shadow-card p-4', className)} {...props} />
}
