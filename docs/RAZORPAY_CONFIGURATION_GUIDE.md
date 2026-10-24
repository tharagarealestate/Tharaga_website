# Razorpay Configuration Guide for Tharaga Single-Tier Pricing

## Overview

This guide explains how to configure Razorpay for the Tharaga Pro subscription system (₹4,999/month with 14-day free trial).

---

## Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a business account
3. Complete KYC verification (required for live mode)
4. Verify your business details

---

## Step 2: Get API Keys

### Test Mode (Development)

1. Log in to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Key**
4. Copy:
   - **Key ID** (starts with `rzp_test_...`)
   - **Key Secret** (starts with `...` - shown only once!)

### Live Mode (Production)

1. Complete KYC verification
2. Go to **Settings** → **API Keys**
3. Click **Generate Live Key**
4. Copy:
   - **Key ID** (starts with `rzp_live_...`)
   - **Key Secret** (shown only once!)

---

## Step 3: Configure Webhook Secret

1. Go to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/razorpay`
   - **Events to Subscribe**:
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.cancelled`
     - `subscription.paused`
     - `subscription.resumed`
     - `payment.failed`
4. Click **Create Webhook**
5. Copy the **Webhook Secret** (starts with `whsec_...`)

---

## Step 4: Set Environment Variables

### Development (.env.local)

```env
# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Production (Netlify/Vercel)

1. Go to your hosting platform dashboard
2. Navigate to **Environment Variables**
3. Add all 4 variables:
   - `RAZORPAY_KEY_ID` (Live key)
   - `RAZORPAY_KEY_SECRET` (Live secret)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Live key - public)
   - `RAZORPAY_WEBHOOK_SECRET` (Webhook secret)

---

## Step 5: Test Webhook Locally (Optional)

### Using ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Add this to Razorpay webhook URL:
# https://abc123.ngrok.io/api/webhooks/razorpay
```

### Test Webhook Events:

1. Go to Razorpay Dashboard → **Webhooks**
2. Click on your webhook
3. Click **Send Test Event**
4. Select event type (e.g., `subscription.activated`)
5. Check your server logs for webhook receipt

---

## Step 6: Create Razorpay Plans (Automatic)

The system automatically creates Razorpay plans when needed:

- **Monthly Plan**: ₹4,999/month
- **Yearly Plan**: ₹49,992/year (₹4,166/month)

These are created automatically when a user converts from trial to paid.

**Manual Creation (Optional):**

If you want to create plans manually:

1. Go to **Products** → **Plans**
2. Click **Create Plan**
3. Configure:
   - **Name**: `Tharaga Pro - Monthly`
   - **Amount**: ₹4,999 (in paise: 499900)
   - **Interval**: Monthly
   - **Description**: Unlimited properties, AI leads, full automation
4. Repeat for yearly plan (₹49,992)

---

## Step 7: Payment Methods

Razorpay supports these payment methods by default:

- ✅ Credit/Debit Cards
- ✅ UPI
- ✅ Net Banking
- ✅ Wallets (Paytm, PhonePe, etc.)
- ✅ EMI

No additional configuration needed!

---

## Step 8: Testing the Flow

### Test Trial → Paid Conversion:

1. Sign up as a builder
2. Start 14-day free trial (automatic)
3. After trial starts, go to dashboard
4. Click "Upgrade to Tharaga Pro"
5. Select Monthly/Yearly
6. Use Razorpay test card:
   - **Card Number**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **Name**: Any name
7. Complete payment
8. Verify subscription status in dashboard

### Test Webhook Events:

1. Create a test subscription
2. In Razorpay Dashboard → **Subscriptions**
3. Find your test subscription
4. Manually trigger events:
   - Cancel subscription → Tests `subscription.cancelled`
   - Pause subscription → Tests `subscription.paused`
   - Resume subscription → Tests `subscription.resumed`

---

## Step 9: Go Live Checklist

Before switching to production:

- [ ] KYC verification completed
- [ ] Live API keys generated
- [ ] Webhook URL updated to production domain
- [ ] Webhook secret updated in environment variables
- [ ] Test payment with ₹1 (minimum test amount)
- [ ] Verify webhook events are received
- [ ] Test subscription cancellation
- [ ] Test billing cycle change
- [ ] Monitor error logs for 24 hours

---

## Step 10: Monitoring

### Key Metrics to Track:

1. **Payment Success Rate**: Should be >95%
2. **Webhook Delivery**: Check Razorpay Dashboard → Webhooks
3. **Failed Payments**: Monitor `payment.failed` events
4. **Subscription Churn**: Track cancellations

### Razorpay Dashboard:

- **Payments**: View all transactions
- **Subscriptions**: View active subscriptions
- **Webhooks**: View webhook delivery logs
- **Settlements**: View payouts to your bank

---

## Troubleshooting

### Webhook Not Receiving Events:

1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check server logs for errors
4. Test webhook with Razorpay test tool
5. Ensure HTTPS is enabled (required for production)

### Payment Failing:

1. Check API keys are correct
2. Verify account is activated
3. Check payment method is enabled
4. Review Razorpay error messages
5. Check bank account is verified

### Subscription Not Activating:

1. Check webhook is receiving `subscription.activated`
2. Verify database connection
3. Check subscription_events table for errors
4. Review server logs

---

## Security Best Practices

1. **Never commit API keys to Git**
2. **Use environment variables for all secrets**
3. **Rotate keys periodically**
4. **Use webhook signature verification** (already implemented)
5. **Enable IP whitelisting** (optional, in Razorpay settings)
6. **Monitor for suspicious activity**

---

## Support

- **Razorpay Support**: [support@razorpay.com](mailto:support@razorpay.com)
- **Documentation**: [https://razorpay.com/docs](https://razorpay.com/docs)
- **Status Page**: [https://status.razorpay.com](https://status.razorpay.com)

---

## Environment Variables Summary

```env
# Required for Backend
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Required for Frontend (Public)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

---

## Next Steps

1. ✅ Configure Razorpay account
2. ✅ Set environment variables
3. ✅ Test webhook locally
4. ✅ Test payment flow
5. ✅ Deploy to production
6. ✅ Monitor for 24 hours
7. ✅ Celebrate first paying customer! 🎉

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0  
**Status**: Production Ready




