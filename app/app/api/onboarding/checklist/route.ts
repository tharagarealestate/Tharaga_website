/**
 * Onboarding Checklist API Route
 * GET /api/onboarding/checklist
 * Fetches personalized onboarding checklist for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DEFAULT_CHECKLIST_ITEMS = [
  {
    task: 'upload_first_property',
    title: 'Upload Your First Property',
    description: 'Add your first property to get started with Tharaga',
    completed: false,
    completed_at: null,
    action_url: '/properties/upload',
    estimated_time: '5 min'
  },
  {
    task: 'verify_rera_certificate',
    title: 'Verify RERA Certificate',
    description: 'Upload and verify your RERA registration for compliance',
    completed: false,
    completed_at: null,
    action_url: '/settings/compliance',
    estimated_time: '3 min'
  },
  {
    task: 'setup_payment_method',
    title: 'Add Payment Method',
    description: 'Connect Razorpay to enable subscription billing',
    completed: false,
    completed_at: null,
    action_url: '/settings/billing',
    estimated_time: '2 min'
  },
  {
    task: 'connect_whatsapp',
    title: 'Connect WhatsApp Business',
    description: 'Link Twilio WhatsApp for automated lead communication',
    completed: false,
    completed_at: null,
    action_url: '/settings/integrations',
    estimated_time: '3 min'
  },
  {
    task: 'customize_branding',
    title: 'Customize Your Branding',
    description: 'Upload logo and set brand colors for property pages',
    completed: false,
    completed_at: null,
    action_url: '/settings/branding',
    estimated_time: '4 min'
  },
  {
    task: 'explore_ai_features',
    title: 'Explore AI Features',
    description: 'Learn about behavioral lead scoring and buyer classification',
    completed: false,
    completed_at: null,
    action_url: '/features/ai-automation',
    estimated_time: '5 min'
  },
  {
    task: 'invite_team_members',
    title: 'Invite Your Team',
    description: 'Add sales agents to collaborate on lead management',
    completed: false,
    completed_at: null,
    action_url: '/team/invite',
    estimated_time: '2 min'
  },
  {
    task: 'configure_notifications',
    title: 'Set Up Notifications',
    description: 'Choose how you want to receive lead alerts',
    completed: false,
    completed_at: null,
    action_url: '/settings/notifications',
    estimated_time: '2 min'
  },
  {
    task: 'launch_first_campaign',
    title: 'Launch First Marketing Campaign',
    description: 'Enable 9-workflow automation for your property',
    completed: false,
    completed_at: null,
    action_url: '/marketing/campaigns',
    estimated_time: '1 min'
  },
  {
    task: 'upgrade_to_pro',
    title: 'Upgrade to Tharaga Pro',
    description: 'Unlock AI features, unlimited properties, and advanced analytics',
    completed: false,
    completed_at: null,
    action_url: '/settings/billing',
    estimated_time: '2 min'
  }
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch or create checklist
    let { data: checklist, error } = await supabase
      .from('onboarding_checklists')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !checklist) {
      // Create default checklist
      const defaultChecklist = {
        user_id: user.id,
        checklist_items: DEFAULT_CHECKLIST_ITEMS,
        overall_progress: 0,
        current_step: 1,
        total_steps: DEFAULT_CHECKLIST_ITEMS.length,
        is_onboarding_complete: false
      };

      const { data: created, error: createError } = await supabase
        .from('onboarding_checklists')
        .insert(defaultChecklist)
        .select()
        .single();

      if (createError) {
        console.error('Error creating checklist:', createError);
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      checklist = created;
    }

    return NextResponse.json(checklist);
  } catch (error: any) {
    console.error('Error fetching onboarding checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
















