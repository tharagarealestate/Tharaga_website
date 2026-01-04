import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Tamil to English translation mapping
const TAMIL_TRANSLATIONS: Record<string, string> = {
  'venum': 'want',
  'kaattunga': 'show',
  'irukka': 'is there',
  'close': 'near',
  'ku': 'to',
  'la': 'in',
  'budget': 'budget',
  'lakh': 'lakh',
  'crore': 'crore',
  'apartment': 'apartment',
  'house': 'house',
  'flat': 'flat'
};

function parseTamilQuery(transcript: string): {
  city?: string;
  area?: string;
  budget_min?: number;
  budget_max?: number;
  bhk_type?: string;
  property_type?: string;
} {
  const filters: any = {};
  const lowerTranscript = transcript.toLowerCase();

  // Extract city/area (common Chennai areas)
  const chennaiAreas = [
    'anna nagar', 'velachery', 't nagar', 'adyar', 'mylapore',
    'tambaram', 'chromepet', 'pallavaram', 'porur', 'ambattur',
    'omr', 'ecr', 'perungudi', 'navallur', 'sholinganallur'
  ];
  
  for (const area of chennaiAreas) {
    if (lowerTranscript.includes(area)) {
      filters.area = area;
      filters.city = 'Chennai';
      break;
    }
  }

  // Extract budget
  const budgetMatch = lowerTranscript.match(/(\d+)\s*(lakh|crore)/i);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1]);
    const unit = budgetMatch[2].toLowerCase();
    
    if (unit === 'lakh') {
      filters.budget_max = amount * 100000;
      filters.budget_min = Math.max(0, amount * 100000 - 2000000);
    } else if (unit === 'crore') {
      filters.budget_max = amount * 10000000;
      filters.budget_min = Math.max(0, amount * 10000000 - 5000000);
    }
  }

  // Extract BHK
  const bhkMatch = lowerTranscript.match(/(\d+)\s*bhk/i);
  if (bhkMatch) {
    filters.bhk_type = `${bhkMatch[1]}BHK`;
  }

  // Extract property type
  if (lowerTranscript.includes('apartment') || lowerTranscript.includes('flat')) {
    filters.property_type = 'apartment';
  } else if (lowerTranscript.includes('house') || lowerTranscript.includes('villa')) {
    filters.property_type = 'villa';
  }

  return filters;
}

function parseEnglishQuery(transcript: string): {
  city?: string;
  area?: string;
  budget_min?: number;
  budget_max?: number;
  bhk_type?: string;
  property_type?: string;
} {
  const filters: any = {};
  const lowerTranscript = transcript.toLowerCase();

  // Extract location
  const locationMatch = lowerTranscript.match(/in\s+([a-z\s]+?)(?:\s+under|\s+for|\s+with|$)/i);
  if (locationMatch) {
    const location = locationMatch[1].trim();
    // Check if it's a known city
    const cities = ['chennai', 'bangalore', 'hyderabad', 'mumbai', 'pune'];
    if (cities.some(city => location.includes(city))) {
      filters.city = location.charAt(0).toUpperCase() + location.slice(1);
    } else {
      filters.area = location;
    }
  }

  // Extract budget
  const budgetMatch = lowerTranscript.match(/under\s+(\d+)\s*(lakhs?|crores?)/i);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1]);
    const unit = budgetMatch[2].toLowerCase();
    
    if (unit.startsWith('lakh')) {
      filters.budget_max = amount * 100000;
    } else if (unit.startsWith('crore')) {
      filters.budget_max = amount * 10000000;
    }
  }

  // Extract BHK
  const bhkMatch = lowerTranscript.match(/(\d+)\s*bhk/i);
  if (bhkMatch) {
    filters.bhk_type = `${bhkMatch[1]}BHK`;
  }

  // Extract property type
  if (lowerTranscript.includes('apartment')) {
    filters.property_type = 'apartment';
  } else if (lowerTranscript.includes('villa')) {
    filters.property_type = 'villa';
  } else if (lowerTranscript.includes('plot')) {
    filters.property_type = 'plot';
  }

  return filters;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { transcript, language } = await request.json();

    if (!transcript || !language) {
      return NextResponse.json({
        success: false,
        error: 'Missing transcript or language'
      }, { status: 400 });
    }

    // Parse the transcript based on language
    const filters = language === 'tamil' 
      ? parseTamilQuery(transcript)
      : parseEnglishQuery(transcript);

    // Log voice search
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('voice_search_logs').insert({
      user_id: user?.id || null,
      raw_transcript: transcript,
      audio_language: language,
      parsed_filters: filters,
      filters_extracted: Object.keys(filters).length > 0,
      transcription_successful: true
    });

    // Log to search history
    if (user) {
      await supabase.from('search_history').insert({
        user_id: user.id,
        query_text: transcript,
        query_type: 'voice',
        voice_language: language,
        voice_transcript: transcript,
        filters: filters
      });
    }

    return NextResponse.json({
      success: true,
      filters,
      message: `Found ${Object.keys(filters).length} filters from your search`
    });

  } catch (error: any) {
    console.error('Voice search error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process voice search'
    }, { status: 500 });
  }
}























































