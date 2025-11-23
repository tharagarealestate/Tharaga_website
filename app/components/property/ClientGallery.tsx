"use client"

import dynamic from 'next/dynamic'

const Gallery = dynamic(() => import('./Gallery').then(m => m.Gallery), { ssr: false })

export default function ClientGallery(props: any) {
  return <Gallery {...props} />
}

