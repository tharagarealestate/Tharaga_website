import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user preferences and budget from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('budget_min, budget_max, preferred_locations, bhk_preference')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { properties: [] },
        { status: 200 }
      )
    }

    // Build query for properties matching user preferences
    let query = supabase
      .from('properties')
      .select(`
        id,
        name,
        location,
        price,
        image_url,
        builder:builders(name),
        ai_score
      `)
      .order('ai_score', { ascending: false })
      .limit(5)

    // Apply budget filters if available
    if (profile.budget_min) {
      query = query.gte('price', profile.budget_min)
    }
    if (profile.budget_max) {
      query = query.lte('price', profile.budget_max)
    }

    // Apply location filters if available
    if (profile.preferred_locations && Array.isArray(profile.preferred_locations) && profile.preferred_locations.length > 0) {
      query = query.in('location', profile.preferred_locations)
    }

    const { data: properties, error: propertiesError } = await query

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError)
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      )
    }

    // Format response
    const formattedProperties = (properties || []).map((prop: any) => ({
      id: prop.id,
      name: prop.name || 'Property',
      location: prop.location || 'Location TBD',
      builder: prop.builder?.name || 'Unknown',
      price: prop.price ? `₹${(prop.price / 10000000).toFixed(2)}Cr` : 'Price on request',
      imageUrl: prop.image_url || '/placeholder-property.jpg',
      aiScore: prop.ai_score || 0,
    }))

    return NextResponse.json(
      { properties: formattedProperties },
      { status: 200 }
    )
  } catch (error) {
    console.error('AI Predictions API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

