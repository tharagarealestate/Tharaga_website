import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors when API key is not set
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const area = searchParams.get('area');

    if (!area) {
      return NextResponse.json({
        success: false,
        error: 'Area is required'
      }, { status: 400 });
    }

    // Get property data for the area
    const { data: properties } = await supabase
      .from('properties')
      .select('base_price, area_sqft, created_at, status')
      .ilike('area', `%${area}%`)
      .eq('status', 'available')
      .limit(100);

    if (!properties || properties.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No property data found for this area'
      }, { status: 404 });
    }

    // Calculate basic metrics
    const avgPricePerSqft = properties.reduce((sum, p) => {
      const pricePerSqft = (p.base_price || 0) / (p.area_sqft || 1);
      return sum + pricePerSqft;
    }, 0) / properties.length;

    // Use OpenAI for market insights
    if (process.env.OPENAI_API_KEY) {
      const prompt = `Analyze the real estate market for ${area} based on this data:

Properties: ${properties.length}
Average Price per Sqft: ₹${avgPricePerSqft.toFixed(0)}

Provide market analysis with:
1. priceGrowthRate: estimated annual growth rate (percentage)
2. demandLevel: "high" | "medium" | "low"
3. futurePotential: score 0-100 based on growth prospects
4. nearbyDevelopments: array of upcoming developments or infrastructure projects
5. investmentAdvice: brief investment recommendation

Return valid JSON only.`;

      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate market analyst. Provide data-driven insights. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');

      return NextResponse.json({
        success: true,
        area,
        averagePricePerSqft: Math.round(avgPricePerSqft),
        priceGrowthRate: analysis.priceGrowthRate || 5,
        demandLevel: analysis.demandLevel || 'medium',
        futurePotential: analysis.futurePotential || 60,
        nearbyDevelopments: analysis.nearbyDevelopments || [],
        investmentAdvice: analysis.investmentAdvice || 'Moderate potential for growth'
      });
    }

    // Fallback analysis
    return NextResponse.json({
      success: true,
      area,
      averagePricePerSqft: Math.round(avgPricePerSqft),
      priceGrowthRate: 5,
      demandLevel: 'medium',
      futurePotential: 60,
      nearbyDevelopments: [],
      investmentAdvice: 'Data analysis requires OpenAI API key'
    });

  } catch (error: any) {
    console.error('Market analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to analyze market'
    }, { status: 500 });
  }
}

