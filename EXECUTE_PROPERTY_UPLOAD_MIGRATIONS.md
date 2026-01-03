# 🚀 Execute Property Upload System Migrations

## ⚠️ Important Note

Supabase REST API does **not support direct SQL execution**. Migrations must be executed via the **Supabase Dashboard SQL Editor**, which is the recommended and reliable method.

---

## 📋 Step-by-Step Execution Guide

### Step 1: Open Supabase SQL Editor

Open the SQL Editor in your browser:
```
https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new
```

### Step 2: Execute Migration 070

1. **Open the migration file:**
   - File: `supabase/migrations/070_property_upload_admin_management.sql`
   - Copy the **entire contents** (including `BEGIN;` and `COMMIT;`)

2. **Paste into SQL Editor:**
   - Paste the SQL into the SQL Editor
   - Click **"Run"** button (or press `Ctrl+Enter`)

3. **Wait for execution:**
   - Should take 2-5 seconds
   - You should see: `Success. No rows returned`

4. **Verify success:**
   - Check for any error messages
   - If successful, proceed to Step 3

### Step 3: Execute Migration 071

1. **Open the migration file:**
   - File: `supabase/migrations/071_property_upload_rls_policies.sql`
   - Copy the **entire contents** (including `BEGIN;` and `COMMIT;`)

2. **Paste into SQL Editor:**
   - Paste the SQL into the SQL Editor
   - Click **"Run"** button (or press `Ctrl+Enter`)

3. **Wait for execution:**
   - Should take 2-5 seconds
   - You should see: `Success. No rows returned`

4. **Verify success:**
   - Check for any error messages
   - If successful, proceed to Step 4

### Step 4: Verify Tables Created

1. **Go to Table Editor:**
   ```
   https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/editor
   ```

2. **Check that these tables exist:**
   - ✅ `property_upload_drafts`
   - ✅ `property_verification_history`
   - ✅ `builder_engagement_metrics`
   - ✅ `admin_activity_log`
   - ✅ `admin_builder_assignments`

3. **Verify properties table columns:**
   - Open the `properties` table
   - Check that these columns exist:
     - `uploaded_by_admin`
     - `admin_user_id`
     - `upload_source`
     - `verification_status`
     - `verification_notes`
     - `verified_by_user_id`
     - `verified_at`
     - `property_metadata`
     - `location_intelligence`
     - `pricing_intelligence`

---

## ✅ Success Criteria

The migrations are successful when:

- ✅ Both migrations execute without errors
- ✅ All 5 new tables are created
- ✅ All 10 new columns are added to properties table
- ✅ No error messages in SQL Editor

---

## 🐛 Troubleshooting

### Error: "relation already exists"

**Cause:** Tables already exist (migrations may have been applied before)

**Solution:** This is OK! The migrations use `IF NOT EXISTS` clauses, so they're safe to re-run. The error messages are warnings and can be ignored.

### Error: "column already exists"

**Cause:** Columns already exist in properties table

**Solution:** This is OK! The migrations use `IF NOT EXISTS` clauses. The error messages are warnings and can be ignored.

### Error: "permission denied"

**Cause:** Insufficient permissions

**Solution:** 
- Ensure you're logged into Supabase Dashboard
- Ensure you have admin/owner access to the project
- Check your user permissions

### Error: "syntax error"

**Cause:** SQL syntax issue

**Solution:**
- Ensure you copied the entire migration file
- Ensure you copied both `BEGIN;` and `COMMIT;`
- Check for any missing semicolons
- Try copying the file content again

---

## 📊 What Gets Created

### Tables Created:
1. `property_upload_drafts` - Multi-step form progress
2. `property_verification_history` - Verification audit trail
3. `builder_engagement_metrics` - AI ranking metrics
4. `admin_activity_log` - Admin action tracking
5. `admin_builder_assignments` - Admin-builder relationships

### Properties Table Extended:
- 10 new columns for upload tracking, verification, and metadata

### Functions Created:
- `calculate_builder_ranking()` - AI ranking calculation
- `update_property_draft_timestamp()` - Auto-update trigger
- `update_metrics_timestamp()` - Auto-update trigger
- `update_assignment_timestamp()` - Auto-update trigger

### RLS Policies:
- Comprehensive Row-Level Security policies for all new tables
- Builder access policies
- Admin access policies
- Public access policies (for metrics)

---

## 🎉 Completion

Once both migrations execute successfully and all tables/columns are verified, the Property Upload System is ready to use!

**Next Steps:**
- Test the API endpoints
- Test RLS policies
- Review the verification guide: `PROPERTY_UPLOAD_SYSTEM_VERIFICATION_GUIDE.md`

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for Execution via Dashboard

