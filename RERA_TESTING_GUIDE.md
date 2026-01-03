# RERA System Testing Guide

## ✅ Integration Complete

Both verification systems are now connected to the internal partner API service:

1. **`RERAVerificationEngine`** (Advanced) - Already connected ✅
2. **`ReraVerificationService`** (Older) - Now updated ✅

## System Status

### ✅ Code Integration
- [x] Older service updated to use internal partner API
- [x] Both services use same data source
- [x] No external API dependencies
- [x] All linting checks passed

### ✅ Frontend Integration
- [x] Dashboard uses `/api/rera/verify` endpoint
- [x] Endpoint uses advanced `RERAVerificationEngine`
- [x] Proper error handling in UI

## Testing Instructions

### Prerequisites

1. **Environment Variables** (in `app/.env.production` or `app/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_SYNTHETIC_RERA=true
RERA_PARTNER_API_URL=https://wedevtjjmdvngyshqdro.supabase.co/functions/v1/rera-partner
RERA_PARTNER_API_KEY=internal-service-key
RERA_MONITOR_API_KEY=qYofRsFAXnbNhAk8odyASeTym5cfmx/SKabs4QA1wgE=
```

2. **Database Migrations Applied**:
   - `053_comprehensive_rera_verification_system.sql`
   - `054_setup_rera_monitoring_cron.sql`

3. **Supabase Edge Function Deployed**:
   - `supabase/functions/rera-monitor/index.ts`

### Test 1: Direct Service Tests (No Server Required)

```bash
cd app
npx tsx scripts/test-rera-direct.ts
```

**Expected Output**:
- ✅ Database Connection
- ✅ Partner API Service
- ✅ Verification Engine
- ✅ Older Service (now using internal API)
- ✅ Monitoring Service

### Test 2: API Endpoint Tests (Server Required)

**Step 1**: Start Next.js server
```bash
cd app
npm run dev
```

**Step 2**: Test endpoints (in another terminal)

#### Test POST /api/rera/verify
```bash
curl -X POST http://localhost:3000/api/rera/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reraNumber": "TN/01/Building/12345/2024",
    "state": "Tamil Nadu",
    "type": "builder"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "verified": true,
  "verificationMethod": "partner",
  "confidence": 0.95,
  "source": "partner_api",
  "data": {
    "reraNumber": "TN/01/BUILDING/12345/2024",
    "registeredName": "...",
    "status": "active",
    ...
  }
}
```

#### Test GET /api/rera/verify
```bash
curl "http://localhost:3000/api/rera/verify?reraNumber=TN/01/Building/12345/2024&state=Tamil%20Nadu"
```

#### Test Health Check
```bash
curl http://localhost:3000/api/rera/test
```

### Test 3: Dashboard Testing (Manual)

1. **Start Server**:
   ```bash
   cd app
   npm run dev
   ```

2. **Navigate to Dashboard**:
   - URL: `http://localhost:3000/(dashboard)/builder/rera-compliance`
   - Or: Login as builder → Navigate to RERA Compliance

3. **Test Verification Flow**:
   - Click "Verify New RERA Number" button
   - Enter RERA number: `TN/01/Building/12345/2024`
   - Select state: `Tamil Nadu`
   - Optionally enter project name and promoter name
   - Click "Verify"
   - Check results:
     - ✅ Success message if verified
     - ✅ Registration appears in list
     - ✅ Badge shows verification status

4. **Test Dashboard Features**:
   - View registrations list
   - Check expiry dates
   - View alerts
   - See statistics
   - Refresh data

### Test 4: Partner API Service (Direct)

```typescript
import { reraPartnerAPIService } from '@/lib/rera/partner-api-service';

const result = await reraPartnerAPIService.verify({
  rera_number: 'TN/01/Building/12345/2024',
  state: 'Tamil Nadu',
  type: 'builder',
});

console.log(result);
```

## Verification Checklist

### ✅ Integration Verification
- [x] Both services use `reraPartnerAPIService`
- [x] No external HTTP calls in older service
- [x] Consistent data format
- [x] Error handling works

### ✅ API Endpoint Verification
- [ ] POST `/api/rera/verify` returns success
- [ ] GET `/api/rera/verify` returns cached data
- [ ] Invalid RERA numbers return errors
- [ ] Health check endpoint works

### ✅ Dashboard Verification
- [ ] Dashboard loads without errors
- [ ] Verification form submits successfully
- [ ] Results display correctly
- [ ] Alerts show up
- [ ] Statistics are accurate

### ✅ Database Verification
- [ ] Registrations are saved
- [ ] Verification logs are created
- [ ] Alerts are generated
- [ ] Cache works correctly

## Troubleshooting

### Issue: "Supabase credentials not configured"
**Solution**: Ensure environment variables are set in `.env.local` or `.env.production`

### Issue: "Table does not exist"
**Solution**: Apply database migrations:
```bash
# In Supabase dashboard or via CLI
supabase migration up
```

### Issue: "Partner API unavailable"
**Solution**: 
- Check `RERA_PARTNER_API_URL` is set correctly
- Verify internal partner service is working
- Check `USE_SYNTHETIC_RERA` is set for testing

### Issue: Dashboard shows no data
**Solution**:
- Verify user is logged in as builder
- Check builder profile exists
- Ensure RLS policies allow access

## Next Steps After Testing

1. **Enable Real Scraping**:
   - Set `USE_SYNTHETIC_RERA=false`
   - Monitor scraping performance
   - Handle rate limiting

2. **Monitor Cron Jobs**:
   - Check Supabase cron jobs are running
   - Verify monitoring service is called
   - Review generated alerts

3. **Production Deployment**:
   - Set all environment variables
   - Deploy Edge Functions
   - Test all endpoints
   - Monitor logs

## Test Results Template

```
Date: ___________
Tester: ___________

Direct Service Tests:
[ ] Database Connection
[ ] Partner API Service
[ ] Verification Engine
[ ] Older Service
[ ] Monitoring Service

API Endpoint Tests:
[ ] POST /api/rera/verify (valid)
[ ] POST /api/rera/verify (invalid)
[ ] GET /api/rera/verify
[ ] GET /api/rera/test

Dashboard Tests:
[ ] Dashboard loads
[ ] Verification form works
[ ] Results display
[ ] Alerts show
[ ] Statistics accurate

Issues Found:
_______________________________________
_______________________________________

Notes:
_______________________________________
_______________________________________
```











































