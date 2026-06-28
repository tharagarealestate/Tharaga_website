/**
 * Publish Draft API
 * Publishes a completed draft as a live property listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 120;

const publishDraftSchema = z.object({
  draft_id: z.string().uuid(),
  trigger_marketing_automation: z.boolean().default(true),
});

/**
 * POST /api/properties/publish-draft
 * Publishes a completed draft as a live property
 */
export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    const body = await request.json();
    const validatedData = publishDraftSchema.parse(body);

    try {
      // Fetch complete draft
      const { data: draft, error: draftError } = await supabase
        .from('property_upload_drafts')
        .select('*')
        .eq('id', validatedData.draft_id)
        .single();

      if (draftError || !draft) {
        return NextResponse.json(
          { success: false, error: 'Draft not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (draft.uploaded_by_user_id !== user.id) {
        if (draft.uploaded_by_admin) {
          const { data: assignment } = await supabase
            .from('admin_builder_assignments')
            .select('id')
            .eq('admin_user_id', user.id)
            .eq('builder_id', draft.builder_id)
            .eq('is_active', true)
            .single();

          if (!assignment) {
            return NextResponse.json(
              { success: false, error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Validate all steps are complete
      if (!draft.is_valid || draft.overall_completion_percentage < 100) {
        return NextResponse.json(
          {
            success: false,
            error: 'Draft is incomplete or has validation errors',
            validation_errors: draft.validation_errors,
          },
          { status: 400 }
        );
      }

      // Combine all step data into property object
      const propertyData: any = {
        builder_id: draft.builder_id,
        uploaded_by_admin: draft.uploaded_by_admin,
        admin_user_id: draft.uploaded_by_admin ? draft.uploaded_by_user_id : null,
        upload_source: draft.uploaded_by_admin ? 'admin_on_behalf' : 'builder_direct',

        // Step 1: Basic details
        title: draft.step_1_data?.title || '',
        description: draft.step_1_data?.description || '',
        project: draft.step_1_data?.project || '',
        property_type: draft.step_1_data?.property_type || 'Apartment',
        bhk_type: draft.step_1_data?.bhk_type,
        city: draft.step_1_data?.city || '',
        locality: draft.step_1_data?.locality || '',
        state: draft.step_1_data?.state || '',
        address: draft.step_1_data?.address || '',
        pincode: draft.step_1_data?.pincode || '',
        lat: draft.step_1_data?.lat,
        lng: draft.step_1_data?.lng,
        rera_id: draft.step_1_data?.rera_id || '',
        rera_verified: draft.step_1_data?.rera_verified || false,

        // Step 2: Specifications
        bedrooms: draft.step_2_data?.bedrooms,
        bathrooms: draft.step_2_data?.bathrooms,
        sqft: draft.step_2_data?.sqft,
        carpet_area: draft.step_2_data?.carpet_area,
        builtup_area: draft.step_2_data?.builtup_area,
        super_buildup_area: draft.step_2_data?.super_buildup_area,
        plot_area: draft.step_2_data?.plot_area,
        floor: draft.step_2_data?.floor,
        total_floors: draft.step_2_data?.total_floors,
        facing: draft.step_2_data?.facing,
        parking: draft.step_2_data?.parking,
        balcony_count: draft.step_2_data?.balcony_count,
        furnishing_status: draft.step_2_data?.furnishing_status,

        // Step 3: Amenities
        amenities: draft.step_3_data?.amenities || [],

        // Step 4: Media (handled separately via property_media_assets)
        images: draft.step_4_data?.images || [],
        videos: draft.step_4_data?.videos || [],
        floor_plan_images: draft.step_4_data?.floor_plan_images || [],
        virtual_tour_url: draft.step_4_data?.virtual_tour_url || '',

        // Step 5: Pricing
        price_inr: draft.step_5_data?.price_inr || 0,
        price_per_sqft: draft.step_5_data?.price_per_sqft,
        negotiable: draft.step_5_data?.negotiable ?? true,
        base_price: draft.step_5_data?.base_price,

        // Status
        status: 'active',
        listing_status: 'active',
        verification_status: 'pending',
        marketing_automation_enabled: validatedData.trigger_marketing_automation,
      };

      // Create property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (propertyError) {
        console.error('[Publish Draft] Property creation error:', propertyError);
        return NextResponse.json(
          { success: false, error: 'Failed to create property' },
          { status: 500 }
        );
      }

      // Link media assets if any were uploaded
      if (draft.uploaded_images && draft.uploaded_images.length > 0) {
        await supabase
          .from('property_media_assets')
          .update({ property_id: property.id })
          .in('id', draft.uploaded_images);
      }

      // Update draft status
      await supabase
        .from('property_upload_drafts')
        .update({
          status: 'published',
          published_property_id: property.id,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', validatedData.draft_id);

      // Log admin activity if uploaded by admin
      if (draft.uploaded_by_admin) {
        await supabase
          .from('admin_activity_log')
          .insert({
            admin_user_id: draft.uploaded_by_user_id,
            action_type: 'property_uploaded',
            action_description: `Uploaded property "${property.title}" on behalf of builder`,
            target_type: 'property',
            target_id: property.id,
            target_name: property.title,
            new_state: {
              property_id: property.id,
              builder_id: draft.builder_id,
              status: 'active',
            },
          });
      }

      // Trigger marketing automation if enabled
      let automationWorkflows: string[] = [];
      if (validatedData.trigger_marketing_automation) {
        try {
          // Trigger AI automation marketing (fire and forget)
          const marketingUrl = new URL('/api/automation/marketing/auto-trigger', request.url)
          fetch(marketingUrl.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              property_id: property.id,
            }),
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json()
              automationWorkflows = data.campaign_id ? ['ai_marketing_campaign'] : []
            }
          }).catch(err => {
            console.error('[Publish Draft] Marketing automation trigger failed (non-critical):', err)
          })
        } catch (error) {
          console.error('[Publish Draft] Marketing automation error:', error);
          // Don't fail the publish if automation fails
        }
      }

      return NextResponse.json({
        success: true,
        property_id: property.id,
        property_url: `/property/${property.id}`,
        marketing_automation_triggered: validatedData.trigger_marketing_automation,
        automation_workflows: automationWorkflows,
      });
    } catch (error: any) {
      console.error('[Publish Draft] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to publish property' },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.PROPERTY_CREATE,
  }
);















