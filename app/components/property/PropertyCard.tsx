'use client';

import { Property } from '@/types/property';
import { Heart, MapPin, Bed, Maximize, TrendingUp, Shield, Eye } from 'lucide-react';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface PropertyCardProps {
  property: Property;
  onFavoriteToggle?: (propertyId: string, isFavorited: boolean) => void;
  showBuilder?: boolean;
  layout?: 'grid' | 'list';
}

export function PropertyCard({ 
  property, 
  onFavoriteToggle, 
  showBuilder = true,
  layout = 'grid'
}: PropertyCardProps) {
  const supabase = getSupabase();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Format price (₹45.5L, ₹1.2Cr)
  const formatPrice = (price: number): string => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Calculate days since listing
  const daysSinceListing = Math.floor(
    (new Date().getTime() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?redirect=/property-listing');
        return;
      }

      if (isFavorited) {
        // Remove favorite
        await supabase
          .from('property_favorites')
          .delete()
          .eq('property_id', property.id)
          .eq('user_id', user.id);
        
        setIsFavorited(false);
        onFavoriteToggle?.(property.id, false);
      } else {
        // Add favorite
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

  const handleCardClick = () => {
    // Track view
    trackPropertyView();
    // Navigate to detail page
    router.push(`/property/${property.slug || property.id}`);
  };

  const trackPropertyView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);

      await supabase.from('property_views').insert({
        property_id: property.id,
        user_id: user?.id || null,
        session_id: sessionId,
        source: 'search',
        device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });

      // Increment view count
      await supabase.rpc('increment_property_views', { property_id: property.id });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const getAppreciationBadge = () => {
    if (!property.ai_appreciation_band) return null;

    const config = {
      low: { color: 'bg-slate-100 text-slate-700', icon: '📉', text: 'Low Growth' },
      medium: { color: 'bg-amber-100 text-amber-700', icon: '📊', text: 'Medium Growth' },
      high: { color: 'bg-emerald-100 text-emerald-700', icon: '📈', text: 'High Growth' }
    };

    const badge = config[property.ai_appreciation_band];

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </div>
    );
  };

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        onClick={handleCardClick}
        className="bg-slate-800/95 rounded-xl transition-all duration-300 cursor-pointer border-2 border-amber-300 overflow-hidden flex flex-col sm:flex-row hover:bg-slate-700/70"
      >
        {/* Image Section */}
        <div className="relative sm:w-80 h-64 sm:h-auto flex-shrink-0">
          <Image
            src={property.thumbnail_url || property.images[0] || '/placeholder-property.jpg'}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 320px"
          />
          
          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {daysSinceListing <= 7 && (
              <span className="px-2 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
                NEW
              </span>
            )}
            {property.rera_verified && (
              <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                RERA
              </span>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className="absolute top-3 right-3 p-2 bg-slate-800/95 rounded-full hover:bg-slate-700/90 transition-colors border-2 border-amber-300 z-10"
            aria-label="Add to favorites"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-200'}`} 
            />
          </button>

          {/* View Count */}
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-slate-900/80 text-white text-xs rounded-full flex items-center gap-1 border border-amber-300/50">
            <Eye className="w-3 h-3" />
            {property.view_count}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
                {property.title}
              </h3>
              <div className="flex items-center text-sm text-slate-200 gap-1">
                <MapPin className="w-4 h-4 text-slate-300" />
                <span>{property.address}, {property.city}</span>
              </div>
            </div>
            {getAppreciationBadge()}
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-3xl font-semibold text-amber-300">
              {formatPrice(property.base_price)}
              {property.negotiable && (
                <span className="text-sm text-slate-300 font-normal ml-2">Negotiable</span>
              )}
            </div>
            {property.price_per_sqft && (
              <div className="text-sm text-slate-300">
                ₹{property.price_per_sqft.toLocaleString('en-IN')}/sqft
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1 text-slate-200">
              <Bed className="w-5 h-5 text-slate-400" />
              <span className="font-semibold">{property.bhk_type}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-200">
              <Maximize className="w-5 h-5 text-slate-400" />
              <span className="font-semibold">{property.carpet_area} sqft</span>
            </div>
            <div className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-200 font-medium border border-amber-300/30">
              {property.possession_status === 'ready-to-move' ? 'Ready to Move' : 'Under Construction'}
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-4">
            {property.amenities.slice(0, 6).map((amenity) => (
              <span 
                key={amenity} 
                className="px-2 py-1 bg-slate-700/50 text-slate-200 text-xs rounded border border-amber-300/30"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 6 && (
              <span className="px-2 py-1 text-slate-400 text-xs">
                +{property.amenities.length - 6} more
              </span>
            )}
          </div>

          {/* Builder Info */}
          {showBuilder && property.builder && (
            <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
              {property.builder.logo_url && (
                <Image
                  src={property.builder.logo_url}
                  alt={property.builder.company_name}
                  width={40}
                  height={40}
                  className="rounded-lg border border-amber-300/30"
                />
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  {property.builder.company_name}
                </div>
                {property.builder.verified && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified Builder
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/property/${property.slug || property.id}#contact`);
                }}
                className="px-4 py-2 bg-amber-300 text-slate-900 text-sm font-medium rounded-lg hover:bg-amber-200 transition-all border-2 border-amber-300"
              >
                Contact
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Grid Layout (Default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      className="bg-slate-800/95 rounded-xl transition-all duration-300 cursor-pointer border-2 border-amber-300 overflow-hidden hover:bg-slate-700/70"
    >
      {/* Image Section */}
      <div className="relative h-56">
        <Image
          src={property.thumbnail_url || property.images[0] || '/placeholder-property.jpg'}
          alt={property.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {daysSinceListing <= 7 && (
            <span className="px-2 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
              NEW
            </span>
          )}
          {property.rera_verified && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              RERA
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className="absolute top-3 right-3 p-2 bg-slate-800/95 rounded-full hover:bg-slate-700/90 transition-colors z-10 border-2 border-amber-300"
          aria-label="Add to favorites"
        >
          <Heart 
            className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-200'}`} 
          />
        </button>

        {/* View Count */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-slate-900/80 text-white text-xs rounded-full flex items-center gap-1 border border-amber-300/50">
          <Eye className="w-3 h-3" />
          {property.view_count}
        </div>

        {/* Appreciation Badge */}
        <div className="absolute bottom-3 left-3">
          {getAppreciationBadge()}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem]">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-sm text-slate-200 mb-3 gap-1">
          <MapPin className="w-4 h-4 flex-shrink-0 text-slate-300" />
          <span className="truncate">{property.address}, {property.city}</span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="text-2xl font-semibold text-amber-300">
            {formatPrice(property.base_price)}
          </div>
          {property.price_per_sqft && (
            <div className="text-xs text-slate-300">
              ₹{property.price_per_sqft.toLocaleString('en-IN')}/sqft
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-1 text-slate-200">
            <Bed className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold">{property.bhk_type}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-200">
            <Maximize className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold">{property.carpet_area} sqft</span>
          </div>
        </div>

        {/* Amenities Preview */}
        <div className="flex flex-wrap gap-1 mb-3">
          {property.amenities.slice(0, 3).map((amenity) => (
            <span 
              key={amenity} 
              className="px-2 py-0.5 bg-slate-700/50 text-slate-200 text-xs rounded border border-amber-300/30"
            >
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="px-2 py-0.5 text-slate-400 text-xs">
              +{property.amenities.length - 3}
            </span>
          )}
        </div>

        {/* Builder Info */}
        {showBuilder && property.builder && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2">
              {property.builder.logo_url && (
                <Image
                  src={property.builder.logo_url}
                  alt={property.builder.company_name}
                  width={32}
                  height={32}
                  className="rounded border border-amber-300/30"
                />
              )}
              <div className="text-xs text-slate-200 truncate max-w-[120px]">
                {property.builder.company_name}
              </div>
            </div>
            {property.builder.verified && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Verified</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

