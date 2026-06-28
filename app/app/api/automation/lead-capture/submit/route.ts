import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      form_type,
      form_variant,
      step_1_data,
      step_2_data,
      step_3_data,
      step_4_data,
      current_step,
      source,
      utm_params,
      landing_page_url,
      referrer_url,
      ip_address,
      user_agent,
    } = body;

    if (!form_type) {
      return NextResponse.json(
        { error: 'form_type is required' },
        { status: 400 }
      );
    }

    // Validate form_type
    const validFormTypes = [
      'property_comparison_tool',
      'roi_calculator',
      'emi_calculator',
      'neighborhood_finder',
      'property_valuation',
      'budget_planner',
      'home_loan_eligibility',
    ];

    if (!validFormTypes.includes(form_type)) {
      return NextResponse.json(
        { error: `Invalid form_type. Must be one of: ${validFormTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if this is a continuation of existing submission
    const submissionId = body.submission_id;
    let leadId = body.lead_id || null;

    // If step 2 or later, create/update lead
    if (current_step >= 2 && step_2_data?.email) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', step_2_data.email)
        .single();

      if (existingLead) {
        leadId = existingLead.id;
        // Update lead with new information
        // Build update object with all possible fields
        const updateData: any = {
          name: step_2_data.name || existingLead.name,
          phone_number: step_3_data?.phone || step_3_data?.phone_number || existingLead.phone_number || existingLead.phone,
          budget: step_3_data?.exact_budget ? parseFloat(step_3_data.exact_budget.replace(/[^\d.]/g, '')) : step_3_data?.budget || existingLead.budget,
          source: source || existingLead.source,
          lead_score: current_step >= 3 ? 65 : 40,
          status: current_step >= 3 ? 'qualified' : 'new',
        };

        // Add TN-specific fields if present
        if (step_1_data?.city || step_3_data?.preferred_city) {
          updateData.preferred_city = step_3_data?.preferred_city || step_1_data?.city;
        }
        if (step_1_data?.family_type || step_3_data?.family_type) {
          updateData.family_type = step_3_data?.family_type || step_1_data?.family_type;
        }
        if (step_3_data?.buyer_type_primary) {
          updateData.buyer_type_primary = step_3_data.buyer_type_primary;
        }
        if (step_3_data?.buyer_type_confidence) {
          updateData.buyer_type_confidence = step_3_data.buyer_type_confidence;
        }
        if (step_3_data?.purchase_timeline || step_3_data?.timeline) {
          updateData.purchase_timeline = step_3_data?.purchase_timeline || step_3_data?.timeline;
        }
        if (step_3_data?.cultural_preferences) {
          updateData.cultural_preferences = step_3_data.cultural_preferences;
        }

        await supabase
          .from('leads')
          .update(updateData)
          .eq('id', leadId);
      } else {
        // Build insert object with all possible fields
        const insertData: any = {
          email: step_2_data.email,
          name: step_2_data.name || '',
          phone_number: step_3_data?.phone || step_3_data?.phone_number || null,
          budget: step_3_data?.exact_budget ? parseFloat(step_3_data.exact_budget.replace(/[^\d.]/g, '')) : step_3_data?.budget || null,
          source: source || form_type,
          lead_score: current_step >= 3 ? 65 : 40,
          status: current_step >= 3 ? 'qualified' : 'new',
        };

        // Add TN-specific fields if present
        if (step_1_data?.city || step_3_data?.preferred_city) {
          insertData.preferred_city = step_3_data?.preferred_city || step_1_data?.city;
        }
        if (step_1_data?.family_type || step_3_data?.family_type) {
          insertData.family_type = step_3_data?.family_type || step_1_data?.family_type;
        }
        if (step_3_data?.buyer_type_primary) {
          insertData.buyer_type_primary = step_3_data.buyer_type_primary;
        }
        if (step_3_data?.buyer_type_confidence) {
          insertData.buyer_type_confidence = step_3_data.buyer_type_confidence;
        }
        if (step_3_data?.purchase_timeline || step_3_data?.timeline) {
          insertData.purchase_timeline = step_3_data?.purchase_timeline || step_3_data?.timeline;
        }
        if (step_3_data?.cultural_preferences) {
          insertData.cultural_preferences = step_3_data.cultural_preferences;
        }

        // Create new lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert(insertData)
          .select()
          .single();

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          leadId = newLead.id;
        }
      }
    }

    // Calculate completion rate
    const totalFields = 4;
    const filledSteps = [step_1_data, step_2_data, step_3_data, step_4_data].filter(s => s && Object.keys(s).length > 0).length;
    const completion_rate = (filledSteps / totalFields) * 100;

    // Calculate time to complete (if completed)
    const completed = current_step === 4 && step_4_data && Object.keys(step_4_data).length > 0;
    const time_to_complete_seconds = body.time_to_complete_seconds || null;

    // Extract calculation_results if provided (for calculator forms)
    const calculation_results = body.calculation_results || null;

    let submissionData: any = {
      form_type,
      form_variant: form_variant || null,
      step_1_data: step_1_data || {},
      step_2_data: step_2_data || {},
      step_3_data: step_3_data || {},
      step_4_data: step_4_data || {},
      calculation_results: calculation_results || null,
      current_step,
      completed,
      completion_rate: Math.round(completion_rate * 100) / 100,
      source: source || null,
      utm_params: utm_params || {},
      landing_page_url: landing_page_url || null,
      referrer_url: referrer_url || null,
      time_to_complete_seconds,
      abandonment_step: completed ? null : current_step,
      ip_address: ip_address || null,
      user_agent: user_agent || null,
      lead_id: leadId,
      completed_at: completed ? new Date().toISOString() : null,
    };

    let result;

    if (submissionId) {
      // Update existing submission
      const { data, error } = await supabase
        .from('lead_capture_submissions')
        .update(submissionData)
        .eq('id', submissionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating submission:', error);
        return NextResponse.json(
          { error: 'Failed to update submission', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new submission
      const { data, error } = await supabase
        .from('lead_capture_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating submission:', error);
        return NextResponse.json(
          { error: 'Failed to create submission', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    // Update form variant performance metrics
    if (form_variant) {
      await updateFormVariantMetrics(supabase, form_type, form_variant, current_step, completed);
    }

    // Trigger behavioral signal if lead created
    if (leadId && current_step >= 2) {
      await supabase.from('buyer_behavioral_signals').insert({
        buyer_id: leadId,
        session_id: body.session_id || crypto.randomUUID(),
        event_type: 'calculator_use',
        event_metadata: {
          tool: form_type,
          step: current_step,
        },
        signal_weight: 15,
      });
    }

    return NextResponse.json({
      success: true,
      submission_id: result.id,
      lead_id: leadId,
      current_step,
      completed,
      completion_rate: result.completion_rate,
    });
  } catch (error: any) {
    console.error('Error in form submission:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function updateFormVariantMetrics(
  supabase: any,
  formType: string,
  variantName: string,
  currentStep: number,
  completed: boolean
) {
  // Get or create variant performance record
  const { data: existing } = await supabase
    .from('form_variant_performance')
    .select('*')
    .eq('form_type', formType)
    .eq('variant_name', variantName)
    .single();

  const updates: any = {
    impressions: (existing?.impressions || 0) + 1,
  };

  if (currentStep >= 1) updates.step_1_completions = (existing?.step_1_completions || 0) + 1;
  if (currentStep >= 2) updates.step_2_completions = (existing?.step_2_completions || 0) + 1;
  if (currentStep >= 3) updates.step_3_completions = (existing?.step_3_completions || 0) + 1;
  if (completed) updates.full_completions = (existing?.full_completions || 0) + 1;

  // Calculate conversion rates
  if (updates.impressions > 0) {
    updates.step_1_conversion_rate = ((updates.step_1_completions || 0) / updates.impressions) * 100;
    updates.step_2_conversion_rate = ((updates.step_2_completions || 0) / updates.impressions) * 100;
    updates.step_3_conversion_rate = ((updates.step_3_completions || 0) / updates.impressions) * 100;
    updates.overall_conversion_rate = ((updates.full_completions || 0) / updates.impressions) * 100;
  }

  if (existing) {
    await supabase
      .from('form_variant_performance')
      .update(updates)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('form_variant_performance')
      .insert({
        form_type: formType,
        variant_name: variantName,
        variant_config: {},
        ...updates,
      });
  }
}

