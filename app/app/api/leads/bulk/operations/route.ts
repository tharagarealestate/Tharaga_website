import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bulkOperationSchema = z.object({
  operation: z.enum(['update_status', 'assign', 'sync_crm', 'delete', 'export']),
  lead_ids: z.array(z.string().uuid()).min(1).max(100),
  data: z.record(z.any()).optional(),
})

export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    try {
      const supabase = await createClient()
      const body = await request.json()
      
      const validated = bulkOperationSchema.parse(body)
      const { operation, lead_ids, data } = validated

      // Verify all leads belong to builder
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .in('id', lead_ids)
        .eq('builder_id', user.id)

      if (leadsError) {
        throw leadsError
      }

      if (leads.length !== lead_ids.length) {
        return NextResponse.json(
          { error: 'Some leads not found or unauthorized' },
          { status: 403 }
        )
      }

      let result: any = {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
      }

      switch (operation) {
        case 'update_status':
          if (!data?.status) {
            return NextResponse.json(
              { error: 'status is required for update_status operation' },
              { status: 400 }
            )
          }

          const { error: updateError } = await supabase
            .from('leads')
            .update({ 
              status: data.status,
              updated_at: new Date().toISOString(),
            })
            .in('id', lead_ids)
            .eq('builder_id', user.id)

          if (updateError) {
            throw updateError
          }

          result.processed = lead_ids.length
          break

        case 'sync_crm':
          // Sync leads to ZOHO CRM
          const syncResults = await Promise.allSettled(
            lead_ids.map(async (leadId) => {
              try {
                const syncResponse = await fetch(`${request.nextUrl.origin}/api/crm/zoho/sync`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                  },
                  body: JSON.stringify({
                    sync_type: 'to_crm',
                    record_type: 'lead',
                    record_ids: [leadId],
                  }),
                })

                if (!syncResponse.ok) {
                  throw new Error('Sync failed')
                }

                return { leadId, success: true }
              } catch (error: any) {
                return { leadId, success: false, error: error.message }
              }
            })
          )

          result.processed = syncResults.filter(r => r.status === 'fulfilled' && r.value.success).length
          result.failed = syncResults.length - result.processed
          result.errors = syncResults
            .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
            .map(r => r.status === 'rejected' ? r.reason : r.value.error)
          break

        case 'delete':
          const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .in('id', lead_ids)
            .eq('builder_id', user.id)

          if (deleteError) {
            throw deleteError
          }

          result.processed = lead_ids.length
          break

        case 'export':
          // Export leads (return data for client-side download)
          const { data: exportLeads, error: exportError } = await supabase
            .from('leads')
            .select('*')
            .in('id', lead_ids)
            .eq('builder_id', user.id)

          if (exportError) {
            throw exportError
          }

          result.processed = exportLeads.length
          result.data = exportLeads
          break

        default:
          return NextResponse.json(
            { error: `Unsupported operation: ${operation}` },
            { status: 400 }
          )
      }

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('[API/BulkOperations] Error:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request data',
            details: error.errors,
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to process bulk operation',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_EDIT,
    rateLimit: 'api',
    auditAction: AuditActions.UPDATE,
    auditResourceType: AuditResourceTypes.LEAD,
  }
)

