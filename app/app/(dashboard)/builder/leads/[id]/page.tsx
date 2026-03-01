"use client"

import { useParams, useRouter } from 'next/navigation'
import { LeadDetailModal } from './_components/LeadDetailModal'

export default function LeadDetailsPage() {
  const params = useParams() as { id: string }
  const router = useRouter()

  const handleClose = () => {
    router.push('/builder/leads')
  }

  return (
    <LeadDetailModal
      leadId={params.id}
      isOpen
      onClose={handleClose}
    />
  )
}
