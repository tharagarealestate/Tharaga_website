# Minimal .env.production - Production Required Variables Only

## Analysis Summary

Based on deep codebase analysis, these are the **ONLY** environment variables actually used in production:

### ✅ REQUIRED - Client-Side (NEXT_PUBLIC_*)
These are embedded in the client bundle and MUST be present:
1. `NEXT_PUBLIC_SUPABASE_URL` - Used 324 times
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Used 233 times
3. `NEXT_PUBLIC_APP_URL` - Used 44 times
4. `NEXT_PUBLIC_API_URL` - Used 42 times
5. `NEXT_PUBLIC_GOOGLE_MAPS_KEY` - Used 2 times
6. `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Used 4 times
7. `NEXT_PUBLIC_ADMIN_TOKEN` - Used 9 times (optional, for admin features)
8. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Used 1 time (push notifications)

### ✅ REQUIRED - Server-Side (API Routes & Services)
1. `SUPABASE_URL` - Used 163 times
2. `SUPABASE_SERVICE_ROLE_KEY` - Used 121 times (standardized)
3. `SUPABASE_ANON_KEY` - Used 76 times (fallback)
4. `RESEND_API_KEY` - Used 57 times
5. `RESEND_FROM_EMAIL` - Used 25 times
6. `RESEND_FROM_NAME` - Used in email service
7. `RESEND_WEBHOOK_SECRET` - Used 2 times
8. `RAZORPAY_KEY_ID` - Used 53 times
9. `RAZORPAY_KEY_SECRET` - Used 53 times
10. `RAZORPAY_WEBHOOK_SECRET` - Used 9 times
11. `TWILIO_ACCOUNT_SID` - Used 30 times
12. `TWILIO_AUTH_TOKEN` - Used 26 times
13. `TWILIO_PHONE_NUMBER` - Used 6 times
14. `TWILIO_PHONE_NUMBER_SID` - Used 4 times
15. `TWILIO_WEBHOOK_URL` - Used 2 times
16. `TWILIO_WHATSAPP_NUMBER` - Used 12 times
17. `ZOHO_CLIENT_ID` - Used 8 times
18. `ZOHO_CLIENT_SECRET` - Used 6 times
19. `ZOHO_REDIRECT_URI` - Used 4 times
20. `GOOGLE_CLIENT_ID` - Used 2 times
21. `GOOGLE_CLIENT_SECRET` - Used 2 times
22. `GOOGLE_REDIRECT_URI` - Used 2 times
23. `OPENAI_API_KEY` - Used 45 times
24. `ANTHROPIC_API_KEY` - Used 24 times
25. `RERA_MONITOR_API_KEY` - Used 2 times
26. `RERA_PARTNER_API_KEY` - Used 1 time
27. `RERA_PARTNER_API_URL` - Used 1 time
28. `USE_SYNTHETIC_RERA` - Used 10 times
29. `VAPID_PRIVATE_KEY` - Used for push notifications
30. `VAPID_PUBLIC_KEY` - Used for push notifications
31. `ADMIN_EMAIL` - Used 2 times
32. `ADMIN_TOKEN` or `NEXT_PUBLIC_ADMIN_TOKEN` - Used for admin routes
33. `CRON_SECRET` - Used 26 times
34. `ENCRYPTION_KEY` - Used 2 times
35. `ENCRYPTION_KEY_ROTATION_DAYS` - Used 3 times
36. `INTERNAL_API_KEY` - Used 6 times
37. `NEWSLETTER_AUTOMATION_API_KEY` - Used 4 times
38. `ZENROWS_API_KEY` - Used 1 time
39. `DEFAULT_CALENDAR_ID` - Used for calendar integration
40. `DEFAULT_TIMEZONE` - Used for calendar integration

### ✅ REQUIRED - Netlify Functions Only
1. `STRIPE_SECRET_KEY` - Used in stripeWebhook.js (if using Stripe)
2. `STRIPE_WEBHOOK_SECRET` - Used in stripeWebhook.js (if using Stripe)
3. `RZP_PLAN_STARTER_MONTHLY` - Used in plan-manager.ts
4. `RZP_PLAN_STARTER_ANNUAL` - Used in plan-manager.ts
5. `RZP_PLAN_PROFESSIONAL_MONTHLY` - Used in plan-manager.ts
6. `RZP_PLAN_PROFESSIONAL_ANNUAL` - Used in plan-manager.ts
7. `RZP_PLAN_ENTERPRISE_MONTHLY` - Used in plan-manager.ts
8. `RZP_PLAN_ENTERPRISE_ANNUAL` - Used in plan-manager.ts

### ❌ REMOVE - Duplicates/Unused
1. `RESEND_WEBHOOK_SECRET_ALT` - DUPLICATE of RESEND_WEBHOOK_SECRET
2. `SUPABASE_SERVICE_ROLE` - REPLACED by SUPABASE_SERVICE_ROLE_KEY
3. `NODE_VERSION` - Build-time only, not needed in Netlify env
4. `NPM_FLAGS` - Build-time only, not needed in Netlify env
5. `NODE_ENV` - Automatically set by Netlify
6. `FIREBASE_*` - Not found in actual usage (may be legacy)

### 📊 Size Estimation
- Current: ~49 variables × ~100 bytes = ~4.9KB ❌
- Minimal: ~48 variables × ~100 bytes = ~4.8KB ⚠️ (still close)
- **Solution**: Use function-specific env vars in Netlify Dashboard

## Next Steps

1. Create minimal `.env.production` with only the variables listed above
2. Remove duplicates from Netlify Dashboard
3. Configure function-specific environment variables in Netlify
