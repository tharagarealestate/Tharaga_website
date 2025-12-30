import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { filters, sort_by = 'relevance', page = 1, limit = 20 } = await request.json();

    if (!filters || typeof filters !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Filters object is required'
      }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Use the search_properties RPC function
    const { data: results, error } = await supabase.rpc(
      'search_properties',
      {
        p_filters: filters,
        p_sort_by: sort_by,
        p_limit: limit,
        p_offset: offset
      }
    );

    if (error) {
      console.error('Advanced search RPC error:', error);
      throw error;
    }

    // Get full property details
    const propertyIds = results?.map((r: any) => r.property_id) || [];
    
    let properties: any[] = [];
    
    if (propertyIds.length > 0) {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select(`
          *,
          builder:profiles!builder_id(id, company_name, avatar_url)
        `)
        .in('id', propertyIds)
        .eq('status', 'available');

      if (fetchError) {
        console.error('Property fetch error:', fetchError);
        throw fetchError;
      }

      properties = data || [];

      // Sort by relevance score
      const scoreMap = new Map(results.map((r: any) => [r.property_id, r.relevance_score]));
      properties = properties.sort((a, b) => {
        const scoreA = scoreMap.get(a.id) || 0;
        const scoreB = scoreMap.get(b.id) || 0;
        return scoreB - scoreA;
      });
    }

    // Log search
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('search_history').insert({
        user_id: user.id,
        query_type: 'filter',
        filters: filters,
        results_count: properties.length
      });

      // Update popular searches
      const searchTerms: string[] = [];
      if (filters.city) searchTerms.push(filters.city);
      if (filters.area) searchTerms.push(filters.area);
      if (filters.bhk_types && Array.isArray(filters.bhk_types)) {
        searchTerms.push(...filters.bhk_types);
      }
      
      for (const term of searchTerms) {
        try {
          await supabase.rpc('increment_search_count', { p_search_term: term });
        } catch (err) {
          // Silently fail if RPC doesn't exist yet
          console.warn('Failed to increment search count:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      properties: properties,
      total: properties.length,
      page,
      limit
    });

  } catch (error: any) {
    console.error('Advanced search error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to search properties'
    }, { status: 500 });
  }
}


































