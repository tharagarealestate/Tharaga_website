/**
 * Neighborhood Analysis API
 * Analyzes neighborhoods based on schools, hospitals, safety, and amenities
 * Tamil Nadu market-specific data
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface NeighborhoodInput {
  primary_priorities: string[]; // 'schools', 'hospitals', 'safety', 'parks', 'shopping', 'transport'
  family_type: 'young_couple' | 'family_with_kids' | 'retired' | 'single';
  preferred_localities?: string[];
  city?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      primary_priorities = [],
      family_type,
      preferred_localities = [],
      city = 'Chennai',
      use_advanced_ai = false,
      work_location,
    }: NeighborhoodInput & { use_advanced_ai?: boolean; work_location?: string } = body;

    if (!primary_priorities.length || !family_type) {
      return NextResponse.json(
        { error: 'Missing required fields: primary_priorities, family_type' },
        { status: 400 }
      );
    }

    // Tamil Nadu neighborhood data (Chennai, Coimbatore, Madurai)
    const neighborhoods = getTamilNaduNeighborhoods(city);

    // Score neighborhoods based on priorities
    const scoredNeighborhoods = neighborhoods.map(neighborhood => {
      let score = 0;
      const weights: Record<string, number> = {
        'schools': 25,
        'hospitals': 20,
        'safety': 20,
        'parks': 15,
        'shopping': 10,
        'transport': 10,
      };

      primary_priorities.forEach(priority => {
        if (neighborhood[priority as keyof typeof neighborhood] !== undefined) {
          score += (neighborhood[priority as keyof typeof neighborhood] as number) * (weights[priority] || 10);
        }
      });

      return {
        ...neighborhood,
        overall_score: parseFloat((score / 100).toFixed(1)),
        match_score: parseFloat((score / (primary_priorities.length * 25)).toFixed(1)),
      };
    });

    // Sort by match score
    scoredNeighborhoods.sort((a, b) => b.match_score - a.match_score);

    // Filter preferred localities if provided
    const topNeighborhoods = preferred_localities.length > 0
      ? scoredNeighborhoods.filter(n => preferred_localities.includes(n.name))
      : scoredNeighborhoods.slice(0, 5);

    // If advanced AI is requested, use advanced service
    if (use_advanced_ai) {
      try {
        const advancedUrl = new URL('/api/tools/advanced-neighborhood', request.url);
        const advancedResponse = await fetch(advancedUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primary_priorities,
            family_type,
            city,
            preferred_localities,
            work_location,
          }),
        });
        
        if (advancedResponse.ok) {
          const advancedData = await advancedResponse.json();
          return NextResponse.json({
            success: true,
            results: advancedData.results,
            ai_enhanced: true,
          });
        }
      } catch (aiError) {
        console.error('Advanced AI failed, using base calculations:', aiError);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        top_neighborhoods: topNeighborhoods,
        total_analyzed: neighborhoods.length,
        recommendations: generateRecommendations(topNeighborhoods, family_type),
      },
    });
  } catch (error: any) {
    console.error('Error analyzing neighborhoods:', error);
    return NextResponse.json(
      { error: 'Failed to analyze neighborhoods', details: error.message },
      { status: 500 }
    );
  }
}

function getTamilNaduNeighborhoods(city: string) {
  // Chennai neighborhoods
  if (city === 'Chennai') {
    return [
      {
        name: 'OMR (Perungudi-Thoraipakkam)',
        city: 'Chennai',
        schools: 9.2,
        hospitals: 8.5,
        safety: 8.9,
        parks: 7.5,
        shopping: 8.0,
        transport: 8.3,
        price_range: '₹7,500-9,500/sq.ft',
        highlights: [
          'Excellent CBSE schools (PSBB, Chettinad Vidyashram)',
          'Apollo OMR hospital 2km',
          'Safe gated communities',
          'IT corridor - easy commute',
        ],
      },
      {
        name: 'Indiranagar',
        city: 'Chennai',
        schools: 8.8,
        hospitals: 9.0,
        safety: 8.7,
        parks: 8.5,
        shopping: 9.0,
        transport: 8.0,
        price_range: '₹8,000-10,000/sq.ft',
        highlights: [
          'Top schools nearby',
          'Multiple hospitals (Apollo, MIOT)',
          'Good metro connectivity',
          'Shopping malls and markets',
        ],
      },
      {
        name: 'Koramangala',
        city: 'Chennai',
        schools: 8.5,
        hospitals: 8.8,
        safety: 8.5,
        parks: 8.0,
        shopping: 9.2,
        transport: 8.5,
        price_range: '₹7,000-9,000/sq.ft',
        highlights: [
          'Well-established area',
          'Good schools and hospitals',
          'Excellent shopping options',
        ],
      },
      {
        name: 'HSR Layout',
        city: 'Chennai',
        schools: 8.0,
        hospitals: 8.2,
        safety: 8.8,
        parks: 8.5,
        shopping: 8.3,
        transport: 7.8,
        price_range: '₹6,500-8,500/sq.ft',
        highlights: [
          'Family-friendly',
          'Good safety ratings',
          'Parks and recreational areas',
        ],
      },
      {
        name: 'Jayanagar',
        city: 'Chennai',
        schools: 9.0,
        hospitals: 8.5,
        safety: 9.0,
        parks: 8.2,
        shopping: 8.5,
        transport: 8.0,
        price_range: '₹7,500-9,500/sq.ft',
        highlights: [
          'Excellent schools',
          'Very safe area',
          'Good connectivity',
        ],
      },
    ];
  }

  // Coimbatore neighborhoods
  if (city === 'Coimbatore') {
    return [
      {
        name: 'Saravanampatti',
        city: 'Coimbatore',
        schools: 8.5,
        hospitals: 8.8,
        safety: 8.7,
        parks: 7.8,
        shopping: 8.0,
        transport: 7.5,
        price_range: '₹4,500-6,000/sq.ft',
        highlights: ['Good schools', 'Hospital proximity', 'Safe area'],
      },
      {
        name: 'Peelamedu',
        city: 'Coimbatore',
        schools: 8.2,
        hospitals: 8.5,
        safety: 8.5,
        parks: 8.0,
        shopping: 8.5,
        transport: 8.0,
        price_range: '₹4,200-5,800/sq.ft',
        highlights: ['Educational institutions', 'Shopping centers'],
      },
    ];
  }

  // Default (can be extended for other cities)
  return [];
}

function generateRecommendations(neighborhoods: any[], familyType: string): string[] {
  const recommendations: string[] = [];

  if (familyType === 'family_with_kids') {
    recommendations.push('Focus on areas with top-rated CBSE/Matriculation schools');
    recommendations.push('Consider proximity to parks and recreational facilities');
  }

  if (neighborhoods.length > 0) {
    recommendations.push(`${neighborhoods[0].name} scored highest for your priorities`);
  }

  return recommendations;
}













