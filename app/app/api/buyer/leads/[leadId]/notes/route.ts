import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { buyerLeadTrackingService } from '@/lib/services/buyer-lead-tracking';
import { z } from 'zod';

const UpdateNotesSchema = z.object({
  notes: z.string().max(5000),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leadId = parseInt(params.leadId, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = UpdateNotesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    await buyerLeadTrackingService.updateNotes(leadId, user.id, validation.data.notes);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update notes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notes' },
      { status: 500 }
    );
  }
}



