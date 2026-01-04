# Single-Tier Pricing System - Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Database Migration
- [ ] Execute `supabase/migrations/056_single_tier_pricing_system.sql` in Supabase SQL Editor
- [ ] Verify `tharaga_plan` table has 1 row with ₹4,999 pricing
- [ ] Verify `builder_subscriptions` table structure is correct
- [ ] Test `start_trial()` function with a test user
- [ ] Verify RLS policies are active

### 2. Environment Variables
- [ ] Add `RAZORPAY_KEY_ID` (Test: `rzp_test_...`, Live: `rzp_live_...`)
- [ ] Add `RAZORPAY_KEY_SECRET` (Keep secure!)
- [ ] Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Public key for frontend)
- [ ] Add `RAZORPAY_WEBHOOK_SECRET` (From Razorpay dashboard)
- [ ] Verify all variables are set in development environment
- [ ] Verify all variables are set in production environment

### 3. Razorpay Configuration
- [ ] Create Razorpay account (if not exists)
- [ ] Complete KYC verification (for live mode)
- [ ] Generate API keys (test mode first)
- [ ] Create webhook in Razorpay dashboard
- [ ] Set webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
- [ ] Subscribe to required events:
  - [ ] `subscription.activated`
  - [ ] `subscription.charged`
  - [ ] `subscription.cancelled`
  - [ ] `subscription.paused`
  - [ ] `subscription.resumed`
  - [ ] `payment.failed`
- [ ] Copy webhook secret to environment variables

### 4. Code Deployment
- [ ] All files committed to repository
- [ ] No linter errors
- [ ] Build succeeds locally (`npm run build`)
- [ ] Deploy to staging environment
- [ ] Test in staging
- [ ] Deploy to production

### 5. Testing
- [ ] Test signup flow → Trial starts automatically
- [ ] Test trial dashboard → Widget displays correctly
- [ ] Test upgrade flow → Razorpay checkout opens
- [ ] Test payment (₹1 test) → Subscription activates
- [ ] Test webhook → Events received and processed
- [ ] Test cancellation → Subscription cancels correctly
- [ ] Test billing cycle change → Monthly ↔ Yearly

---

## 🚀 Deployment Steps

### Step 1: Database (5 minutes)
```sql
-- Execute in Supabase SQL Editor
-- File: supabase/migrations/056_single_tier_pricing_system.sql
```

### Step 2: Environment Variables (5 minutes)
```env
# Add to .env.local (development)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Add to Netlify/Vercel (production)
# Same variables but with LIVE keys
```

### Step 3: Razorpay Setup (10 minutes)
1. Log in to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate Test Keys (for development)
4. Go to Settings → Webhooks
5. Create webhook with URL: `https://yourdomain.com/api/webhooks/razorpay`
6. Subscribe to all required events
7. Copy webhook secret

### Step 4: Test Locally (15 minutes)
1. Start dev server: `npm run dev`
2. Sign up as builder
3. Verify trial starts
4. Test upgrade flow
5. Complete test payment
6. Verify webhook receives events

### Step 5: Deploy (10 minutes)
1. Push code to repository
2. Deploy to production
3. Update environment variables
4. Test production flow
5. Monitor for errors

---

## 🧪 Post-Deployment Testing

### Immediate Tests (First 30 minutes)
- [ ] Sign up new builder → Trial starts
- [ ] Complete test payment (₹1) → Subscription active
- [ ] Check webhook logs → Events received
- [ ] Check database → Records created correctly
- [ ] Check error logs → No critical errors

### 24-Hour Monitoring
- [ ] Monitor payment success rate (should be >95%)
- [ ] Monitor webhook delivery rate (should be >99%)
- [ ] Check for failed payments
- [ ] Review subscription cancellations
- [ ] Monitor server errors

---

## 🐛 Troubleshooting

### Issue: Trial Not Starting
**Check:**
- Database migration executed?
- `start_trial()` function exists?
- API route `/api/trial/subscribe` working?
- Check server logs for errors

### Issue: Payment Not Processing
**Check:**
- Razorpay keys correct?
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` set?
- Razorpay account activated?
- Check browser console for errors

### Issue: Webhook Not Receiving Events
**Check:**
- Webhook URL correct?
- Webhook secret matches?
- HTTPS enabled (required)?
- Check Razorpay webhook logs
- Test webhook with Razorpay test tool

### Issue: Subscription Not Activating
**Check:**
- Webhook received `subscription.activated`?
- Database connection working?
- Check `subscription_events` table
- Review server logs

---

## 📊 Success Criteria

✅ **Deployment Successful If:**
- Trial starts automatically on signup
- Upgrade flow works end-to-end
- Payment processes successfully
- Webhook receives and processes events
- Subscription status updates correctly
- No critical errors in logs

---

## 🎯 Go-Live Checklist

- [ ] All pre-deployment checks complete
- [ ] Database migration executed
- [ ] Environment variables set
- [ ] Razorpay configured
- [ ] Webhook tested
- [ ] Code deployed
- [ ] Production tested
- [ ] Monitoring active
- [ ] Team notified
- [ ] **READY TO LAUNCH! 🚀**

---

## 📞 Support Contacts

- **Razorpay Support**: support@razorpay.com
- **Supabase Support**: support@supabase.com
- **Internal Team**: [Your contact]

---

**Last Updated**: 2025-01-XX  
**Status**: Ready for Deployment  
**Estimated Time**: 45-60 minutes




