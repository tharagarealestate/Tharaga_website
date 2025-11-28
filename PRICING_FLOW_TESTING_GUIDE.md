# Pricing Flow Testing Guide - Complete Verification

This guide provides comprehensive testing procedures to verify the entire pricing subscription flow works correctly in real-time scenarios.

## 📋 Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Test Scenarios](#test-scenarios)
3. [Manual Testing Steps](#manual-testing-steps)
4. [Automated Testing Scripts](#automated-testing-scripts)
5. [Database Verification](#database-verification)
6. [Webhook Testing](#webhook-testing)
7. [Edge Cases & Error Handling](#edge-cases--error-handling)
8. [Production Readiness Checklist](#production-readiness-checklist)

---

## Pre-Testing Setup

### 1. Environment Configuration

**Test Mode Setup:**
```bash
# Use Razorpay Test Mode credentials
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret

# Test Plan IDs (create these in Razorpay Test Mode)
RZP_PLAN_STARTER_MONTHLY=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_STARTER_ANNUAL=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_PROFESSIONAL_MONTHLY=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_PROFESSIONAL_ANNUAL=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_ENTERPRISE_MONTHLY=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_ENTERPRISE_ANNUAL=plan_test_XXXXXXXXXXXXXX
```

### 2. Test User Setup

Create a test builder account:
- Email: `test-builder@tharaga.test`
- Role: `builder`
- Verified email

### 3. Razorpay Test Mode Plans

Create all 6 plans in Razorpay Test Mode dashboard:
- builder_starter_monthly: ₹999
- builder_starter_annual: ₹9,990
- builder_professional_monthly: ₹2,999
- builder_professional_annual: ₹29,990
- builder_enterprise_monthly: ₹5,999
- builder_enterprise_annual: ₹59,990

### 4. Webhook Testing Setup

For local testing, use ngrok:
```bash
ngrok http 3000
# Use the ngrok URL in Razorpay webhook: https://xxxxx.ngrok.io/api/webhooks/razorpay
```

---

## Test Scenarios

### Scenario 1: Starter Plan - Monthly Subscription
**Objective**: Verify starter monthly subscription flow

**Steps**:
1. User selects "Builder Starter" plan
2. Selects "Monthly" billing
3. Clicks "Start 14-Day Free Trial"
4. Creates subscription in Razorpay
5. Completes payment
6. Webhook updates database
7. User gets access

**Expected Results**:
- ✅ Subscription created with correct plan ID
- ✅ Database record created in `user_subscriptions`
- ✅ Status: `active`
- ✅ Billing cycle: `monthly`
- ✅ Plan: `starter`

### Scenario 2: Professional Plan - Annual Subscription
**Objective**: Verify professional annual subscription with 17% discount

**Steps**:
1. User selects "Builder Professional" plan
2. Selects "Yearly" billing
3. Clicks "Start 14-Day Free Trial"
4. Creates subscription
5. Completes payment
6. Webhook processes payment

**Expected Results**:
- ✅ Correct annual plan ID used
- ✅ Database shows `yearly` billing cycle
- ✅ Subscription amount: ₹29,990
- ✅ Status: `active`

### Scenario 3: Enterprise Plan - Monthly Subscription
**Objective**: Verify enterprise tier subscription

**Steps**:
1. User selects "Builder Enterprise"
2. Selects "Monthly"
3. Creates subscription
4. Completes payment

**Expected Results**:
- ✅ Enterprise plan ID used
- ✅ Database updated correctly
- ✅ Status: `active`

### Scenario 4: Payment Failure Handling
**Objective**: Verify system handles payment failures gracefully

**Steps**:
1. Create subscription
2. Use test card that fails: `4000 0000 0000 0002`
3. Check webhook handling

**Expected Results**:
- ✅ Payment failure webhook received
- ✅ Subscription status: `past_due`
- ✅ User notified appropriately

### Scenario 5: Subscription Cancellation
**Objective**: Verify cancellation flow

**Steps**:
1. Active subscription exists
2. Cancel via Razorpay dashboard or API
3. Webhook received

**Expected Results**:
- ✅ Cancellation webhook processed
- ✅ Status: `canceled`
- ✅ Access revoked appropriately

---

## Manual Testing Steps

### Step 1: Test Subscription Creation API

**Endpoint**: `POST /api/rzp/create-subscription`

**Request**:
```bash
curl -X POST http://localhost:3000/api/rzp/create-subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "plan": "starter",
    "annual": false,
    "email": "test@example.com",
    "phone": "+919876543210"
  }'
```

**Expected Response**:
```json
{
  "id": "sub_XXXXXXXXXXXXXX",
  "short_url": "https://rzp.io/i/XXXXXXXX",
  "status": "created",
  "customer_id": "cust_XXXXXXXXXXXXXX"
}
```

**Verification Checklist**:
- [ ] Response contains subscription ID
- [ ] Response contains short_url for payment
- [ ] Status is "created"
- [ ] Customer ID is returned
- [ ] Database record created in `user_subscriptions`
- [ ] Correct plan ID used based on plan name

### Step 2: Test Payment Flow

**Using Razorpay Test Cards**:

1. **Successful Payment**:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date (e.g., `12/25`)
   - Name: Any name

2. **Payment Failure**:
   - Card: `4000 0000 0000 0002`
   - CVV: `123`
   - Expiry: Any future date

**Verification**:
- [ ] Payment page loads correctly
- [ ] Payment succeeds/fails as expected
- [ ] Redirect after payment works
- [ ] Webhook received within 5 seconds

### Step 3: Test Webhook Processing

**Manual Webhook Test** (using curl):

```bash
# Generate signature
WEBHOOK_SECRET="your_webhook_secret"
BODY='{"event":"subscription.charged","payload":{"subscription":{"entity":{"id":"sub_test123","status":"active","plan_id":"plan_test123","notes":{"builder_id":"user_id_here"}}}}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')

curl -X POST http://localhost:3000/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: $SIGNATURE" \
  -d "$BODY"
```

**Verification**:
- [ ] Webhook signature verified
- [ ] Builder ID extracted correctly
- [ ] Database updated
- [ ] Response: `{ "received": true }`

---

## Automated Testing Scripts

### Test Script 1: Subscription Creation Test

Create file: `tests/pricing/subscription-creation.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Razorpay Subscription Creation', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup: Create test user and get auth token
    // ... authentication setup
  });

  it('should create starter monthly subscription', async () => {
    const response = await fetch(`${API_URL}/api/rzp/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        plan: 'starter',
        annual: false,
        email: 'test@example.com',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('short_url');
    expect(data.status).toBe('created');

    // Verify database
    const dbRecord = await checkDatabase(data.id);
    expect(dbRecord.plan).toBe('starter');
    expect(dbRecord.billing_cycle).toBe('monthly');
  });

  it('should create professional annual subscription', async () => {
    const response = await fetch(`${API_URL}/api/rzp/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        plan: 'professional',
        annual: true,
        email: 'test@example.com',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Verify correct annual plan ID used
    const dbRecord = await checkDatabase(data.id);
    expect(dbRecord.billing_cycle).toBe('yearly');
    expect(dbRecord.metadata.plan).toBe('professional');
  });

  it('should reject non-builder users', async () => {
    // Test with buyer role user
    const response = await fetch(`${API_URL}/api/rzp/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerAuthToken}`,
      },
      body: JSON.stringify({
        plan: 'starter',
        annual: false,
      }),
    });

    expect(response.status).toBe(403);
  });

  it('should handle missing plan IDs gracefully', async () => {
    // Test with invalid plan
    const response = await fetch(`${API_URL}/api/rzp/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        plan: 'invalid_plan',
        annual: false,
      }),
    });

    // Should default to professional or return error
    expect([200, 400, 500]).toContain(response.status);
  });
});
```

### Test Script 2: Webhook Processing Test

Create file: `tests/pricing/webhook-processing.test.ts`

```typescript
import crypto from 'crypto';

