# Update Admin Role

## Method 1: Using Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your Tharaga project
3. Click on **SQL Editor** in the left sidebar
4. Run this query:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tharagarealestate@gmail.com';
```

5. Click **Run** to execute the query

## Method 2: Using the Netlify Function (After Deployment)

Once the changes are deployed to Netlify, you can use the API endpoint:

```bash
curl -X POST https://tharaga.co.in/api/update-admin-role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "tharagarealestate@gmail.com"}'
```

Replace `YOUR_ADMIN_TOKEN` with the actual `ADMIN_TOKEN` from your Netlify environment variables.

## Verification

After updating the role, you can verify by:

1. Logging out and logging back in with the admin email
2. Checking that lock icons are not visible on Pro features
3. Confirming that all sidebar items are accessible
4. Testing that the builder dashboard loads properly

## Notes

- The admin role bypasses all trial/subscription checks
- Admin users automatically get `builderId` set to their `user.id`
- Email-based admin check is hardcoded in `auth.ts` for instant access
