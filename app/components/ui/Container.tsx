import * as React from 'react'
import { clsx } from 'clsx'

type Props = React.HTMLAttributes<HTMLDivElement>

export function Container({ className, ...props }: Props) {
  return <div className={clsx('container mx-auto', className)} {...props} />
}

