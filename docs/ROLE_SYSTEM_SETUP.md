# Tharaga Role-Based Access Control System - Setup Guide

## Overview
This system provides professional buyer/builder role management with:
- Multi-role support (users can be BOTH buyer and builder)
- Seamless role switching
- Builder verification workflow
- Secure API-level role verification
- Beautiful onboarding UX

## Files Created

### Backend (Netlify Functions)
- `netlify/functions/user-roles.mjs` - Get user roles and profiles
- `netlify/functions/user-add-role.mjs` - Add buyer or builder role
- `netlify/functions/user-switch-role.mjs` - Switch active role

### Frontend
- `role-manager.js` - Client-side role management system
- Updated `index.html` - Integrated role manager with auth

### Database
- `supabase/migrations/20250103_create_role_tables.sql` - Database schema

### Configuration
- Updated `netlify.toml` - Added API routes for role management

## Setup Steps

### 1. Run Supabase Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy contents of `supabase/migrations/20250103_create_role_tables.sql`
5. Paste and click **Run**
6. Verify tables created: `user_roles`, `builder_profiles`, `buyer_profiles`

**Option B: Via Supabase CLI**
```bash
cd E:\Tharaga_website\Tharaga_website
supabase db push
```

### 2. Verify Environment Variables

Ensure these are set in Netlify:
- `SUPABASE_URL` = https://wedevtjjmdvngyshqdro.supabase.co
- `SUPABASE_ANON_KEY` = (your anon key)

### 3. Deploy to Netlify

```bash
git add .
git commit -m "feat: add role-based access control system"
git push
```

Netlify will automatically deploy the new functions and frontend.

### 4. Test the System

#### Test Flow 1: New User Onboarding
1. Open https://tharaga.co.in in incognito mode
2. Click "Login / Signup"
3. Click "Continue with Google"
4. After OAuth completes, you should see the **Role Selection Modal**
5. Select "I'm Buying" or "I'm Building"
6. If builder: fill verification form
7. Redirected to appropriate dashboard

#### Test Flow 2: Existing User
1. Login as existing user
2. If user already has roles, no modal shows
3. Check console logs for role data

#### Test Flow 3: Role Switching (Coming Next)
1. Login as user with multiple roles
2. Click username dropdown
3. Should see role switcher (to be implemented in next phase)

## API Endpoints

### GET /api/user/roles
Returns user's roles and profile information.

**Response:**
```json
{
  "roles": ["buyer", "builder"],
  "primary_role": "buyer",
  "builder_verified": true,
  "has_builder_profile": true,
  "has_buyer_profile": true,
  "builder_profile": {...},
  "buyer_profile": {...}
}
```

### POST /api/user/add-role
Add a new role to user.

**Request:**
```json
{
  "role": "builder",
  "builder_data": {
    "company_name": "ABC Constructions",
    "gstin": "29AABCU9603R1ZM",
    "rera_number": "PRM/KA/RERA/..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "role_added": "builder",
  "is_primary": false,
  "verification_required": true
}
```

### POST /api/user/switch-role
Switch user's active/primary role.

**Request:**
```json
{
  "role": "buyer"
}
```

**Response:**
```json
{
  "success": true,
  "active_role": "buyer"
}
```

## Database Schema

### user_roles
- `id` - UUID primary key
- `user_id` - Foreign key to auth.users
- `role` - TEXT ('buyer', 'builder', 'admin')
- `is_primary` - BOOLEAN (active role)
- `verified` - BOOLEAN
- `created_at`, `updated_at`

### builder_profiles
- `id` - UUID primary key
- `user_id` - Foreign key to auth.users (unique)
- `company_name` - TEXT (required)
- `gstin` - TEXT (optional)
- `rera_number` - TEXT (optional)
- `verification_status` - TEXT ('pending', 'verified', 'rejected')
- `verification_documents` - JSONB
- `verified_at` - TIMESTAMPTZ
- `created_at`, `updated_at`

### buyer_profiles
- `id` - UUID primary key
- `user_id` - Foreign key to auth.users (unique)
- `preferences` - JSONB (property preferences)
- `saved_properties` - UUID[] (saved property IDs)
- `created_at`, `updated_at`

## Next Steps (Remaining Tasks)

### ✅ Completed
1. Database schema and migrations
2. Backend API functions
3. Role selection onboarding modal
4. Builder verification form
5. Integration with auth system

### 🚧 Remaining
1. **Update auth header dropdown** with role switcher UI
2. **Dynamic portal menu** based on active role
3. **Route protection** for /builder and /my-dashboard pages
4. **Role switching UI** in header menu
5. **Admin panel** for builder verification (future)

## Troubleshooting

### Migration Fails
- Check Supabase project is active
- Verify you have owner/admin access
- Check for existing tables with same names

### API Functions Return 500
- Check Netlify function logs
- Verify environment variables are set
- Check Supabase connection

### Role Modal Doesn't Show
- Check browser console for errors
- Verify role-manager.js is loaded
- Check user authentication state
- Look for console log: `[role-manager] Initializing for user:`

### OAuth Callback Issues
- Ensure service worker is updated (v3)
- Hard refresh browser (Ctrl+Shift+R)
- Check console for Supabase errors

## Console Logs to Watch

```
[role-manager] Role manager initialized
[thg-auth] Initializing role manager for new user
[role-manager] Initializing for user: email@example.com
[role-manager] User needs onboarding
(Modal should appear)
```

## Security Notes

- Row Level Security (RLS) enabled on all tables
- Users can only access their own roles and profiles
- API functions verify JWT tokens
- Builder verification requires manual approval
- Admin roles require separate implementation

## Support

If you encounter issues:
1. Check browser console logs
2. Check Netlify function logs
3. Verify Supabase tables were created
4. Test API endpoints directly with Postman/curl
5. Check that environment variables are set in Netlify

---

**Status:** Phase 1 Complete (Database + Backend + Onboarding UI)
**Next:** Phase 2 (Role Switching UI + Dynamic Menus + Route Protection)
