/**
 * Create Viewing Reminders API
 * Creates scheduled reminders when a property viewing is scheduled
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { viewingId } = body;

    if (!viewingId) {
      return NextResponse.json(
        { error: 'Missing required field: viewingId' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Fetch viewing data
    const { data: viewing, error: viewingError } = await supabase
      .from('property_viewings')
      .select(`
        *,
        lead:leads(*),
        property:properties(*)
      `)
      .eq('id', viewingId)
      .single();

    if (viewingError || !viewing) {
      return NextResponse.json(
        { error: 'Viewing not found' },
        { status: 404 }
      );
    }

    const v = viewing as any;
    const scheduledTime = new Date(v.scheduled_at);

    // Create 3 reminder timestamps
    const reminders = [
      {
        type: '24h_before',
        sendAt: new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000),
        template: 'viewing_reminder_24h'
      },
      {
        type: '2h_before',
        sendAt: new Date(scheduledTime.getTime() - 2 * 60 * 60 * 1000),
        template: 'viewing_reminder_2h'
      },
      {
        type: '30min_before',
        sendAt: new Date(scheduledTime.getTime() - 30 * 60 * 1000),
        template: 'viewing_reminder_30min'
      }
    ];

    // Insert reminders
    const reminderEntries = reminders.map(reminder => ({
      viewing_id: viewingId,
      lead_id: v.lead_id,
      reminder_type: reminder.type,
      scheduled_for: reminder.sendAt.toISOString(),
      template_type: reminder.template,
      status: 'pending'
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('scheduled_reminders')
      .insert(reminderEntries)
      .select();

    if (insertError) {
      throw new Error(`Failed to create reminders: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      reminderCount: inserted?.length || 0,
      reminders: inserted?.map((r: any) => ({
        type: r.reminder_type,
        scheduledFor: r.scheduled_for
      }))
    });

  } catch (error: any) {
    console.error('[Create Viewing Reminders] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}




















