import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { secureApiRoute } from '@/lib/security/api-security';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirm: z.boolean().refine(val => val === true, { message: 'Deletion must be confirmed' }),
  anonymize: z.boolean().default(true)
});

/**
 * DELETE /api/user/delete-account
 * GDPR Article 17 - Right to Erasure
 * Anonymizes or deletes user data
 * Sets deletion_requested flag or actually deletes
 */
export const DELETE = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    // User is already authenticated via secureApiRoute
    const body = await request.json().catch(() => ({}));
    const { confirm = false, anonymize = true } = deleteAccountSchema.parse(body);

    // Validation is handled by secureApiRoute schema

    // Option 1: Anonymize data (recommended for production)
    if (anonymize) {
      const anonymizedEmail = `deleted-${user.id}@deleted.tharaga.co.in`;
      const anonymizedName = 'Deleted User';

      // Anonymize profile
      await supabase
        .from('profiles')
        .update({
          email: anonymizedEmail,
          full_name: anonymizedName,
          phone: null,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Set deletion flag in profiles
      await supabase
        .from('profiles')
        .update({
          deletion_requested: true,
          deletion_requested_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Anonymize builder profile
      await supabase
        .from('builder_profiles')
        .update({
          company_name: 'Deleted Company',
          gstin: null,
          rera_number: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Anonymize buyer profile
      await supabase
        .from('buyer_profiles')
        .update({
          preferences: {},
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Delete user roles (they can be recreated)
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      // Note: Properties, leads, and other data are kept for business records
      // but user identification is removed

      return NextResponse.json({
        success: true,
        message: 'Account data anonymized successfully',
        anonymized: true,
      });
    } else {
      // Option 2: Hard delete (use with caution)
      // Delete all user data
      await Promise.all([
        supabase.from('user_roles').delete().eq('user_id', user.id),
        supabase.from('builder_profiles').delete().eq('user_id', user.id),
        supabase.from('buyer_profiles').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('id', user.id),
        // Note: Properties and leads are kept for business records
        // Documents and subscriptions may need special handling
      ]);

      // Delete auth user (requires admin privileges or service role)
      // This should be done via Supabase Admin API or trigger
      // For now, we'll just mark for deletion
      await supabase
        .from('profiles')
        .update({
          deletion_requested: true,
          deletion_requested_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      return NextResponse.json({
        success: true,
        message: 'Account deletion requested. Auth user deletion requires admin action.',
        deleted: true,
      });
    }
  },
  {
    requireAuth: true,
    rateLimit: 'strict',
    validateSchema: deleteAccountSchema,
    auditAction: AuditActions.USER_DELETE,
    auditResourceType: AuditResourceTypes.USER
  }
)



