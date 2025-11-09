"use client"

import { usePathname } from 'next/navigation'
import StaticHeaderHTML from './StaticHeaderHTML'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Only show header on homepage
  if (pathname === '/') {
    return <StaticHeaderHTML />
  }
  
  // Hide header on all subpages
  return null
}


