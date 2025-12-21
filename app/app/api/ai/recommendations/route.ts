import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { filters } = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Get user's search history and preferences
    const { data: searchHistory } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(20);

    // Get user's clicked properties (engagement data)
    const { data: userEngagement } = await supabase
      .from('search_history')
      .select('clicked_property_ids')
      .eq('user_id', userId)
      .not('clicked_property_ids', 'is', null);

    // Analyze preferences using OpenAI
    const preferences = analyzeUserPreferences(searchHistory || [], userEngagement || []);

    // Generate personalized recommendations
    if (process.env.OPENAI_API_KEY) {
      const prompt = `Based on user's search history and preferences, recommend properties.

User Preferences: ${JSON.stringify(preferences)}
Current Search Filters: ${JSON.stringify(filters)}

Generate 5 personalized property recommendations with:
1. Match reasons (why this property matches user preferences)
2. Match score (0-100)
3. Key features that align with user interests

Return JSON array of recommendations.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate recommendation engine. Return valid JSON array only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"recommendations": []}');
      return NextResponse.json({
        success: true,
        recommendations: result.recommendations || []
      });
    }

    // Fallback recommendations
    return NextResponse.json({
      success: true,
      recommendations: []
    });

  } catch (error: any) {
    console.error('Recommendations error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate recommendations'
    }, { status: 500 });
  }
}

function analyzeUserPreferences(searchHistory: any[], userEngagement: any[]): any {
  const preferences: any = {
    preferredLocations: [],
    preferredBHK: [],
    preferredPriceRange: { min: 0, max: Infinity },
    preferredAmenities: [],
    preferredPropertyTypes: []
  };

  // Analyze search history
  searchHistory.forEach(search => {
    if (search.filters) {
      if (search.filters.area) {
        preferences.preferredLocations.push(search.filters.area);
      }
      if (search.filters.bhk_type) {
        preferences.preferredBHK.push(search.filters.bhk_type);
      }
      if (search.filters.budget_max) {
        preferences.preferredPriceRange.max = Math.min(
          preferences.preferredPriceRange.max,
          search.filters.budget_max
        );
      }
    }
  });

  return preferences;
}

