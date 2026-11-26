// =============================================
// CUSTOM WEBHOOK ENDPOINT (WITH SLUG)
// Handles custom webhook events with specific slug
// This route handles: /api/webhooks/custom/{builderId}/{slug}
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { WebhookTriggerListener } from '@/lib/automation/triggers/webhookTriggers';
import { eventListener } from '@/lib/automation/triggers/eventListener';

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

/**
 * Handle custom webhook events with slug
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { builderId: string; slug: string } }
) {
  // Import and call the handler from parent route
  const { POST: parentPOST } = await import('../route');
  return parentPOST(req, { params: { builderId: params.builderId, slug: params.slug } });
}

/**
 * GET handler for webhook endpoint info with slug
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { builderId: string; slug: string } }
) {
  // Import and call the handler from parent route
  const { GET: parentGET } = await import('../route');
  return parentGET(req, { params: { builderId: params.builderId, slug: params.slug } });
}

