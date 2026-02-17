import { NextRequest, NextResponse } from 'next/server';
import { PricingEngine } from '@/lib/pricing/pricing-engine';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { propertyCount } = await request.json();

    if (!propertyCount || propertyCount < 1) {
      return NextResponse.json(
        { error: 'Invalid property count' },
        { status: 400 }
      );
    }

    const engine = new PricingEngine();
    const plan = await engine.getRecommendedPlan(propertyCount);

    if (!plan) {
      return NextResponse.json(
        { error: 'No suitable plan found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.plan_name,
        slug: plan.plan_slug,
        propertyRange: {
          min: plan.min_properties,
          max: plan.max_properties
        },
        pricing: {
          monthly: engine.formatPrice(plan.monthly_price),
          yearly: engine.formatPrice(plan.yearly_price),
          monthlySavings: engine.formatPrice(
            (plan.monthly_price * 12 - plan.yearly_price)
          )
        },
        features: {
          teamMembers: plan.team_members_limit,
          support: plan.support_level,
          featuredListings: plan.featured_listings_per_month
        }
      }
    });

  } catch (error: any) {
    console.error('Recommend plan error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


