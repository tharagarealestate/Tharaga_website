import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use the get_search_suggestions RPC function
    const { data: suggestions, error } = await supabase.rpc(
      'get_search_suggestions',
      {
        p_query: query,
        p_limit: limit
      }
    );

    if (error) {
      console.error('Suggestions error:', error);
      // Fallback to direct query if RPC doesn't exist
      const { data: fallback } = await supabase
        .from('search_suggestions')
        .select('suggestion_text as suggestion, suggestion_type as type, display_text as display, icon')
        .eq('is_active', true)
        .ilike('suggestion_text', `%${query}%`)
        .order('priority', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(limit);

      return NextResponse.json({
        success: true,
        suggestions: fallback || []
      });
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions || []
    });

  } catch (error: any) {
    console.error('Search suggestions error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch suggestions',
      suggestions: []
    }, { status: 500 });
  }
}























