describe('Razorpay Webhook Processing', () => {
  const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  function generateSignature(body: string): string {
    return crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
  }

  it('should process subscription.charged event', async () => {
    const payload = {
      event: 'subscription.charged',
      payload: {
        subscription: {
          entity: {
            id: 'sub_test123',
            status: 'active',
            plan_id: 'plan_test123',
            current_start: Math.floor(Date.now() / 1000),
            current_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
            notes: {
              builder_id: 'test_user_id',
              plan: 'starter',
            },
          },
        },
      },
    };

    const body = JSON.stringify(payload);
    const signature = generateSignature(body);

    const response = await fetch(`${API_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
      },
      body,
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);

    // Verify database updated
    const dbRecord = await checkDatabase('sub_test123');
    expect(dbRecord.status).toBe('active');
  });

  it('should reject invalid signature', async () => {
    const payload = { event: 'test', payload: {} };
    const body = JSON.stringify(payload);
    const invalidSignature = 'invalid_signature';

    const response = await fetch(`${API_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': invalidSignature,
      },
      body,
    });

    expect(response.status).toBe(400);
  });

  it('should handle payment.failed event', async () => {
    const payload = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_test123',
            subscription_id: 'sub_test123',
            status: 'failed',
          },
        },
      },
    };

    const body = JSON.stringify(payload);
    const signature = generateSignature(body);

    const response = await fetch(`${API_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
      },
      body,
    });

    expect(response.status).toBe(200);

    // Verify subscription status updated to past_due
    const dbRecord = await checkDatabase('sub_test123');
    expect(dbRecord.status).toBe('past_due');
  });
});
```

---

## Database Verification

### SQL Queries for Testing

**1. Check Subscription Record**:
```sql
SELECT
  us.id,
  us.user_id,
  us.razorpay_subscription_id,
  us.razorpay_customer_id,
  us.status,
  us.billing_cycle,
  us.current_period_start,
  us.current_period_end,
  us.metadata->>'plan' as plan_name,
  us.metadata->>'razorpay_plan_id' as plan_id,
  us.created_at,
  us.updated_at
FROM user_subscriptions us
WHERE us.user_id = 'YOUR_TEST_USER_ID'
ORDER BY us.created_at DESC
LIMIT 1;
```

**2. Verify Plan Mapping**:
```sql
SELECT
  us.metadata->>'plan' as plan_name,
  us.metadata->>'razorpay_plan_id' as razorpay_plan_id,
  us.billing_cycle,
  CASE
    WHEN us.metadata->>'plan' = 'starter' AND us.billing_cycle = 'monthly'
      THEN 'plan_R10vbRMpp1REnR'
    WHEN us.metadata->>'plan' = 'starter' AND us.billing_cycle = 'yearly'
      THEN 'plan_R1119eAytZrt4K'
    WHEN us.metadata->>'plan' = 'professional' AND us.billing_cycle = 'monthly'
      THEN 'plan_R10wrI9bH8Uj7s'
    WHEN us.metadata->>'plan' = 'professional' AND us.billing_cycle = 'yearly'
      THEN 'plan_R112vIHWdH1YaL'
    WHEN us.metadata->>'plan' = 'enterprise' AND us.billing_cycle = 'monthly'
      THEN 'plan_Rl0yjA9bcQrsAn'
    WHEN us.metadata->>'plan' = 'enterprise' AND us.billing_cycle = 'yearly'
      THEN 'plan_R114Se4JD0v3k0'
  END as expected_plan_id,
  CASE
    WHEN us.metadata->>'razorpay_plan_id' =
      CASE
        WHEN us.metadata->>'plan' = 'starter' AND us.billing_cycle = 'monthly'
          THEN 'plan_R10vbRMpp1REnR'
        WHEN us.metadata->>'plan' = 'starter' AND us.billing_cycle = 'yearly'
          THEN 'plan_R1119eAytZrt4K'
        WHEN us.metadata->>'plan' = 'professional' AND us.billing_cycle = 'monthly'
          THEN 'plan_R10wrI9bH8Uj7s'
        WHEN us.metadata->>'plan' = 'professional' AND us.billing_cycle = 'yearly'
          THEN 'plan_R112vIHWdH1YaL'
        WHEN us.metadata->>'plan' = 'enterprise' AND us.billing_cycle = 'monthly'
          THEN 'plan_Rl0yjA9bcQrsAn'
        WHEN us.metadata->>'plan' = 'enterprise' AND us.billing_cycle = 'yearly'
          THEN 'plan_R114Se4JD0v3k0'
      END
    THEN '✅ CORRECT'
    ELSE '❌ MISMATCH'
  END as verification
FROM user_subscriptions us
WHERE us.user_id = 'YOUR_TEST_USER_ID'
ORDER BY us.created_at DESC;
```

**3. Check Webhook Events**:
```sql
SELECT
  we.id,
  we.source,
  we.event_type,
  we.payload->>'event' as razorpay_event,
  we.payload->'payload'->'subscription'->'entity'->>'id' as subscription_id,
  we.created_at
FROM webhook_events we
WHERE we.source = 'razorpay'
ORDER BY we.created_at DESC
LIMIT 10;
```

**4. Verify Subscription Status Flow**:
```sql
SELECT
  us.razorpay_subscription_id,
  us.status,
  us.updated_at,
  COUNT(we.id) as webhook_count,
  MAX(we.created_at) as last_webhook
FROM user_subscriptions us
LEFT JOIN webhook_events we ON we.payload->'payload'->'subscription'->'entity'->>'id' = us.razorpay_subscription_id
WHERE us.user_id = 'YOUR_TEST_USER_ID'
GROUP BY us.razorpay_subscription_id, us.status, us.updated_at
ORDER BY us.updated_at DESC;
```

---

## Webhook Testing

### Test Webhook Events Manually

**1. Subscription Charged Event**:
```bash
# Create test payload
PAYLOAD='{
  "event": "subscription.charged",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_TEST123",
        "status": "active",
        "plan_id": "plan_R10vbRMpp1REnR",
        "current_start": 1700000000,
        "current_end": 1702592000,
        "notes": {
          "builder_id": "YOUR_TEST_USER_ID",
          "plan": "starter",
          "annual": "false"
        }
      }
    }
  }
}'

# Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$RAZORPAY_WEBHOOK_SECRET" | sed 's/^.* //')

# Send webhook
curl -X POST http://localhost:3000/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**2. Payment Failed Event**:
```bash
PAYLOAD='{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_TEST123",
        "subscription_id": "sub_TEST123",
        "status": "failed",
        "amount": 99900
      }
    }
  }
}'
# ... (generate signature and send)
```

**3. Subscription Cancelled Event**:
```bash
PAYLOAD='{
  "event": "subscription.cancelled",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_TEST123",
        "status": "cancelled",
        "notes": {
          "builder_id": "YOUR_TEST_USER_ID"
        }
      }
    }
  }
}'
# ... (generate signature and send)
```

---

## Edge Cases & Error Handling

### Test Cases to Verify

1. **Missing Environment Variables**:
   - [ ] API returns 500 if `RAZORPAY_KEY_ID` missing
   - [ ] API returns 500 if plan IDs missing
   - [ ] Error message is clear and actionable

2. **Invalid Plan Names**:
   - [ ] Unknown plan defaults to professional
   - [ ] Warning logged for unknown plans

3. **Unauthorized Access**:
   - [ ] Non-authenticated users get 401
   - [ ] Non-builder users get 403
   - [ ] Error messages are clear

4. **Database Failures**:
   - [ ] Subscription still created in Razorpay if DB fails
   - [ ] Error logged but doesn't break flow
   - [ ] Retry mechanism works

5. **Webhook Signature Failures**:
   - [ ] Invalid signature returns 400
   - [ ] Missing signature returns 400
   - [ ] Valid signature processes correctly

6. **Duplicate Subscriptions**:
   - [ ] Same user can't create duplicate active subscriptions
   - [ ] Database upsert works correctly
   - [ ] Conflict resolution works

---

## Production Readiness Checklist

### Pre-Production Verification

- [ ] **Environment Variables**:
  - [ ] All 6 plan IDs configured
  - [ ] Live Razorpay keys set
  - [ ] Webhook secret configured
  - [ ] Webhook URL set in Razorpay dashboard

- [ ] **Plan IDs Verified**:
  - [ ] Starter monthly: `plan_R10vbRMpp1REnR`
  - [ ] Starter annual: `plan_R1119eAytZrt4K`
  - [ ] Professional monthly: `plan_R10wrI9bH8Uj7s`
  - [ ] Professional annual: `plan_R112vIHWdH1YaL`
  - [ ] Enterprise monthly: `plan_Rl0yjA9bcQrsAn`
  - [ ] Enterprise annual: `plan_R114Se4JD0v3k0`

- [ ] **Webhook Configuration**:
  - [ ] Webhook URL: `https://tharaga.co.in/api/webhooks/razorpay`
  - [ ] All events enabled:
    - [ ] `subscription.activated`
    - [ ] `subscription.charged`
    - [ ] `subscription.cancelled`
    - [ ] `payment.captured`
    - [ ] `payment.failed`
    - [ ] `invoice.paid`

