/**
 * Feature Documentation Feedback API Route
 * POST /api/documentation/feedback
 * Records helpful/not helpful feedback on documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feature_key, interaction_type } = body;

    // Validate interaction type
    if (!['marked_helpful', 'marked_not_helpful'].includes(interaction_type)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    if (!feature_key) {
      return NextResponse.json(
        { error: 'Feature key is required' },
        { status: 400 }
      );
    }

    // Record interaction
    const { error: interactionError } = await supabase
      .from('user_feature_interactions')
      .upsert({
        user_id: user.id,
        feature_key,
        interaction_type,
        interacted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,feature_key,interaction_type'
      });

    if (interactionError) {
      console.error('Error recording interaction:', interactionError);
    }

    // Update helpful/not helpful counts
    const field = interaction_type === 'marked_helpful' ? 'helpful_count' : 'not_helpful_count';
    
    // Get current count
    const { data: feature, error: fetchError } = await supabase
      .from('feature_documentation')
      .select(field)
      .eq('feature_key', feature_key)
      .single();

    if (!fetchError && feature) {
      await supabase
        .from('feature_documentation')
        .update({ [field]: (feature[field as keyof typeof feature] as number || 0) + 1 })
        .eq('feature_key', feature_key);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





