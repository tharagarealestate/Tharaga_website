import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors when API key is not set
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

interface EnhancedSearchRequest {
  query: string;
  userContext?: {
    userId?: string;
    previousSearches?: any[];
    preferences?: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query, userContext }: EnhancedSearchRequest = await request.json();

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    // Use OpenAI to understand intent and extract entities
    const prompt = `You are an advanced real estate search assistant. Analyze this property search query and extract structured information.

Query: "${query}"
${userContext?.preferences ? `User preferences: ${JSON.stringify(userContext.preferences)}` : ''}

Extract and return a JSON object with:
1. intent_type: "property_search" | "location_query" | "price_inquiry" | "amenity_search" | "investment_analysis" | "comparison"
2. confidence: 0-1 score
3. entities: array of {type, value, confidence}
4. filters: object with budget_min, budget_max, city, area, bhk_type, property_type, amenities, possession_status
5. suggestions: array of helpful suggestions

Be smart about understanding Tamil-English mixed queries and common real estate terms.
Return ONLY valid JSON, no other text.`;

    if (!process.env.OPENAI_API_KEY) {
      // Fallback to basic processing if OpenAI key not set
      return NextResponse.json({
        success: true,
        intent: {
          type: 'property_search',
          confidence: 0.7,
          entities: [],
          filters: {},
          suggestions: []
        },
        message: 'OpenAI API key not configured, using basic processing'
      });
    }

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate search assistant that extracts structured information from natural language queries. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      intent: {
        type: result.intent_type || 'property_search',
        confidence: result.confidence || 0.7,
        entities: result.entities || [],
        filters: result.filters || {},
        suggestions: result.suggestions || []
      }
    });

  } catch (error: any) {
    console.error('Enhanced search error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process enhanced search'
    }, { status: 500 });
  }
}

