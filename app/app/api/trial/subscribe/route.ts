import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionManager } from '@/lib/subscription/subscription-manager';

export async function POST(request: NextRequest) {
  try {
    const { builderId, email } = await request.json();

    if (!builderId) {
      return NextResponse.json(
        { error: 'Builder ID is required' },
        { status: 400 }
      );
    }

    const manager = new SubscriptionManager();
    const result = await manager.startFreeTrial(
      builderId,
      email || ''
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      subscriptionId: result.subscriptionId,
      trialEndsAt: result.trialEndsAt
    });

  } catch (error: any) {
    console.error('Trial subscribe API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
