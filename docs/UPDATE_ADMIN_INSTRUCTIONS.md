# Update Admin Role - Complete Instructions

## Quick Update (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your Tharaga project

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar

3. **Run this SQL:**
```sql
-- Update admin role for tharagarealestate@gmail.com
UPDATE public.profiles
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'tharagarealestate@gmail.com';

-- Verify the update
SELECT id, email, role, created_at, updated_at
FROM public.profiles
WHERE email = 'tharagarealestate@gmail.com';
```

4. **Click "Run"** to execute

## Expected Result

You should see:
- 1 row updated
- Verification query shows `role = 'admin'`

## Verification on Live Site

After updating, test at https://inquisitive-donut-5f1097.netlify.app/:

1. **Login** with tharagarealestate@gmail.com
2. **Navigate** to `/builder?section=leads`
3. **Verify:**
   - ✅ No "Unauthorized" error
   - ✅ Leads page loads properly
   - ✅ No lock icons on Revenue menu
   - ✅ Full access to all features

## Important Notes

- The code already has email-based override in `auth.ts`
- Database update ensures consistency
- Admin role bypasses all trial/subscription checks
- Changes take effect immediately (no app restart needed)

## Troubleshooting

**If profile doesn't exist:**
The user may need to sign in once first to create their profile. Then run the UPDATE again.

**If still seeing "Unauthorized":**
1. Clear browser cache and cookies
2. Log out and log back in
3. Check browser console for errors
4. Verify the Supabase connection is working

## Alternative Method (Using API)

If you prefer to use the API endpoint (after it's deployed):

```bash
curl -X POST https://tharaga.co.in/api/update-admin-role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "tharagarealestate@gmail.com"}'
```

Replace `YOUR_ADMIN_TOKEN` with your actual ADMIN_TOKEN from Netlify environment variables.
