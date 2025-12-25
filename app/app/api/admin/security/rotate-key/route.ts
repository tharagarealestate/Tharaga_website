import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';
import { rotateEncryptionKey } from '@/lib/security/key-rotation';
import { z } from 'zod';

const rotateKeySchema = z.object({
  new_key: z.string().length(64).optional(), // 32 bytes = 64 hex chars
  batch_size: z.number().int().min(10).max(1000).optional().default(100)
});

/**
 * POST /api/admin/security/rotate-key
 * Rotate encryption key (admin only, requires confirmation)
 */
export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Additional confirmation check - this is a critical operation
    const body = await request.json();
    const { confirm } = body;
    
    if (confirm !== true) {
      return NextResponse.json(
        { error: 'Key rotation requires explicit confirmation. Set confirm: true in request body.' },
        { status: 400 }
      );
    }

    const validatedData = rotateKeySchema.parse(body);

    try {
      // Start key rotation (this is a long-running operation)
      // In production, you might want to queue this as a background job
      const result = await rotateEncryptionKey(
        validatedData.new_key,
        validatedData.batch_size
      );

      if (!result.success && result.errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Key rotation completed with errors',
            details: result,
            message: 'Some records may not have been re-encrypted. Check errors array.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Encryption key rotated successfully',
        data: {
          old_key_version: result.oldKeyVersion,
          new_key_version: result.newKeyVersion,
          records_re_encrypted: result.recordsReEncrypted,
          errors: result.errors
        }
      });
    } catch (error: any) {
      console.error('[Admin/Security] Key rotation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to rotate encryption key',
          details: error.message
        },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    requireRole: ['admin'],
    requirePermission: Permissions.ADMIN_ACCESS,
    rateLimit: 'strict',
    validateSchema: rotateKeySchema,
    auditAction: AuditActions.UPDATE_SETTINGS,
    auditResourceType: AuditResourceTypes.SETTINGS
  }
);

