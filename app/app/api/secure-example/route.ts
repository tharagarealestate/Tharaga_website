// Example secure API route demonstrating all security features
// This shows how to use the secureApiRoute wrapper

import { NextRequest } from 'next/server'
import { secureApiRoute, corsHeaders, handleCORS } from '@/lib/security/api-security'
import { z } from 'zod'
import { Permissions } from '@/lib/security/permissions'
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit'

// Example validation schema
const ExampleSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().max(1000).optional()
})

/**
 * Example secure API route with:
 * - Authentication required
 * - Rate limiting
 * - Input validation
 * - Permission checking
 * - Audit logging
 */
export const GET = secureApiRoute(
  async (req: NextRequest, user) => {
    // This handler only runs if:
    // 1. User is authenticated
    // 2. Rate limit not exceeded
    // 3. User has required permissions (if specified)

    return Response.json({
      message: 'Secure endpoint accessed successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      timestamp: new Date().toISOString()
    })
  },
  {
    requireAuth: true,
    requirePermission: Permissions.USER_VIEW,
    rateLimit: 'api',
    auditAction: AuditActions.VIEW_SENSITIVE_DATA,
    auditResourceType: AuditResourceTypes.USER
  }
)

/**
 * Example POST with validation
 */
export const POST = secureApiRoute(
  async (req: NextRequest, user) => {
    const body = await req.json()
    
    // Body is already validated by secureApiRoute if validateSchema is provided
    // But we can access it here

    return Response.json({
      message: 'Data processed successfully',
      received: body,
      processedBy: user.id
    })
  },
  {
    requireAuth: true,
    requirePermission: Permissions.USER_UPDATE,
    rateLimit: 'strict',
    validateSchema: ExampleSchema,
    auditAction: 'data_updated',
    auditResourceType: AuditResourceTypes.USER
  }
)

/**
 * Handle CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  const cors = handleCORS(req)
  if (cors) return cors
  
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin') || undefined)
  })
}










