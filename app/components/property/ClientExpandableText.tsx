"use client"

import dynamic from 'next/dynamic'

const ExpandableText = dynamic(() => import('./ExpandableText').then(m => m.ExpandableText), { ssr: false })

export default function ClientExpandableText(props: any) {
  return <ExpandableText {...props} />
}



