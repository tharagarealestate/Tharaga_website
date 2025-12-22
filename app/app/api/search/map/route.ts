import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { lat, lng, radius } = await request.json();

    if (!lat || !lng || !radius) {
      return NextResponse.json({
        success: false,
        error: 'Missing lat, lng, or radius'
      }, { status: 400 });
    }

    // Use the RPC function to find properties within radius
    const { data: properties, error } = await supabase.rpc(
      'properties_within_radius',
      {
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: radius
      }
    );

    if (error) {
      console.error('Map search RPC error:', error);
      throw error;
    }

    // Get full property details
    const propertyIds = properties?.map((p: any) => p.property_id) || [];
    
    let fullProperties: any[] = [];
    
    if (propertyIds.length > 0) {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds)
        .eq('status', 'available');

      if (fetchError) {
        console.error('Property fetch error:', fetchError);
        throw fetchError;
      }

      fullProperties = data || [];
      
      // Add distance to each property
      const distanceMap = new Map(properties.map((p: any) => [p.property_id, p.distance_meters]));
      fullProperties = fullProperties.map(prop => ({
        ...prop,
        distance_meters: distanceMap.get(prop.id)
      }));
    }

    // Log map search
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('search_history').insert({
        user_id: user.id,
        query_type: 'map',
        search_lat: lat,
        search_lng: lng,
        search_radius: radius,
        results_count: fullProperties.length
      });
    }

    return NextResponse.json({
      success: true,
      properties: fullProperties,
      count: fullProperties.length
    });

  } catch (error: any) {
    console.error('Map search error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to search properties on map'
    }, { status: 500 });
  }
}


