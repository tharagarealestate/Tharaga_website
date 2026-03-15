# 🚀 Run Supabase Migration - Step by Step

## Quick Start (5 minutes)

### Step 1: Open Supabase SQL Editor
Click this link to open the SQL Editor:
👉 **https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new**

### Step 2: Copy the Migration SQL

Open this file in VS Code or any text editor:
```
E:\Tharaga_website\Tharaga_website\supabase\migrations\20250103_create_role_tables.sql
```

Select all (Ctrl+A) and copy (Ctrl+C)

### Step 3: Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click the **"Run"** button (or press Ctrl+Enter)
3. Wait for execution to complete (should take 2-3 seconds)

### Step 4: Verify Success

You should see a success message like:
```
Success. No rows returned
```

If you see any errors, scroll down to the Troubleshooting section below.

---

## What This Migration Does

Creates 3 new tables:
- ✅ `user_roles` - Stores buyer/builder/admin roles for each user
- ✅ `builder_profiles` - Extended info for builders (company, GSTIN, verification status)
- ✅ `buyer_profiles` - Buyer preferences and saved properties

Plus:
- ✅ Row Level Security (RLS) policies for data protection
- ✅ Indexes for fast queries
- ✅ Triggers for automatic timestamp updates
- ✅ Helper functions for role checking

---

## Verification Steps

After running the migration, verify the tables were created:

### Via Supabase Dashboard

1. Go to **Table Editor**: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/editor
2. You should see three new tables in the left sidebar:
   - `user_roles`
   - `builder_profiles`
   - `buyer_profiles`
3. Click on each table to verify the columns

### Expected Columns

**user_roles:**
- id (uuid)
- user_id (uuid)
- role (text)
- is_primary (bool)
- verified (bool)
- created_at (timestamptz)
- updated_at (timestamptz)

**builder_profiles:**
- id (uuid)
- user_id (uuid)
- company_name (text)
- gstin (text)
- rera_number (text)
- verification_status (text)
- verification_documents (jsonb)
- rejection_reason (text)
- verified_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

**buyer_profiles:**
- id (uuid)
- user_id (uuid)
- preferences (jsonb)
- saved_properties (uuid[])
- created_at (timestamptz)
- updated_at (timestamptz)

---

## Troubleshooting

### Error: "relation already exists"

**Cause:** Tables already exist from a previous migration attempt.

**Solution:** This is fine! The migration uses `IF NOT EXISTS` so it won't overwrite existing data. You can safely ignore this error.

### Error: "permission denied"

**Cause:** You don't have sufficient permissions in Supabase.

**Solution:**
1. Make sure you're logged into the correct Supabase account
2. Verify you have Owner or Admin role on the project
3. Try logging out and back in to refresh permissions

### Error: "function auth.uid() does not exist"

**Cause:** RLS policies reference auth.uid() which might not be available in your schema.

**Solution:** This shouldn't happen in Supabase projects. If you see this:
1. Check you're running in the correct project
2. Contact Supabase support - this indicates a configuration issue

### Error: "syntax error near..."

**Cause:** SQL might have been corrupted during copy/paste.

**Solution:**
1. Make sure you copied the ENTIRE migration file
2. Check for any missing lines or characters
3. Try copying again from the original file

### Can't see the new tables in Table Editor

**Cause:** Browser cache or UI not refreshed.

**Solution:**
1. Hard refresh the page (Ctrl+Shift+R)
2. Navigate away and back to Table Editor
3. Try a different browser

---

## Alternative: Manual Table Creation

If the migration fails completely, you can create tables manually via the Table Editor:

### Create user_roles table

1. Go to Table Editor
2. Click **"New table"**
3. Name: `user_roles`
4. Add columns:
   - `id` (uuid, primary key, default: gen_random_uuid())
   - `user_id` (uuid, foreign key to auth.users)
   - `role` (text)
   - `is_primary` (bool, default: false)
   - `verified` (bool, default: false)
   - `created_at` (timestamptz, default: now())
   - `updated_at` (timestamptz, default: now())
5. Enable RLS
6. Add RLS policy: Allow users to SELECT their own rows

Repeat similar process for `builder_profiles` and `buyer_profiles`.

---

## After Migration Success

✅ **Next Steps:**

1. **Test the system:**
   - Open https://tharaga.co.in in incognito mode
   - Sign in with Google
   - You should see the role selection modal!

2. **Check API endpoints:**
   - `/api/user/roles` should return user role data
   - `/api/user/add-role` should allow adding roles
   - `/api/user/switch-role` should allow switching

3. **Monitor logs:**
   - Check Netlify function logs for any errors
   - Check browser console for role manager logs

---

## Need Help?

If migration fails after multiple attempts:

1. **Take a screenshot** of the error message
2. **Copy the error text** from the SQL Editor
3. **Share with the developer** for debugging

Common issues are usually:
- Permission problems (check account access)
- Existing tables (use DROP TABLE if needed)
- Network timeout (try again)

---

## Summary

✅ Copy migration SQL from `supabase/migrations/20250103_create_role_tables.sql`
✅ Paste into Supabase Dashboard SQL Editor
✅ Click Run
✅ Verify tables appear in Table Editor
✅ Test the role system on https://tharaga.co.in

**Total Time:** ~5 minutes

**Migration Status:** Ready to run ✨
