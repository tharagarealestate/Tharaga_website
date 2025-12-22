# Security Implementation Guide

## Overview

This directory contains comprehensive security implementations for the Tharaga Real Estate platform, including authentication, authorization, rate limiting, input validation, and audit logging.

## Files

### Core Security Files

1. **`auth.ts`** - Authentication utilities
   - JWT token verification
   - User authentication helpers
   - IP and user agent extraction

2. **`2fa.ts`** - Two-Factor Authentication
   - TOTP (Time-based One-Time Password) support
   - SMS and Email 2FA
   - Backup codes generation
   - QR code generation for TOTP setup

3. **`permissions.ts`** - Permission-based Authorization
   - Role and permission checking
   - Grant/revoke permissions
   - Permission constants

4. **`rate-limit-enhanced.ts`** - Enhanced Rate Limiting
   - Database-backed rate limiting
   - Multiple rate limit configurations
   - Automatic cleanup

5. **`rate-limiter.ts`** - In-Memory Rate Limiting
   - Fast in-memory rate limiting
   - Multiple pre-configured limiters

6. **`validation.ts`** - Input Validation & Sanitization
   - Zod schemas for validation
   - Advanced validation rules
   - XSS and SQL injection prevention

7. **`xss.ts`** - XSS Protection
   - DOMPurify integration
   - HTML sanitization
   - URL sanitization

8. **`encryption.ts`** - Data Encryption
   - AES-256-GCM encryption
   - PBKDF2 key derivation
   - Hashing utilities

9. **`audit.ts`** - Audit Logging
   - Security event logging
   - Request context tracking
   - Predefined audit actions

10. **`api-security.ts`** - API Security Wrapper
    - Complete API route security wrapper
    - Authentication, rate limiting, validation
    - Permission checking
    - CORS handling

11. **`login-security.ts`** - Login Security
    - Account lockout management
    - Failed login tracking
    - Login attempt logging

## Database Tables

### Security-Related Tables

1. **`user_2fa`** - 2FA configuration and secrets
2. **`login_attempts`** - Login attempt history
3. **`failed_login_tracking`** - Failed login tracking and lockouts
4. **`rate_limit_records`** - Rate limiting records
5. **`audit_logs_enhanced`** - Enhanced audit logging
6. **`audit_logs`** - Standard audit logs

## Usage Examples

### Secure API Route

```typescript
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'
import { z } from 'zod'

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email()
})

export const POST = secureApiRoute(
  async (req, user) => {
    const body = await req.json()
    // Body is already validated
    return Response.json({ success: true })
  },
  {
    requireAuth: true,
    requirePermission: Permissions.PROPERTY_CREATE,
    rateLimit: 'api',
    validateSchema: Schema,
    auditAction: 'property_created'
  }
)
```

### Check Permissions

```typescript
import { hasPermission, Permissions } from '@/lib/security/permissions'

const canView = await hasPermission(userId, Permissions.PROPERTY_VIEW)
if (!canView) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Rate Limiting

```typescript
import { withRateLimitWrapper, rateLimiters } from '@/lib/security/rate-limit-enhanced'

const response = await withRateLimitWrapper(
  request,
  async () => {
    // Your handler
    return Response.json({ data: 'ok' })
  },
  rateLimiters.strict
)
```

### Input Validation

```typescript
import { validateInput, ValidationRules } from '@/lib/security/validation'

// Using validation rules
try {
  const email = ValidationRules.email(userInput)
  const phone = ValidationRules.phone(userInput)
} catch (error) {
  // Handle validation error
}

// Using Zod schemas
const result = await validateInput(MySchema, data)
if (!result.success) {
  return Response.json({ error: result.error }, { status: 400 })
}
```

### 2FA Setup

```typescript
import { generateTOTPSecret, verifyTOTP, enable2FA } from '@/lib/security/2fa'

// Generate TOTP secret
const { secret, qrCodeUrl, backupCodes } = await generateTOTPSecret(userId)

// Verify TOTP token
const isValid = await verifyTOTP(userId, token)

// Enable 2FA
await enable2FA(userId, 'totp')
```

### Login Security

```typescript
import { checkAccountLockout, recordFailedLogin, resetFailedLoginAttempts } from '@/lib/security/login-security'

// Check if account is locked
const { isLocked, attemptsRemaining } = await checkAccountLockout(email)
if (isLocked) {
  return Response.json({ error: 'Account locked' }, { status: 423 })
}

// Record failed login
await recordFailedLogin(email, 'Invalid password')

// Reset on successful login
await resetFailedLoginAttempts(email)
```

## Environment Variables

Required:
- `ENCRYPTION_KEY` - 32+ character random string for encryption
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## Dependencies

### Required
- `@supabase/supabase-js`
- `zod`
- `dompurify`
- `jsdom`

### Optional (for 2FA)
```bash
npm install speakeasy qrcode @types/speakeasy @types/qrcode
```

## Security Best Practices

1. **Always validate input** - Use Zod schemas or ValidationRules
2. **Use secureApiRoute** - For all authenticated API routes
3. **Check permissions** - Before allowing sensitive operations
4. **Enable 2FA** - For admin and builder accounts
5. **Monitor audit logs** - Regularly review security events
6. **Rate limit** - All public-facing endpoints
7. **Encrypt sensitive data** - Use encryption utilities for PII
8. **Sanitize output** - Use XSS protection for user-generated content

## Testing

Test security features:
1. Rate limiting - Make multiple rapid requests
2. Authentication - Try accessing protected routes without token
3. Permissions - Test with different user roles
4. Input validation - Submit invalid data
5. 2FA - Test TOTP verification flow

## Migration Status

All database migrations have been applied:
- ✅ `create_2fa_tables` - 2FA tables and RLS policies
- ✅ `enhance_authorization_permissions` - Permissions system
- ✅ `create_rate_limit_table_fixed` - Rate limiting table
- ✅ `create_failed_login_tracking_function` - Login security functions

## Support

For security issues or questions, refer to:
- `security-summary.md` - Complete security implementation summary
- Database migrations in Supabase
- Example usage in `app/app/api/secure-example/route.ts`

