# RERA System Deployment Guide

Complete step-by-step guide to deploy and test the RERA verification system.

## ✅ Prerequisites

- Supabase project set up
- Supabase CLI installed (`npm install -g supabase`)
- Environment variables configured
- Database migrations applied

---

## 📋 Step 1: Apply Database Migrations

The RERA system migrations should already be applied. Verify:

```bash
# Check if migration 053 is applied
supabase migration list

# If not applied, apply it
supabase migration up
```

**Migration Files:**
- `053_comprehensive_rera_verification_system.sql` - Main RERA schema
- `054_setup_rera_monitoring_cron.sql` - Cron job setup

---

## 📋 Step 2: Deploy Edge Function

Deploy the RERA monitoring edge function:

```bash
# Navigate to project root
cd E:\Tharaga_website

# Deploy the edge function
supabase functions deploy rera-monitor

# Verify deployment
supabase functions list
```

**Expected Output:**
```
Function rera-monitor deployed successfully
```

---

## 📋 Step 3: Configure Environment Variables

### Local Development

Create/update `app/.env.local`:

```env
# Required (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# RERA Configuration
USE_SYNTHETIC_RERA=true  # Set to false for real scraping
RERA_MONITOR_API_KEY=your-generated-secret-key  # Generate with: openssl rand -base64 32

# Optional: Partner API
RERA_PARTNER_API_URL=https://api.rera-provider.com/api/v1
RERA_PARTNER_API_KEY=your-partner-api-key
```

### Production (Vercel/Netlify)

1. **Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all variables for Production, Preview, and Development

2. **Netlify:**
   - Go to Site Settings → Environment Variables
   - Add all variables

3. **Supabase Edge Functions:**
   ```bash
   supabase secrets set RERA_MONITOR_API_KEY=your-generated-secret-key
   ```

---

## 📋 Step 4: Verify Cron Job Setup

The cron job should be automatically set up by migration `054`. Verify:

```sql
-- Check if cron jobs are scheduled
SELECT * FROM cron.job WHERE jobname LIKE 'rera%';

-- Expected output:
-- jobname: rera-daily-monitoring
-- schedule: 30 20 * * *
-- command: SELECT run_rera_monitoring();
```

**Manual Test:**
```sql
-- Test the monitoring function manually
SELECT trigger_rera_monitoring();

-- Expected output:
-- "RERA monitoring triggered successfully at 2024-01-XX XX:XX:XX"
```

---

## 📋 Step 5: Test the System

### Test 1: System Health Check

Visit or call:
```
GET https://your-domain.com/api/rera/test
```

**Expected Response:**
```json
{
  "timestamp": "2024-01-XX...",
  "tests": {
    "database": { "status": "passed" },
    "tables": { "status": "passed" },
    "verificationEngine": { "status": "passed" },
    "monitoringService": { "status": "passed" },
    "environment": { "status": "passed" },
    "databaseFunctions": { "status": "passed" }
  },
  "summary": {
    "passed": 6,
    "failed": 0,
    "warnings": 0
  },
  "overallStatus": "all_passed"
}
```

### Test 2: RERA Verification

**Via API:**
```bash
curl -X POST https://your-domain.com/api/rera/verify \
  -H "Content-Type: application/json" \
  -d '{
    "rera_number": "TN/01/Building/0001/2016",
    "state": "Tamil Nadu",
    "project_name": "Test Project",
    "promoter_name": "Test Builder"
  }'
```

**Via Dashboard:**
1. Navigate to `/builder/rera-compliance`
2. Click "Verify RERA"
3. Enter a RERA number
4. Submit and check results

### Test 3: Monitoring Endpoint

```bash
curl -X POST https://your-domain.com/api/rera/monitor \
  -H "Authorization: Bearer your-RERA_MONITOR_API_KEY" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-XX...",
  "results": {
    "checked": 10,
    "expired": 0,
    "expiringSoon": 2,
    "statusChanged": 0,
    "alertsCreated": 2,
    "errors": []
  }
}
```

### Test 4: Edge Function

```bash
# Test the edge function directly
curl -X POST https://your-project.supabase.co/functions/v1/rera-monitor \
  -H "Authorization: Bearer your-service-role-key" \
  -H "Content-Type: application/json"
```

---

## 📋 Step 6: Enable Real Scraping (Production)

When ready for production:

1. **Set Environment Variable:**
   ```env
   USE_SYNTHETIC_RERA=false
   ```

