import { NextRequest, NextResponse } from 'next/server';
import { revenueService } from '@/lib/services/revenue';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
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



