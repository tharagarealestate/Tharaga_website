# 🎯 Property Upload System - Verification & Testing Guide

This guide provides step-by-step instructions to verify and test the Property Upload & Admin-Builder Management System after migrations have been applied.

---

## 📋 Pre-Verification Checklist

Before starting verification, ensure:
- ✅ Migrations `070_property_upload_admin_management.sql` and `071_property_upload_rls_policies.sql` have been executed
- ✅ Supabase credentials are configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- ✅ You have admin access to Supabase Dashboard

---

## 🔍 Step 1: Manual Database Verification

### 1.1 Verify Tables Exist

**Via Supabase Dashboard:**

1. Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/editor
2. Check that these tables exist in the left sidebar:
   - ✅ `property_upload_drafts`
   - ✅ `property_verification_history`
   - ✅ `builder_engagement_metrics`
   - ✅ `admin_activity_log`
   - ✅ `admin_builder_assignments`

**Via SQL Query:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'property_upload_drafts',
    'property_verification_history',
    'builder_engagement_metrics',
    'admin_activity_log',
    'admin_builder_assignments'
  )
ORDER BY table_name;
```

### 1.2 Verify Properties Table Columns

**Via SQL Query:**

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties'
  AND column_name IN (
    'uploaded_by_admin',
    'admin_user_id',
    'upload_source',
    'verification_status',
    'verification_notes',
    'verified_by_user_id',
    'verified_at',
    'property_metadata',
    'location_intelligence',
    'pricing_intelligence'
  )
ORDER BY column_name;
```

### 1.3 Verify Functions Exist

**Via SQL Query:**

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_builder_ranking',
    'update_property_draft_timestamp',
    'update_metrics_timestamp',
    'update_assignment_timestamp'
  )
ORDER BY routine_name;
```

### 1.4 Verify RLS Policies

**Via SQL Query:**

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'property_upload_drafts',
    'property_verification_history',
    'builder_engagement_metrics',
    'admin_activity_log',
    'admin_builder_assignments'
  )
ORDER BY tablename, policyname;
```

### 1.5 Verify RLS is Enabled

**Via SQL Query:**

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'property_upload_drafts',
    'property_verification_history',
    'builder_engagement_metrics',
    'admin_activity_log',
    'admin_builder_assignments'
  )
ORDER BY tablename;
```

**Expected Result:** All tables should have `rls_enabled = true`

---

## 🧪 Step 2: Automated Verification Script

### 2.1 Run Verification Script

```bash
node scripts/verify-property-upload-system.mjs
```

**Expected Output:**
- ✅ All tables verified
- ✅ All columns verified
- ✅ All functions verified
- ✅ RLS enabled on all tables

### 2.2 Review Results

The script will output:
- ✅ Passed checks
- ❌ Failed checks with error messages
- 📊 Summary report

---

## 🧪 Step 3: Test API Endpoints

### 3.1 Test Create Draft Endpoint

**Request:**
```bash
curl -X POST http://localhost:3000/api/properties/create-draft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "builder_id": "YOUR_BUILDER_ID",
    "uploaded_by_admin": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "draft": {
    "id": "uuid",
    "builder_id": "uuid",
    "status": "draft",
    "current_step": 1,
    "overall_completion_percentage": 0
  }
}
```

### 3.2 Test Save Draft Step Endpoint

**Request:**
```bash
curl -X PUT http://localhost:3000/api/properties/save-draft-step \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "draft_id": "DRAFT_UUID",
    "step_number": 1,
    "step_data": {
      "title": "Test Property",
      "property_type": "apartment"
    },
    "mark_step_complete": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "draft": {
    "id": "uuid",
    "current_step": 1,
    "completed_steps": [true, false, false, false, false],
    "overall_completion_percentage": 20
  }
}
```

### 3.3 Test Publish Draft Endpoint

**Request:**
```bash
curl -X POST http://localhost:3000/api/properties/publish-draft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "draft_id": "DRAFT_UUID",
    "trigger_marketing_automation": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "property": {
    "id": "uuid",
    "title": "Test Property",
    "status": "published"
  }
}
```

### 3.4 Test Calculate Ranking Endpoint

**Request:**
```bash
curl -X POST http://localhost:3000/api/builders/calculate-ranking \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "builder_id": "BUILDER_UUID",
    "force_recalculate": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "ranking": {
    "builder_id": "uuid",
    "engagement_score": 75.5,
    "quality_score": 82.3,
    "velocity_score": 68.1,
    "overall_ai_ranking": 76.3
  }
}
```

---

## 🔐 Step 4: Test RLS Policies

### 4.1 Test Builder Access (Own Data)

**Scenario:** Builder should only see their own drafts

1. Login as a builder user
2. Create a draft via API
3. Query drafts - should only see own drafts
4. Try to query another builder's draft - should be denied

**SQL Test (as builder user):**
```sql
-- This should only return drafts for the current builder
SELECT * FROM property_upload_drafts;

-- This should return empty or error for other builder's drafts
SELECT * FROM property_upload_drafts 
WHERE builder_id != (SELECT builder_id FROM builders WHERE user_id = auth.uid());
```

### 4.2 Test Admin Access (All Data)

**Scenario:** Admin should see all drafts

1. Login as an admin user
2. Query all drafts - should see all drafts
3. Create draft for assigned builder - should succeed
4. Update draft for assigned builder - should succeed

**SQL Test (as admin user):**
```sql
-- This should return all drafts
SELECT * FROM property_upload_drafts;

-- This should return all builder metrics
SELECT * FROM builder_engagement_metrics;