- [ ] **Database Schema**:
  - [ ] `user_subscriptions` table exists
  - [ ] All required columns present
  - [ ] Indexes created for performance

- [ ] **Code Verification**:
  - [ ] Plan mapping logic correct
  - [ ] Error handling comprehensive
  - [ ] Logging in place
  - [ ] Builder ID stored in notes

- [ ] **Testing Completed**:
  - [ ] All 3 tiers tested (starter/professional/enterprise)
  - [ ] Both billing cycles tested (monthly/annual)
  - [ ] Payment success flow tested
  - [ ] Payment failure flow tested
  - [ ] Webhook processing tested
  - [ ] Database updates verified

- [ ] **Monitoring Setup**:
  - [ ] Error tracking configured (Sentry/LogRocket)
  - [ ] Webhook event logging
  - [ ] Subscription status monitoring
  - [ ] Payment failure alerts

---

## Quick Test Commands

### Test Subscription Creation
```bash
# Test Starter Monthly
curl -X POST https://tharaga.co.in/api/rzp/create-subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"plan":"starter","annual":false}'

# Test Professional Annual
curl -X POST https://tharaga.co.in/api/rzp/create-subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"plan":"professional","annual":true}'
```

### Verify Database
```sql
-- Quick check
SELECT
  metadata->>'plan' as plan,
  billing_cycle,
  status,
  razorpay_subscription_id,
  created_at
FROM user_subscriptions
ORDER BY created_at DESC
LIMIT 5;
```

---

## Success Criteria

✅ **Flow is working correctly if**:
1. Subscription created with correct plan ID
2. Database record created immediately
3. Payment page loads correctly
4. Webhook received within 5 seconds of payment
5. Database updated with correct status
6. User gets appropriate access/permissions
7. Error cases handled gracefully
8. All logs show expected behavior

---

## Support & Troubleshooting

If tests fail:
1. Check server logs for errors
2. Verify environment variables
3. Check Razorpay dashboard for subscription status
4. Verify webhook is configured correctly
5. Check database for records
6. Review webhook event logs

For issues, check:
- Server logs: `app/api/rzp/create-subscription` and `app/api/webhooks/razorpay`
- Razorpay Dashboard → Subscriptions
- Database: `user_subscriptions` and `webhook_events` tables

