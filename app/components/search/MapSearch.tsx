'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Navigation, Home, School, Hospital, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Property {
  id: string;
  title: string;
  base_price: number;
  thumbnail_url?: string;
  bhk_type: string;
  latitude: number;
  longitude: number;
  area: string;
  city: string;
}

export function MapSearch() {
  const router = useRouter();
  const [center, setCenter] = useState({ lat: 13.0827, lng: 80.2707 }); // Chennai default
  const [radius, setRadius] = useState(5000); // 5km default
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const googleMapsScriptRef = useRef<boolean>(false);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !googleMapsScriptRef.current) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
      googleMapsScriptRef.current = true;
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setCenter(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  const searchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: center.lat,
          lng: center.lng,
          radius: radius
        })
      });

      const data = await response.json();
      if (data.success) {
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Map search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [center, radius]);

  useEffect(() => {
    if (mapLoaded) {
      searchProperties();
    }
  }, [searchProperties, mapLoaded]);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && typeof window !== 'undefined' && window.google) {
      const mapContainer = document.getElementById('map-container');
      if (mapContainer && !mapRef.current) {
        mapRef.current = new window.google.maps.Map(mapContainer, {
          center: center,
          zoom: 13,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Center marker
        new window.google.maps.Marker({
          position: center,
          map: mapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#1e40af',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Search radius circle
        new window.google.maps.Circle({
          center: center,
          radius: radius,
          map: mapRef.current,
          fillColor: '#D4AF37',
          fillOpacity: 0.1,
          strokeColor: '#D4AF37',
          strokeOpacity: 0.3,
          strokeWeight: 2
        });

        // Map click handler
        mapRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            setCenter({
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            });
          }
        });
      }
    }
  }, [mapLoaded, center, radius]);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const useMyLocation = () => {
    if (userLocation) {
      setCenter(userLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setCenter(location);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Use My Location */}
          <button
            onClick={useMyLocation}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <Navigation className="w-5 h-5" />
            Use My Location
          </button>

          {/* Radius Selector */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Radius: {radius / 1000}km
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1km</span>
              <span>10km</span>
              <span>20km</span>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-center bg-blue-50 rounded-xl px-4 py-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1e40af]">
                {properties.length}
              </div>
              <div className="text-sm text-slate-600">Properties Found</div>
            </div>
          </div>
        </div>

        {/* Nearby Amenities Toggle */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-700">Show nearby:</span>
          <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1">
            <School className="w-4 h-4" />
            Schools
          </button>
          <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-1">
            <Hospital className="w-4 h-4" />
            Hospitals
          </button>
          <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Metro
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative">
        <div id="map-container" className="w-full h-[600px] rounded-xl" />
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <Loader2 className="w-8 h-8 text-[#1e40af] animate-spin" />
          </div>
        )}

        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#1e40af] animate-spin mx-auto mb-2" />
              <p className="text-slate-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Properties in Selected Area
        </h3>
        
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No properties found in this area</p>
            <p className="text-sm text-slate-500 mt-1">Try increasing the search radius</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/properties/${property.id}`)}
              >
                {property.thumbnail_url && (
                  <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={property.thumbnail_url}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h4 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                  {property.title}
                </h4>
                <div className="text-sm text-slate-600 mb-2">
                  {property.bhk_type} • {property.area}
                </div>
                <div className="text-lg font-bold text-[#1e40af]">
                  {formatPrice(property.base_price)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}























































