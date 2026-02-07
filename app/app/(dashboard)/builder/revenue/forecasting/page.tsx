'use client'

import { BuilderPageWrapper } from '../../_components/BuilderPageWrapper'
import { TrendingUp, Lock } from 'lucide-react'
import Link from 'next/link'

export default function RevenueForecastingPage() {
  return (
    <BuilderPageWrapper 
      title="Revenue Forecasting" 
      description="Predict future revenue based on pipeline and trends"
    >
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gold-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Revenue Forecasting</h2>
        <p className="text-gray-400 mb-6">AI-powered revenue predictions based on your pipeline</p>
        <p className="text-sm text-gray-500">This feature is coming soon</p>
      </div>
    </BuilderPageWrapper>
  )
}

