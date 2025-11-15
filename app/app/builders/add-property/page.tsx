export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import AddPropertyPage from './AddPropertyClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AddPropertyPage />
    </Suspense>
  )
}

