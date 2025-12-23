'use client';

import Image from 'next/image';
import { Heart, Share2, MapPin, Bed, Maximize, Shield, Eye } from 'lucide-react';
import Link from 'next/link';
import { Property } from '@/types/property';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MobilePropertyCardProps {
  property: Property;
  onFavoriteToggle?: (propertyId: string, isFavorited: boolean) => void;
}

export function MobilePropertyCard({ property, onFavoriteToggle }: MobilePropertyCardProps) {
  const router = useRouter();
  const supabase = getSupabase();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const daysSinceListing = Math.floor(
    (new Date().getTime() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?redirect=/property-listing');
        return;
      }

      if (isFavorited) {
        await supabase
          .from('property_favorites')
          .delete()
          .eq('property_id', property.id)
          .eq('user_id', user.id);
        
        setIsFavorited(false);
        onFavoriteToggle?.(property.id, false);
      } else {
        await supabase
          .from('property_favorites')
          .insert({
            property_id: property.id,
            user_id: user.id
          });
        
        setIsFavorited(true);
        onFavoriteToggle?.(property.id, true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSharing(true);

    try {
      const shareData = {
        title: property.title,
        text: `Check out this property: ${property.title} - ${formatPrice(property.base_price)}`,
        url: `${window.location.origin}/property/${property.slug || property.id}`
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        // You could show a toast here
      }
    } catch (error) {
      // User cancelled or error occurred
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Link href={`/property/${property.slug || property.id}`} className="block">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden active:scale-[0.98] transition-transform touch-manipulation">
        {/* Image */}
        <div className="relative aspect-[16/10]">
          <Image
            src={property.thumbnail_url || property.images[0] || '/placeholder-property.jpg'}
            alt={property.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {daysSinceListing <= 7 && (
              <span className="px-3 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full shadow-md">
                NEW
              </span>
            )}
            {property.rera_verified && (
              <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md">
                <Shield className="w-3 h-3" />
                RERA
              </span>
            )}
          </div>

          {/* Actions - Top Right */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full active:scale-95 transition-all shadow-md touch-manipulation"
              aria-label="Add to favorites"
            >
              <Heart 
                className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-700'}`} 
              />
            </button>
            <button
              onClick={handleShareClick}
              disabled={isSharing}
              className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full active:scale-95 transition-all shadow-md touch-manipulation"
              aria-label="Share property"
            >
              <Share2 className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* Price Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="px-4 py-2 bg-black/70 backdrop-blur-sm text-white rounded-full font-bold text-lg shadow-lg">
              {formatPrice(property.base_price)}
            </div>
          </div>

          {/* View Count - Bottom Right */}
          <div className="absolute bottom-3 right-3 z-10">
            <div className="px-2.5 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1.5 shadow-md">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-semibold">{property.view_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 leading-tight">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-slate-600 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span className="text-sm line-clamp-1">{property.address}, {property.city}</span>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-4 text-sm text-slate-700 mb-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">{property.bhk_type || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">{property.carpet_area} sqft</span>
            </div>
            {property.price_per_sqft && (
              <div className="text-xs text-slate-500 ml-auto">
                ₹{property.price_per_sqft.toLocaleString('en-IN')}/sqft
              </div>
            )}
          </div>

          {/* Amenities Preview */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.slice(0, 3).map((amenity) => (
                <span 
                  key={amenity} 
                  className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium"
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="px-2 py-1 text-slate-500 text-xs">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Builder Info */}
          {property.builder && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
              {property.builder.logo_url && (
                <Image
                  src={property.builder.logo_url}
                  alt={property.builder.company_name}
                  width={32}
                  height={32}
                  className="rounded-lg border border-slate-200"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {property.builder.company_name}
                </div>
                {property.builder.verified && (
                  <div className="text-xs text-emerald-600 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified Builder
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}






