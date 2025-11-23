'use client'

import { Heart, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface LuxuryPropertyCardProps {
  image: string
  title: string
  location: string
  price: string
  pricePerSqft: string
  bhk: string
  sqft: string
  matchScore: number
  tags: string[]
  propertyId?: string
}

export function LuxuryPropertyCard({
  image,
  title,
  location,
  price,
  pricePerSqft,
  bhk,
  sqft,
  matchScore,
  tags,
  propertyId
}: LuxuryPropertyCardProps) {
  return (
    <div className='group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2'>
      {/* Image */}
      <div className='relative h-56 overflow-hidden'>
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700'
        />
        {/* AI Match Badge */}
        <div className='absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold rounded-full backdrop-blur-sm shadow-lg flex items-center gap-2'>
          <Sparkles className='w-4 h-4' />
          {matchScore}% Match
        </div>

        {/* Heart Icon */}
        <button className='absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group/heart'>
          <Heart className='w-5 h-5 group-hover/heart:fill-current' />
        </button>

        {/* Tags */}
        <div className='absolute bottom-4 left-4 flex gap-2'>
          {tags.map((tag, i) => (
            <span key={i} className='px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-900 rounded-full'>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className='p-5'>
        <h3 className='text-lg font-bold text-gray-900 mb-1 group-hover:text-gold-600 transition-colors'>
          {title}
        </h3>
        <p className='text-sm text-gray-600 mb-4 flex items-center gap-1'>
          <MapPin className='w-4 h-4' />
          {location}
        </p>

        <div className='flex items-center justify-between mb-4 pb-4 border-b border-gray-100'>
          <div>
            <div className='text-2xl font-bold bg-gradient-to-r from-gold-600 to-gold-500 bg-clip-text text-transparent'>
              {price}
            </div>
            <div className='text-xs text-gray-500'>{pricePerSqft}/sqft</div>
          </div>

          <div className='text-right'>
            <div className='text-sm font-semibold text-gray-900'>{bhk}</div>
            <div className='text-xs text-gray-500'>{sqft} sqft</div>
          </div>
        </div>

        <Link
          href={propertyId ? `/properties/${propertyId}` : '/property-listing'}
          className='w-full py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all block text-center'
        >
          Schedule Visit
        </Link>
      </div>
    </div>
  )
}