-- This should return all activity logs
SELECT * FROM admin_activity_log;
```

### 4.3 Test Public Access (Metrics)

**Scenario:** Public should see builder metrics (for listing page)

**SQL Test (as anon user):**
```sql
-- This should return builder metrics (public access)
SELECT * FROM builder_engagement_metrics;

-- This should be denied (no public access)
SELECT * FROM property_upload_drafts;
```

---

## 🧪 Step 5: Test Database Functions

### 5.1 Test calculate_builder_ranking Function

**SQL Query:**
```sql
-- Get a builder ID first
SELECT builder_id FROM builders LIMIT 1;

-- Test the function
SELECT public.calculate_builder_ranking('YOUR_BUILDER_UUID'::uuid);
```

**Expected Result:**
```json
{
  "builder_id": "uuid",
  "engagement_score": 75.5,
  "quality_score": 82.3,
  "velocity_score": 68.1,
  "overall_ai_ranking": 76.3
}
```

**Verify Metrics Were Updated:**
```sql
SELECT * FROM builder_engagement_metrics 
WHERE builder_id = 'YOUR_BUILDER_UUID'
ORDER BY calculation_date DESC
LIMIT 1;
```

### 5.2 Test Trigger Functions

**Test update_property_draft_timestamp:**
```sql
-- Create a draft
INSERT INTO property_upload_drafts (builder_id, uploaded_by_user_id)
VALUES ('BUILDER_UUID', 'USER_UUID')
RETURNING id, updated_at;

-- Update the draft
UPDATE property_upload_drafts
SET step_1_data = '{"test": "data"}'::jsonb
WHERE id = 'DRAFT_UUID'
RETURNING id, updated_at;

-- Verify updated_at was automatically updated
```

**Test update_metrics_timestamp:**
```sql
-- Insert or update metrics
INSERT INTO builder_engagement_metrics (builder_id, engagement_score)
VALUES ('BUILDER_UUID', 75.5)
ON CONFLICT (builder_id, calculation_date)
DO UPDATE SET engagement_score = 75.5
RETURNING id, updated_at;
```

---

## 📊 Step 6: Integration Testing

### 6.1 Complete Draft Flow

1. **Create Draft**
   - POST `/api/properties/create-draft`
   - Verify draft created in database

2. **Save Step 1**
   - PUT `/api/properties/save-draft-step` (step 1)
   - Verify step_1_data populated
   - Verify completion_percentage updated

3. **Save Step 2**
   - PUT `/api/properties/save-draft-step` (step 2)
   - Verify step_2_data populated
   - Verify completion_percentage updated to 40%

4. **Save Steps 3-5**
   - Continue saving steps
   - Verify all steps saved
   - Verify completion_percentage reaches 100%

5. **Publish Draft**
   - POST `/api/properties/publish-draft`
   - Verify property created
   - Verify draft status updated to 'published'
   - Verify published_property_id set

### 6.2 Admin Builder Assignment Flow

1. **Create Assignment**
   - POST `/api/admin/builder-assignments`
   - Verify assignment created in database

2. **Admin Upload for Builder**
   - Create draft with `uploaded_by_admin: true`
   - Verify admin_user_id set correctly
   - Verify draft associated with builder

3. **Publish Property**
   - Publish draft as admin
   - Verify property created with `uploaded_by_admin: true`
   - Verify `admin_user_id` set correctly

### 6.3 Ranking Calculation Flow

1. **Calculate Ranking**
   - POST `/api/builders/calculate-ranking`
   - Verify function executed
   - Verify metrics inserted/updated in database

2. **Verify Metrics**
   - Query `builder_engagement_metrics` table
   - Verify scores calculated correctly
   - Verify `overall_ai_ranking` calculated

3. **Get Ranking List**
   - GET `/api/builders/ranking`
   - Verify builders returned with rankings
   - Verify sorting by ranking works

---

## ✅ Step 7: Final Verification Checklist

- [ ] All tables created successfully
- [ ] All columns added to properties table
- [ ] All functions created and working
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] RLS policies created correctly
- [ ] Builder can only access own data
- [ ] Admin can access all data
- [ ] Public can access builder metrics
- [ ] Service role has full access
- [ ] API endpoints working correctly
- [ ] Draft creation works
- [ ] Draft saving works
- [ ] Draft publishing works
- [ ] Ranking calculation works
- [ ] Admin assignments work
- [ ] Triggers update timestamps correctly

---

## 🐛 Troubleshooting

### Issue: Tables Not Created

**Solution:**
1. Check if migrations were executed
2. Review error logs in Supabase Dashboard
3. Re-execute migrations if needed

### Issue: RLS Policies Not Working

**Solution:**
1. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'table_name'`
2. Check policy definitions in pg_policies
3. Verify user roles in user_roles table
4. Test with service role key first

### Issue: Function Errors

**Solution:**
1. Check function definition syntax
2. Verify referenced tables exist
3. Check function permissions
4. Review error messages in Supabase logs

### Issue: API Endpoint Errors

**Solution:**
1. Check authentication tokens
2. Verify user roles
3. Review API route logs
4. Test with service role key
5. Check request/response formats

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions Documentation](https://www.postgresql.org/docs/current/xfunc.html)
- [API Route Documentation](./PROPERTY_UPLOAD_SYSTEM_IMPLEMENTATION_COMPLETE.md)

---

## ✅ Success Criteria

The system is fully verified when:
- ✅ All database objects exist and are correct
- ✅ All RLS policies are active and working
- ✅ All API endpoints respond correctly
- ✅ Builders can only access their own data
- ✅ Admins can access assigned builders' data
- ✅ Ranking calculation works correctly
- ✅ Draft workflow is complete and functional

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for Testing

















