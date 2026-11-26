# Zoho CRM & Advanced Billing Integration - Implementation Guide

## Overview
This document provides a comprehensive guide for the advanced Zoho CRM and Razorpay billing integration implemented in the Tharaga platform.

## Database Schema

### Migration File
**Location**: `supabase/migrations/060_advanced_zoho_billing.sql`

### Tables Created

1. **zoho_crm_connections** - Stores Zoho CRM OAuth connections
   - OAuth tokens (encrypted)
   - Zoho account information
   - Sync configuration
   - Field mappings

2. **zoho_sync_logs** - Logs all sync operations
   - Sync type, direction, status
   - Performance metrics
   - Error tracking

3. **zoho_webhook_events** - Stores webhook events from Zoho
   - Event processing status
   - Event metadata

4. **billing_subscriptions** - Manages Razorpay subscriptions
   - Subscription details
   - Usage limits and tracking
   - Billing cycles

5. **billing_invoices** - Invoice management
   - Invoice details
   - Payment tracking
   - PDF generation

6. **billing_payments** - Payment records
   - Payment methods
   - Status tracking
   - Error handling

7. **billing_usage_events** - Usage tracking for metered billing
   - Event types
   - Quantity tracking

## API Routes

### Zoho CRM Integration

#### 1. Connect Route
**File**: `app/app/api/integrations/zoho/connect/route.ts`
- **Endpoint**: `POST /api/integrations/zoho/connect`
- **Purpose**: Initiates OAuth flow
- **Request Body**: `{ data_center: string }`
- **Response**: `{ authorization_url: string }`

#### 2. OAuth Callback
**File**: `app/app/api/integrations/zoho/oauth/route.ts`
- **Endpoint**: `GET /api/integrations/zoho/oauth`
- **Purpose**: Handles OAuth callback
- **Query Params**: `code`, `state`, `error`
- **Action**: Stores encrypted tokens, initializes field mappings

#### 3. Status Route
**File**: `app/app/api/integrations/zoho/status/route.ts`
- **Endpoint**: `GET /api/integrations/zoho/status`
- **Purpose**: Returns connection status and statistics
- **Response**: Connection details, sync stats, health score

#### 4. Sync Route
**File**: `app/app/api/integrations/zoho/sync/route.ts`
- **Endpoint**: `POST /api/integrations/zoho/sync`
- **Purpose**: Syncs leads/deals with Zoho
- **Request Body**: 
  ```json
  {
    "connection_id": "uuid",
    "sync_type": "incremental" | "full" | "lead",
    "entity_id": "uuid" (optional)
  }
  ```

### Billing Integration

#### 1. Plans Route
**File**: `app/app/api/billing/plans/route.ts`
- **Endpoint**: `GET /api/billing/plans`
- **Purpose**: Returns available subscription plans
- **Response**: Array of plans with pricing and features

## Frontend Components

### Zoho CRM Integration Component
**File**: `app/app/(dashboard)/builder/integrations/_components/ZohoCRMIntegration.tsx`

**Features**:
- Connection status display
- OAuth connection flow
- Sync management
- Sync logs display
- Settings configuration

**Usage**:
```tsx
import ZohoCRMIntegration from './_components/ZohoCRMIntegration'

<ZohoCRMIntegration />
```

## Authentication Fixes

### Issue
The "Unauthorized. Please log in." error was occurring because:
1. API routes were checking `builder_id` against `user.id` directly
2. Missing builder profile lookup

### Solution
All API routes now:
1. Authenticate user via Supabase
2. Lookup builder profile using `user.id`
3. Verify builder ownership before operations
4. Return proper error messages

## Environment Variables Required

```env
# Zoho CRM
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REDIRECT_URI=https://your-domain.com/api/integrations/zoho/oauth

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Encryption
ENCRYPTION_KEY=your_encryption_key
```

## Database Setup

### Execute Migration
1. Navigate to Supabase Dashboard
2. Go to SQL Editor
3. Execute the migration file: `supabase/migrations/060_advanced_zoho_billing.sql`
4. Verify all tables are created
5. Check RLS policies are enabled

## Testing Checklist

### Zoho CRM Integration
- [ ] OAuth connection flow works
- [ ] Token refresh works
- [ ] Lead sync to Zoho works
- [ ] Deal sync to Zoho works
- [ ] Sync logs are recorded
- [ ] Error handling works
- [ ] Disconnect functionality works

### Billing Integration
- [ ] Plans are fetched correctly
- [ ] Subscription creation works
- [ ] Webhook handling works
- [ ] Invoice generation works
- [ ] Payment tracking works

## Next Steps

1. **Implement Billing Subscription Route**
   - Create subscription in Razorpay
   - Store in database
   - Handle webhooks

2. **Implement Billing Webhook Handler**
   - Verify signatures
   - Process events
   - Update subscription status

3. **Create Billing UI Component**
   - Plan selection
   - Subscription management
   - Invoice viewing
   - Payment history

4. **Add Usage Tracking**
   - Track property creation
   - Track lead generation
   - Track email sends
   - Enforce limits

## Security Considerations

1. **Token Encryption**: All OAuth tokens are encrypted using AES-256-GCM
2. **RLS Policies**: Row-level security enabled on all tables
3. **Webhook Verification**: Razorpay webhooks verified with HMAC signatures
4. **State Parameter**: OAuth state includes nonce for CSRF protection
5. **Builder Verification**: All operations verify builder ownership

## Error Handling

All API routes include:
- Proper error messages
- Status codes
- Error logging
- User-friendly error responses

## Performance Optimizations

1. **Batch Sync**: Leads synced in batches of 100
2. **Incremental Sync**: Only syncs changed records
3. **Token Caching**: Tokens cached until expiry
4. **Database Indexes**: Proper indexes on all foreign keys

## Support

For issues or questions:
1. Check error logs in Supabase
2. Review sync logs in `zoho_sync_logs` table
3. Verify environment variables
4. Check OAuth callback URL configuration






