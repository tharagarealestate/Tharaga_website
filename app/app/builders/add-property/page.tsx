export const dynamic = 'force-dynamic'
import dynamic from 'next/dynamic'

const AddPropertyPage = dynamic(() => import('./AddPropertyClient'), { ssr: false })

export default function Page() {
  return <AddPropertyPage />
}

