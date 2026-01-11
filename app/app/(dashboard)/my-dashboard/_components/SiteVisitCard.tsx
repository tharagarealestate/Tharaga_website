'use client'

import { Calendar } from 'lucide-react'
import Link from 'next/link'

interface SiteVisitCardProps {
  property: string
  date: string
  time: string
  status: 'confirmed' | 'pending'
  propertyId?: string
}

export function SiteVisitCard({
  property,
  date,
  time,
  status,
  propertyId
}: SiteVisitCardProps) {
  return (
    <Link href={propertyId ? `/properties/${propertyId}` : '#'}>
      <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all'>
        <div className='w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0'>
          <Calendar className='w-6 h-6 text-white' />
        </div>
        <div className='flex-1'>
          <h4 className='font-semibold text-gray-900 text-sm mb-1'>{property}</h4>
          <p className='text-xs text-gray-600'>{date} at {time}</p>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === 'confirmed'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {status}
        </div>
      </div>
    </Link>
  )
}
