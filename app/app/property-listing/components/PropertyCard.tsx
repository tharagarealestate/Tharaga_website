'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Ruler, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { formatIndianCurrency } from '@/lib/utils/currency';

interface PropertyCardProps {
  property: any;
  viewType: 'list' | 'grid';
}

export default function PropertyCard({ property, viewType }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = property.images || property.image_urls || ['/placeholder-property.jpg'];
  const imageUrl = Array.isArray(images) ? images[currentImageIndex] || images[0] : images;

  if (viewType === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative md:w-96 h-64 md:h-auto flex-shrink-0">
            <Link href={`/properties/${property.id}`}>
              <Image
                src={imageUrl}
                alt={property.title || property.name || 'Property'}
                fill
                className="object-cover"
                unoptimized
              />
            </Link>
            
            {/* Image Navigation Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-gray-700'
                }`}
              />
            </button>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {property.verified && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {property.featured && (
                <Badge className="bg-yellow-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="flex-1 p-6">
            <div className="flex flex-col h-full">
              {/* Top Section */}
              <div className="flex-1">
                <Link href={`/properties/${property.id}`}>
                  <h3 className="text-xl font-semibold mb-2 hover:text-indigo-600 transition-colors line-clamp-2">
                    {property.title || property.name || 'Property'}
                  </h3>
                </Link>

                <div className="flex items-center gap-1 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {property.locality || ''}, {property.city || ''}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {(property.bhk || property.bedrooms) && (
                    <div className="flex items-center gap-1 text-gray-700">
                      <Bed className="w-4 h-4" />
                      <span className="text-sm font-medium">{property.bhk || property.bedrooms} BHK</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1 text-gray-700">
                      <Bath className="w-4 h-4" />
                      <span className="text-sm font-medium">{property.bathrooms} Bath</span>
                    </div>
                  )}
                  {(property.area_sqft || property.area || property.sqft) && (
                    <div className="flex items-center gap-1 text-gray-700">
                      <Ruler className="w-4 h-4" />
                      <span className="text-sm font-medium">{property.area_sqft || property.area || property.sqft} sqft</span>
                    </div>
                  )}
                </div>

                {property.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {property.description}
                  </p>
                )}

                {/* Amenities */}
                {property.amenities && (Array.isArray(property.amenities) ? property.amenities : []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(Array.isArray(property.amenities) ? property.amenities : []).slice(0, 4).map((amenity: string) => (
                      <Badge key={amenity} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{property.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Section */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatIndianCurrency(property.price || property.price_inr || property.priceINR || 0)}
                  </div>
                  {property.ai_score && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>AI Score: {property.ai_score}/100</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Schedule Visit
                  </Button>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Contact Builder
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // GRID VIEW
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow group">
      {/* Image Section */}
      <div className="relative h-64">
        <Link href={`/properties/${property.id}`}>
          <Image
            src={imageUrl}
            alt={property.title || property.name || 'Property'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </Link>

        {/* Image Navigation Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_: any, index: number) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-gray-700'
            }`}
          />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {property.verified && (
            <Badge className="bg-green-500 text-white text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {property.featured && (
            <Badge className="bg-yellow-500 text-white text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-white text-2xl font-bold">
            {formatIndianCurrency(property.price || property.price_inr || property.priceINR || 0)}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4">
        <Link href={`/properties/${property.id}`}>
          <h3 className="text-lg font-semibold mb-2 hover:text-indigo-600 transition-colors line-clamp-2">
            {property.title || property.name || 'Property'}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {property.locality || ''}, {property.city || ''}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {(property.bhk || property.bedrooms) && (
            <div className="flex items-center gap-1 text-gray-700">
              <Bed className="w-4 h-4" />
              <span className="text-sm">{property.bhk || property.bedrooms} BHK</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1 text-gray-700">
              <Bath className="w-4 h-4" />
              <span className="text-sm">{property.bathrooms}</span>
            </div>
          )}
          {(property.area_sqft || property.area || property.sqft) && (
            <div className="flex items-center gap-1 text-gray-700">
              <Ruler className="w-4 h-4" />
              <span className="text-sm">{property.area_sqft || property.area || property.sqft} sqft</span>
            </div>
          )}
        </div>

        {property.ai_score && (
          <div className="flex items-center gap-1 text-sm text-green-600 mb-4">
            <TrendingUp className="w-4 h-4" />
            <span>AI Score: {property.ai_score}/100</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1">
            Visit
          </Button>
          <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

