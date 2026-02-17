import { NextRequest, NextResponse } from 'next/server';
import { PricingEngine } from '@/lib/pricing/pricing-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const engine = new PricingEngine();
    const plans = await engine.getAllPlans();

    return NextResponse.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.plan_name,
        slug: plan.plan_slug,
        propertyRange: {
          min: plan.min_properties,
          max: plan.max_properties
        },
        pricing: {
          monthly: plan.monthly_price,
          yearly: plan.yearly_price,
          monthlyFormatted: engine.formatPrice(plan.monthly_price),
          yearlyFormatted: engine.formatPrice(plan.yearly_price)
        },
        features: {
          teamMembers: plan.team_members_limit,
          support: plan.support_level,
          featuredListings: plan.featured_listings_per_month
        },
        tagline: plan.tagline,
        description: plan.description,
        isPopular: plan.is_popular
      }))
    });

  } catch (error: any) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


