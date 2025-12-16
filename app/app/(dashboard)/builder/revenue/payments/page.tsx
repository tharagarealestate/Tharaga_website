'use client'

import { BuilderPageWrapper } from '../../_components/BuilderPageWrapper'
import { CreditCard, Lock } from 'lucide-react'
import Link from 'next/link'

export default function RevenuePaymentsPage() {
  return (
    <BuilderPageWrapper 
      title="Payment History" 
      description="View and manage your payment transactions"
    >
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-gold-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment History</h2>
        <p className="text-gray-400 mb-6">View all your payment transactions and invoices</p>
        <p className="text-sm text-gray-500">This feature is coming soon</p>
      </div>
    </BuilderPageWrapper>
  )
}
