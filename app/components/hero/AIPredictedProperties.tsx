'use client'

import React from 'react'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { ShimmerCard } from '@/components/ui/ShimmerCard'
import { Lock, TrendingUp, MapPin, Home } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { openAuthModal } from '@/components/auth/AuthModal'

interface Property {
  id: string
  name: string
  location: string
  builder: string
  price: string
  imageUrl: string
  aiScore: number
}

export function AIPredictedProperties() {
  const [properties, setProperties] = React.useState<Property[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  React.useEffect(() => {
    // Check authentication status
    async function checkAuth() {
      try {
        // Check if window.supabase exists (from auth system)
        if (typeof window !== 'undefined' && (window as any).supabase) {
          const { data: { user } } = await (window as any).supabase.auth.getUser()
          setIsAuthenticated(!!user)
          
          if (user) {
            fetchAIPredictions()
          } else {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to check auth:', error)
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    if (typeof window !== 'undefined' && (window as any).supabase) {
      const { data: { subscription } } = (window as any).supabase.auth.onAuthStateChange((_event: any, session: any) => {
        setIsAuthenticated(!!session?.user)
        if (session?.user) {
          fetchAIPredictions()
        } else {
          setProperties([])
          setLoading(false)
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const fetchAIPredictions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai/predicted-properties', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Not logged in state
  if (!isAuthenticated && !loading) {
    return (
      <GlassContainer intensity="medium" className="p-8 h-full flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-white">
            AI-Powered Property Predictions
          </h3>
          <p className="text-white/70 max-w-sm">
            Log in to your account to get personalized property recommendations based on your preferences and budget
          </p>
          <button
            onClick={() => openAuthModal()}
            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Login to View Predictions
          </button>
        </div>
      </GlassContainer>
    )
  }

  // Loading state
  if (loading) {
    return (
      <GlassContainer intensity="medium" className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-white">AI Predictions for You</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-white/10 rounded-lg"></div>
          </div>
        ))}
      </GlassContainer>
    )
  }

  // Properties display
  return (
    <GlassContainer intensity="medium" className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-bold text-white">AI Predictions for You</h3>
      </div>
      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {properties.length === 0 ? (
          <div className="text-center py-8">
            <Home className="w-12 h-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/60">
              No predictions yet. Complete your profile to get personalized recommendations.
            </p>
          </div>
        ) : (
          properties.map((property) => (
            <ShimmerCard key={property.id}>
              <Link
                href={`/properties/${property.id}`}
                className="block p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              >
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                    {property.imageUrl ? (
                      <Image
                        src={property.imageUrl}
                        alt={property.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate mb-1">
                      {property.name}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-white/60 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{property.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-500 font-semibold">
                        {property.price}
                      </span>
                      <span className="text-xs text-white/50">
                        AI Score: {property.aiScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </ShimmerCard>
          ))
        )}
      </div>
    </GlassContainer>
  )
}

