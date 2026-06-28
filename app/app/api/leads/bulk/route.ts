// =============================================
// BULK OPERATIONS API
// POST /api/leads/bulk
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getCachedServiceResendClient, type EmailSendResult } from '@/lib/email/resendClient';

// =============================================
// VALIDATION SCHEMAS
// =============================================
const bulkEmailSchema = z.object({
  operation: z.literal('send_email'),
  lead_ids: z.array(z.string()).min(1).max(100), // Max 100 at once
  email_template: z.string().min(1),
  subject: z.string().min(1).max(200),
  personalize: z.boolean().default(true),
});

const bulkUpdateSchema = z.object({
  operation: z.literal('update_status'),
  lead_ids: z.array(z.string()).min(1).max(500),
  updates: z.object({
    category: z.enum(['Hot Lead', 'Warm Lead', 'Developing Lead', 'Cold Lead', 'Low Quality']).optional(),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

const bulkInteractionSchema = z.object({
  operation: z.literal('create_interaction'),
  lead_ids: z.array(z.string()).min(1).max(100),
  interaction: z.object({
    interaction_type: z.enum(['phone_call', 'email_sent', 'whatsapp_message']),
    notes: z.string().optional(),
    outcome: z.string().optional(),
  }),
});

const bulkAssignmentSchema = z.object({
  operation: z.literal('assign_team_member'),
  lead_ids: z.array(z.string()).min(1).max(500),
  team_member_id: z.string().uuid(),
});

const bulkSchema = z.discriminatedUnion('operation', [
  bulkEmailSchema,
  bulkUpdateSchema,
  bulkInteractionSchema,
  bulkAssignmentSchema,
]);

// =============================================
// POST HANDLER
// =============================================
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';

export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const cookieStore = cookies();
    const supabase = await createClient();
    
    // Payload is already validated by secureApiRoute
    const body = await request.json();
    const validatedData = bulkSchema.parse(body);
    
    // =============================================
    // HANDLE DIFFERENT OPERATIONS
    // =============================================
    
    if (validatedData.operation === 'send_email') {
      // =============================================
      // BULK EMAIL SEND
      // =============================================
      
      const { lead_ids, email_template, subject, personalize } = validatedData;
      
      // Fetch lead details from leads table
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          builder_id
        `)
        .in('id', lead_ids)
        .eq('builder_id', user.id); // Ensure builder owns these leads
      
      if (leadsError) {
        return NextResponse.json(
          { error: 'Failed to fetch leads', details: leadsError.message },
          { status: 500 }
        );
      }
      
      if (!leads || leads.length === 0) {
        return NextResponse.json(
          { error: 'No valid leads found' },
          { status: 404 }
        );
      }
      
      const results = [];
      
      for (const lead of leads) {
        try {
          // Personalize email template
          let personalizedContent = email_template;
          let personalizedSubject = subject;
          
          if (personalize && lead.name) {
            const name = lead.name || 'there';
            personalizedContent = personalizedContent.replace(/\{\{name\}\}/g, name);
            personalizedSubject = personalizedSubject.replace(/\{\{name\}\}/g, name);
          }
          
          // Send email through Resend
          const sendResult = await sendEmail({
            to: lead.email || '',
            subject: personalizedSubject,
            html: personalizedContent,
            builderId: user.id,
            leadId: lead.id ? String(lead.id) : undefined,
            metadata: { bulk_operation: 'send_email', subject },
          });

          results.push({
            lead_id: lead.id,
            success: sendResult.success,
            email: lead.email || null,
            message_id: sendResult.message_id ?? null,
            error: sendResult.success ? null : sendResult.error ?? null,
          });
          
        } catch (error) {
          results.push({
            lead_id: lead.id,
            success: false,
            error: String(error),
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        operation: 'send_email',
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        },
      });
      
    } else if (validatedData.operation === 'update_status') {
      // =============================================
      // BULK STATUS UPDATE
      // =============================================
      
      const { lead_ids, updates } = validatedData;
      
      // Verify leads belong to this builder
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id')
        .in('id', lead_ids)
        .eq('builder_id', user.id);
      
      if (!existingLeads || existingLeads.length === 0) {
        return NextResponse.json(
          { error: 'No valid leads found' },
          { status: 404 }
        );
      }
      
      const validLeadIds = existingLeads.map(l => l.id);
      
      const updateData: any = {};
      
      // Update category in lead_scores if provided
      if (updates.category) {
        // First, get user_ids from leads
        const { data: leadUsers } = await supabase
          .from('leads')
          .select('id, email')
          .in('id', validLeadIds);
        
        if (leadUsers && leadUsers.length > 0) {
          // Find user_ids from profiles by email
          const emails = leadUsers.map(l => l.email).filter(Boolean);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('email', emails);
          
          if (profiles && profiles.length > 0) {
            const userIds = profiles.map(p => p.id);
            await supabase
              .from('lead_scores')
              .update({ category: updates.category })
              .in('user_id', userIds);
          }
        }
      }
      
      // Update status in leads table
      if (updates.status) {
        updateData.status = updates.status;
      }
      
      // Update notes (store in metadata or create notes table)
      if (updates.notes) {
        // For now, we'll store notes in lead_interactions as email_sent type with notes
        const interactions = validLeadIds.map(leadId => ({
          lead_id: String(leadId),
          builder_id: user.id,
          interaction_type: 'email_sent', // Use email_sent as default, can be changed to 'note' if column supports it
          timestamp: new Date().toISOString(),
          status: 'completed',
          notes: updates.notes,
        }));
        
        await supabase.from('lead_interactions').insert(interactions);
      }
      
      // Perform update if there's data to update
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('leads')
          .update(updateData)
          .in('id', validLeadIds);
        
        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update leads', details: updateError.message },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json({
        success: true,
        operation: 'update_status',
        updated_count: validLeadIds.length,
      });
      
    } else if (validatedData.operation === 'create_interaction') {
      // =============================================
      // BULK INTERACTION CREATION
      // =============================================
      
      const { lead_ids, interaction } = validatedData;
      
      // Verify leads belong to this builder
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id')
        .in('id', lead_ids)
        .eq('builder_id', user.id);
      
      if (!existingLeads || existingLeads.length === 0) {
        return NextResponse.json(
          { error: 'No valid leads found' },
          { status: 404 }
        );
      }
      
      const validLeadIds = existingLeads.map(l => String(l.id));
      
      const interactions = validLeadIds.map(leadId => ({
        lead_id: leadId,
        builder_id: user.id,
        interaction_type: interaction.interaction_type,
        timestamp: new Date().toISOString(),
        status: 'completed',
        notes: interaction.notes || null,
        outcome: interaction.outcome || null,
      }));
      
      const { error: insertError } = await supabase
        .from('lead_interactions')
        .insert(interactions);
      
      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create interactions', details: insertError.message },
          { status: 500 }
        );
      }
      
      // Trigger score recalculation for all leads (if function exists)
      // Note: This would require the calculate_lead_score function to exist
      // For now, we'll skip this and let it be handled by scheduled jobs
      
      return NextResponse.json({
        success: true,
        operation: 'create_interaction',
        created_count: validLeadIds.length,
      });
      
    } else if (validatedData.operation === 'assign_team_member') {
      // =============================================
      // BULK TEAM MEMBER ASSIGNMENT
      // =============================================
      
      const { lead_ids, team_member_id } = validatedData;
      
      // Verify leads belong to this builder
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id')
        .in('id', lead_ids)
        .eq('builder_id', user.id);
      
      if (!existingLeads || existingLeads.length === 0) {
        return NextResponse.json(
          { error: 'No valid leads found' },
          { status: 404 }
        );
      }
      
      const validLeadIds = existingLeads.map(l => l.id);
      
      // Check if assigned_to column exists, if not we'll add it via migration
      // For now, we'll try to update it
      const { error: updateError } = await supabase
        .from('leads')
        .update({ assigned_to: team_member_id })
        .in('id', validLeadIds);
      
      if (updateError) {
        // If column doesn't exist, create it via migration
        if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
          // We'll handle this in migration
          return NextResponse.json(
            { error: 'Assignment feature requires database migration. Please contact support.' },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to assign team member', details: updateError.message },
          { status: 500 }
        );
      }
      
      // Log assignment as interaction
      const assignmentInteractions = validLeadIds.map(leadId => ({
        lead_id: String(leadId),
        builder_id: user.id,
        interaction_type: 'email_sent', // Use email_sent as default since 'assignment' may not be supported
        timestamp: new Date().toISOString(),
        status: 'completed',
        notes: `Assigned to team member: ${team_member_id}`,
        metadata: { assigned_to: team_member_id, interaction_type: 'assignment' },
      }));
      
      await supabase.from('lead_interactions').insert(assignmentInteractions);
      
      return NextResponse.json({
        success: true,
        operation: 'assign_team_member',
        assigned_count: validLeadIds.length,
      });
    }
    
    return NextResponse.json(
      { error: 'Unknown operation' },
      { status: 400 }
    );
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_UPDATE,
    rateLimit: 'strict',
    validateSchema: bulkSchema,
    auditAction: AuditActions.BULK_UPDATE,
    auditResourceType: AuditResourceTypes.LEAD
  }
)

// =============================================
// HELPER: Send Email (Integrate with Provider)
// =============================================
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  // TODO: Integrate with your email provider
  // Example with Resend:
  /*
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const { error } = await resend.emails.send({
    from: 'Tharaga <noreply@tharaga.co.in>',
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  
  return !error;
  */
  
  // For now, log the email (in production, integrate with actual email service)
  console.log('[Email] Would send:', {
    to: params.to,
    subject: params.subject,
    html: params.html.substring(0, 100) + '...',
  });
  
  // Simulate email sending
  return true;
}

