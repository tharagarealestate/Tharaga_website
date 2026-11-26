import { NextRequest, NextResponse } from 'next/server';
import { revenueService } from '@/lib/services/revenue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Skip during build - env vars not available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ plans: [] });
    }
    const plans = await revenueService.getPlans();
    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Plans API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}



