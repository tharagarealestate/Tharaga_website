/**
 * Advanced Neighborhood Finder API
 * Uses AI-powered livability scoring and geospatial analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAdvancedNeighborhood } from '@/lib/services/advanced-ai-tools-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      primary_priorities,
      family_type,
      city,
      preferred_localities = [],
      work_location,
    } = body;

    if (!primary_priorities || !family_type || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get advanced AI-powered neighborhood analysis
    const advancedAnalysis = await analyzeAdvancedNeighborhood(
      primary_priorities,
      family_type,
      city,
      preferred_localities,
      work_location
    );

    return NextResponse.json({
      success: true,
      results: advancedAnalysis,
      ai_enhanced: true,
      models_used: ['GPT-4o', 'Geospatial AI', 'Livability Scoring ML'],
    });
  } catch (error: any) {
    console.error('Error in advanced neighborhood analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze neighborhoods', details: error.message },
      { status: 500 }
    );
  }
}



