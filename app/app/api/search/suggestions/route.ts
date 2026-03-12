import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    // Public read — use anon key, no auth needed for suggestions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Pull active properties to generate suggestions from real data
    const { data: properties, error } = await supabase
      .from('properties')
      .select('title, city, locality, property_type, bedrooms, price_inr')
      .in('listing_status', ['active', 'available'])
      .not('city', 'is', null)
      .limit(500);

    if (error || !properties?.length) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    type Suggestion = { suggestion: string; type: string; display: string; icon: string };
    const suggestions: Suggestion[] = [];
    const seen = new Set<string>();

    const add = (suggestion: string, type: string, display: string, icon: string) => {
      const key = `${type}:${suggestion.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!query || suggestion.toLowerCase().includes(query)) {
        suggestions.push({ suggestion, type, display, icon });
      }
    };

    // Collect unique values
    const cities = new Set<string>();
    const localities = new Set<string>();
    const propertyTypes = new Set<string>();
    const bedroomCounts = new Set<number>();

    for (const p of properties) {
      if (p.city) cities.add(p.city);
      if (p.locality) localities.add(p.locality);
      if (p.property_type) propertyTypes.add(p.property_type);
      if (p.bedrooms) bedroomCounts.add(p.bedrooms);
    }

    // Cities (highest priority)
    for (const city of cities) add(city, 'city', city, 'map-pin');

    // Localities
    for (const loc of localities) add(loc, 'locality', loc, 'map-pin');

    // Property types
    for (const type of propertyTypes) {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      add(type, 'property_type', label, 'home');
    }

    // BHK options sorted
    for (const bdr of [...bedroomCounts].sort((a, b) => a - b)) {
      add(`${bdr} BHK`, 'bedroom', `${bdr} BHK Properties`, 'bed');
    }

    // Price ranges
    add('Under ₹50 Lakhs', 'price_range', 'Budget Properties', 'indian-rupee');
    add('₹50L – ₹1Cr', 'price_range', 'Mid-range Properties', 'indian-rupee');
    add('Above ₹1 Crore', 'price_range', 'Premium Properties', 'indian-rupee');

    // Title matches (only when query is long enough)
    if (query.length >= 3) {
      for (const p of properties) {
        if (p.title?.toLowerCase().includes(query)) {
          add(p.title, 'property', p.title, 'building');
        }
      }
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, limit),
    });
  } catch (error: any) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch suggestions', suggestions: [] },
      { status: 500 }
    );
  }
}
