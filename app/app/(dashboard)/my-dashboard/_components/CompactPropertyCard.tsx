'use client'

import Link from 'next/link'
import Image from 'next/image'

interface CompactPropertyCardProps {
  propertyId?: string
  image?: string
  title?: string
  location?: string
  price?: string
}

export function CompactPropertyCard({
  propertyId,
  image = '/property-thumb.jpg',
  title = 'Prestige Lakeside',
  location = 'Whitefield',
  price = '₹2.4 Cr'
}: CompactPropertyCardProps) {
  return (
    <Link href={propertyId ? `/properties/${propertyId}` : '/property-listing'}>
      <div className='flex-shrink-0 w-64 bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all cursor-pointer'>
        <div className='relative w-full h-32 mb-3 rounded-lg overflow-hidden'>
          <Image
            src={image}
            alt={title}
            fill
            sizes="256px"
            className='object-cover'
          />
        </div>
        <h4 className='font-semibold text-gray-900 text-sm mb-1'>{title}</h4>
        <p className='text-xs text-gray-600 mb-2'>{location}</p>
        <div className='text-lg font-bold text-gold-600'>{price}</div>
      </div>
    </Link>
  )
}
