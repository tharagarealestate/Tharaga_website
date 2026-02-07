# 🔧 Fixed Supabase Migration - Safe to Re-run

## What Was the Problem?

The error you encountered:
```
ERROR: 42710: trigger "update_user_roles_updated_at" for relation "user_roles" already exists
```

This means you previously ran part of the migration, and triggers were created. PostgreSQL won't allow duplicate triggers/policies with the same name.

## ✅ The Fix

I've updated `20250103_create_role_tables.sql` with **idempotent** commands that are **safe to re-run** multiple times:

### Changes Made:

1. **Triggers** - Added `DROP TRIGGER IF EXISTS` before each `CREATE TRIGGER`
2. **Policies** - Added `DROP POLICY IF EXISTS` before each `CREATE POLICY`
3. **Tables/Functions** - Already used `IF NOT EXISTS` / `OR REPLACE` (safe)

Now the migration will:
- Drop existing triggers/policies if they exist
- Recreate them with current definitions
- Never throw "already exists" errors

---

## 🚀 How to Run the Fixed Migration

### Step 1: Open Supabase SQL Editor

**Click this link:** https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new

### Step 2: Copy the Migration SQL

1. Open the file: `E:\Tharaga_website\Tharaga_website\supabase\migrations\20250103_create_role_tables.sql`
2. Select **ALL content** (Ctrl+A)
3. Copy (Ctrl+C)

### Step 3: Run in Supabase

1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** button (green button, top-right)
3. Wait for **"Success. No rows returned"** message

---

## 🔍 What Gets Created

### Tables:
- `user_roles` - Stores buyer/builder/admin roles for each user
- `builder_profiles` - Company info, GSTIN, RERA, verification status
- `buyer_profiles` - User preferences and saved properties

### Triggers:
- `update_user_roles_updated_at` - Auto-updates timestamp on role changes
- `update_builder_profiles_updated_at` - Auto-updates timestamp on profile changes
- `update_buyer_profiles_updated_at` - Auto-updates timestamp on profile changes

### RLS Policies (9 total):
- Users can only view/insert/update their own data
- Secure by default

### Helper Functions:
- `get_user_roles(uuid)` - Returns user's roles
- `user_has_role(uuid, role)` - Checks if user has specific role
- `update_updated_at_column()` - Timestamp updater

---

## 📊 Verify Migration Success

After running, check the following:

### 1. Check Tables Exist

**Go to:** https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/editor

You should see 3 new tables:
- `user_roles`
- `builder_profiles`
- `buyer_profiles`

### 2. Check Table Structure

Click on `user_roles` table, verify columns:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `role` (TEXT, CHECK constraint: buyer/builder/admin)
- `is_primary` (BOOLEAN)
- `verified` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. Check RLS is Enabled

In the table view, you should see a shield icon 🛡️ indicating RLS is active.

### 4. Test with a Query

Run this in SQL Editor:
```sql
-- Should return empty result (no errors)
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

If it runs without errors, your migration succeeded!

---

## 🐛 Still Getting Errors?

If you encounter any other errors, check:

### Error: "permission denied for schema auth"
**Solution:** Make sure you're running the query as the Supabase service role (default in SQL Editor)

### Error: "relation already exists"
**Solution:** That's fine! The migration uses `CREATE TABLE IF NOT EXISTS`, so it will skip creating the table

### Error: "policy already exists"
**Solution:** The fixed migration now drops policies before recreating them, so this shouldn't happen anymore

### Error: "function already exists"
**Solution:** The migration uses `CREATE OR REPLACE FUNCTION`, so it will overwrite existing functions

---

## 📝 Summary of Migration File

The fixed `20250103_create_role_tables.sql` now includes:

```sql
-- ✅ Safe to re-run
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at ...

-- ✅ Safe to re-run
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ...

-- ✅ Already safe
CREATE TABLE IF NOT EXISTS user_roles ...
CREATE OR REPLACE FUNCTION get_user_roles ...
```

---

## 🎯 Next Steps After Migration

Once the migration succeeds:

1. **Test the role system** on https://tharaga.co.in
2. **Login** and verify role selection modal appears
3. **Check Portal menu** shows correct dashboards
4. **Switch roles** and verify it works smoothly
5. **Check console** (F12) for any errors

---

## ✅ You're Ready!

The migration file is now **fixed and safe to run**. Copy the entire contents of:

`E:\Tharaga_website\Tharaga_website\supabase\migrations\20250103_create_role_tables.sql`

And paste it into the Supabase SQL Editor. Click **Run**. Done! 🎉
