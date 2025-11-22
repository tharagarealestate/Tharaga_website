import * as React from 'react'
import clsx from 'clsx'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return <div className={clsx('rounded-lg border border-border bg-canvas shadow-card p-4', className)} {...props} />
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={clsx('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: CardProps) {
  return <h3 className={clsx('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: CardProps) {
  return <p className={clsx('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={clsx('p-6 pt-0', className)} {...props} />
}