2. **Test with Real RERA Number:**
   ```bash
   curl -X POST https://your-domain.com/api/rera/verify \
     -H "Content-Type: application/json" \
     -d '{
       "rera_number": "TN/01/Building/0001/2016",
       "state": "Tamil Nadu"
     }'
   ```

3. **Monitor Logs:**
   - Check Supabase logs for scraping attempts
   - Verify data is being fetched from RERA portal

---

## 📋 Step 7: Verify Cron Job Execution

### Check Cron Job Status

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job run history
SELECT * FROM cron.job_run_details 
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname LIKE 'rera%'
)
ORDER BY start_time DESC
LIMIT 10;
```

### Manual Trigger (Testing)

```sql
-- Trigger monitoring manually
SELECT trigger_rera_monitoring();

-- Check if alerts were created
SELECT * FROM rera_alerts 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 🔍 Troubleshooting

### Issue: Cron Job Not Running

**Solution:**
1. Verify pg_cron is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check cron job exists:
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE 'rera%';
   ```

3. Manually trigger to test:
   ```sql
   SELECT trigger_rera_monitoring();
   ```

### Issue: Edge Function Not Deploying

**Solution:**
```bash
# Check Supabase CLI is logged in
supabase login

# Check project link
supabase link --project-ref your-project-ref

# Try deploying again
supabase functions deploy rera-monitor --no-verify-jwt
```

### Issue: "Unauthorized" on Monitor Endpoint

**Solution:**
1. Verify `RERA_MONITOR_API_KEY` is set
2. Check Authorization header format: `Bearer your-key`
3. Test with curl:
   ```bash
   curl -X POST https://your-domain.com/api/rera/monitor \
     -H "Authorization: Bearer your-key"
   ```

### Issue: Verification Always Returns Synthetic Data

**Solution:**
1. Check `USE_SYNTHETIC_RERA` environment variable
2. Set to `false` for real scraping
3. Verify RERA portal is accessible
4. Check network/firewall settings

---

## 📊 Monitoring & Maintenance

### Daily Checks

1. **Check Alerts:**
   ```sql
   SELECT COUNT(*) FROM rera_alerts WHERE resolved = false;
   ```

2. **Check Expiring RERA:**
   ```sql
   SELECT COUNT(*) FROM rera_registrations 
   WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
   AND status = 'active';
   ```

### Weekly Checks

1. **Review Verification Logs:**
   ```sql
   SELECT * FROM rera_verification_logs 
   WHERE verified_at > NOW() - INTERVAL '7 days'
   ORDER BY verified_at DESC;
   ```

2. **Check System Health:**
   ```bash
   curl https://your-domain.com/api/rera/test
   ```

### Monthly Maintenance

1. **Clean Old Logs:**
   ```sql
   DELETE FROM rera_verification_logs 
   WHERE verified_at < NOW() - INTERVAL '90 days';
   ```

2. **Archive Resolved Alerts:**
   ```sql
   DELETE FROM rera_alerts 
   WHERE resolved = true 
   AND resolved_at < NOW() - INTERVAL '30 days';
   ```

---

## ✅ Deployment Checklist

- [ ] Database migrations applied
- [ ] Edge function deployed
- [ ] Environment variables configured
- [ ] Cron job scheduled and verified
- [ ] System health check passed
- [ ] RERA verification tested
- [ ] Monitoring endpoint tested
- [ ] Real scraping enabled (if applicable)
- [ ] Dashboard accessible at `/builder/rera-compliance`
- [ ] Badge displays on property cards

---

## 🎉 Success Indicators

You'll know the system is working when:

1. ✅ `/api/rera/test` returns all tests passed
2. ✅ RERA verification creates records in database
3. ✅ RERA badge appears on property cards
4. ✅ Compliance dashboard shows registrations
5. ✅ Cron job runs daily (check logs)
6. ✅ Alerts are created for expiring RERA

---

## 📞 Support

If you encounter issues:

1. Check the test endpoint: `/api/rera/test`
2. Review Supabase logs
3. Check browser console for errors
4. Verify environment variables
5. Review this guide's troubleshooting section

---

## 🚀 Next Steps

After successful deployment:

1. **Train Builders:** Show them how to use the compliance dashboard
2. **Monitor Usage:** Track verification requests and success rates
3. **Optimize:** Adjust scraping intervals based on portal rate limits
4. **Expand:** Add support for more states as needed

---

**Last Updated:** 2024-01-XX
**Version:** 1.0.0















