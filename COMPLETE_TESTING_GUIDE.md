# 🧪 Complete Role System Testing Guide (Phases 1-5)

## Overview

This guide covers testing all 5 phases of the Tharaga Role Management System:
- ✅ Phase 1: Core Role System (Database + APIs)
- ✅ Phase 2: Enhanced UI (Role Selection + Switcher)
- ✅ Phase 3: Route Protection
- ✅ Phase 4: Admin Panel
- ✅ Phase 5: Advanced Features (Email + Onboarding)

---

## Prerequisites

### Before Testing:

1. **Database Migration Complete**
   - Run `20250103_create_role_tables.sql` in Supabase
   - Verify tables exist: `user_roles`, `builder_profiles`, `buyer_profiles`

2. **Admin User Created**
   - Run `add-admin-role.sql` to add admin role to your account
   - Replace `'your-email@example.com'` with your actual email

3. **Netlify Deployment**
   - Latest commit deployed successfully
   - All serverless functions active

4. **Browser Setup**
   - Use Chrome/Edge with DevTools open (F12)
   - Test in **incognito mode** for fresh state
   - Clear cache if testing repeatedly (Ctrl+Shift+R)

---

## Phase 1 & 2: Role System + UI

### Test 1: New User Onboarding (Buyer)

**Steps:**
1. Open https://tharaga.co.in in incognito
2. Click "Login / Signup"
3. Sign in with Google
4. **Expected:** Role selection modal appears (once, not 3 times!)
5. Click "I'm Buying" card
6. **Expected:**
   - ✅ Success notification appears
   - ✅ Modal closes smoothly
   - ✅ No redirect (stay on homepage)
   - ✅ Portal menu shows "Buyer Dashboard ✓"

**Console Logs:**
```
[role-v2] Initializing for user: you@email.com
[role-v2] User needs onboarding
[role-v2] Adding role: buyer
✅ Buyer role added!
```

**Database Verification:**
```sql
SELECT * FROM user_roles WHERE user_id = 'your-user-id';
-- Should show: role='buyer', is_primary=true, verified=true

SELECT * FROM buyer_profiles WHERE user_id = 'your-user-id';
-- Should have one row
```

---

### Test 2: New User Onboarding (Builder)

**Steps:**
1. Open https://tharaga.co.in in incognito
2. Login with new Google account
3. Role modal appears → Click "I'm Building"
4. **Expected:** Builder verification form appears
5. Fill in:
   - Company Name: "Test Constructions Pvt Ltd"
   - GSTIN: "29ABCDE1234F1Z5" (optional)
   - RERA Number: "REA12345" (optional)
6. Click "Submit for Verification"
7. **Expected:**
   - ✅ Success notification
   - ✅ No redirect
   - ✅ Portal menu shows "Builder Dashboard" (no checkmark yet, pending verification)

**Console Logs:**
```
[role-v2] Adding role: builder
[role-v2] Builder profile created
✅ Builder role added!
```

**Database Verification:**
```sql
SELECT * FROM user_roles WHERE user_id = 'your-user-id';
-- Should show: role='builder', is_primary=true, verified=false

SELECT * FROM builder_profiles WHERE user_id = 'your-user-id';
-- Should show: verification_status='pending'
```

---

### Test 3: Add Second Role

**Steps:**
1. Login as buyer
2. Click username → Open dropdown menu
3. **Expected:** Menu shows:
   ```
   Your Roles
     🏠 Buyer Mode ✓
     ➕ Builder Mode

   Profile
   My Dashboard
   Logout
   ```
4. Click "Builder Mode" button
5. **Expected:** Builder verification form appears
6. Fill form → Submit
7. **Expected:**
   - ✅ Success notification
   - ✅ Menu now shows BOTH roles
   - ✅ Portal menu shows both dashboards

**Console Logs:**
```
[role-v2] Adding role: builder
✅ Builder role added successfully!
[role-v2] Emitted role change event
```

---

### Test 4: Role Switching

**Steps:**
1. Login with user who has BOTH buyer and builder roles
2. Click username → See both roles listed
3. Current active role has ✓
4. Click on inactive role (e.g., "Builder Mode")
5. **Expected:**
   - ✅ Instant opacity change (visual feedback)
   - ✅ Success notification: "Switched to Builder Mode"
   - ✅ Portal menu updates (✓ moves to Builder Dashboard)
   - ✅ No page reload/redirect

6. Refresh page (F5)
7. **Expected:** Still in Builder mode (persisted)

**Console Logs:**
```
[role-v2] Switching to role: builder
Switched to builder mode
[role-v2] Emitted role change event
```

---

## Phase 3: Route Protection

### Test 5: Route Access Control

**Test A: Access /builder without builder role**

**Steps:**
1. Login as buyer (no builder role)
2. Manually navigate to https://tharaga.co.in/builder
3. **Expected:**
   - ❌ Access denied
   - ✅ Error notification appears
   - ✅ Redirected to `/my-dashboard`
   - ✅ Message: "Builder Dashboard requires builder role"

**Console Logs:**
```
[route-guard] Checking access for: /builder
[route-guard] Access denied. Required: builder, User has: buyer
```

---

**Test B: Access /my-dashboard without buyer role**

**Steps:**
1. Login as builder (no buyer role)
2. Navigate to https://tharaga.co.in/my-dashboard
3. **Expected:**
   - ❌ Access denied
   - ✅ Redirected to `/builder`

---

**Test C: Access protected route when not logged in**

**Steps:**
1. Logout completely
2. Try accessing https://tharaga.co.in/builder
3. **Expected:**
   - ❌ Access denied
   - ✅ Redirected to `/`
   - ✅ Message: "Please login to access this page"

---

**Test D: Role switching updates access**

**Steps:**
1. Login with both roles
2. Access `/builder` (should work)
3. Switch to buyer mode
4. **Expected:** Route guard re-checks access
5. Try accessing `/builder` again
6. **Expected:** Still works (you have the role, just not active)

---

### Test 6: Route Change Detection

**Steps:**
1. Login as buyer
2. Open `/my-dashboard` (works)
3. Manually change URL to `/builder` in address bar
4. **Expected:**
   - ✅ Route guard detects change
   - ✅ Access check runs
   - ✅ Redirect if unauthorized

**Console Logs:**
```
[route-guard] Route changed, verifying access
[route-guard] Access denied...
```

---

## Phase 4: Admin Panel

### Test 7: Admin Panel Access

**Test A: Access without admin role**

**Steps:**
1. Login as regular buyer/builder
2. Navigate to https://tharaga.co.in/admin
3. **Expected:**
   - ❌ Access denied
   - ✅ Redirected to `/`
   - ✅ Error notification

---

**Test B: Access with admin role**

**Steps:**
1. Add admin role to your account (run `add-admin-role.sql`)
2. Login
3. Navigate to https://tharaga.co.in/admin
4. **Expected:**
   - ✅ Admin panel loads
   - ✅ Statistics cards show data
   - ✅ Builder tables populated

---

### Test 8: Admin Dashboard Statistics

**Steps:**
1. Open admin panel
2. **Expected stats cards show:**
   - Total Users (count of unique users)
   - Total Buyers (count of buyer roles)
   - Total Builders (count of builder roles)
   - Pending Verifications (builders awaiting approval)
   - Verified Builders
   - Rejected Builders

3. **Verify accuracy:**
   - Check Supabase tables manually
   - Numbers should match

**Console Logs:**
```
(Admin panel uses Supabase client directly, check Network tab)
```

---

### Test 9: View Builder Details

**Steps:**
1. In admin panel, go to "Pending" tab
2. Click "View" button on any builder
3. **Expected:** Modal opens showing:
   - Company Name
   - Email
   - Contact Person
   - GSTIN
   - RERA Number
   - Status badge
   - Submission date

4. Click X to close modal

---

### Test 10: Verify Builder

**Steps:**
1. In "Pending" tab, find a builder
2. Click "Verify" button
3. **Expected:** Confirmation dialog
4. Confirm
5. **Expected:**
   - ✅ Success toast: "Builder verified successfully!"
   - ✅ Builder moves from "Pending" to "Verified" tab
   - ✅ Statistics update
   - ✅ Email notification logged (check Netlify function logs)

**Database Verification:**
```sql
SELECT * FROM builder_profiles WHERE id = 'builder-id';
-- Should show: verification_status='verified', verified_at='timestamp'

SELECT * FROM user_roles WHERE user_id = 'builder-user-id' AND role='builder';
-- Should show: verified=true
```

---

### Test 11: Reject Builder

**Steps:**
1. In "Pending" tab, click "Reject" button
2. **Expected:** Rejection modal opens
3. Enter rejection reason: "Incomplete GSTIN information"
4. Click "Reject Builder"
5. **Expected:**
   - ✅ Success toast
   - ✅ Builder moves to "Rejected" tab
   - ✅ Rejection reason visible in details

**Database Verification:**
```sql
SELECT verification_status, rejection_reason
FROM builder_profiles
WHERE id = 'builder-id';
-- Should show: status='rejected', reason='Incomplete GSTIN information'
```

---

### Test 12: Filter Builders by Status

**Steps:**
1. Admin panel → Click "Verified" tab
2. **Expected:** Only verified builders shown
3. Click "Rejected" tab
4. **Expected:** Only rejected builders shown
5. Click "All Builders" tab
6. **Expected:** All builders shown regardless of status

---

## Phase 5: Advanced Features

### Test 13: Email Notifications

**Steps:**
1. Verify a builder in admin panel
2. Check **Netlify Function Logs**:
   - Go to https://app.netlify.com/
   - Click on your site → Functions → `send-verification-email`
   - Check logs

3. **Expected log output:**
```
=== EMAIL NOTIFICATION ===
To: builder@example.com
Subject: ✅ Your Builder Account has been Verified - Tharaga
Message: Dear Test Constructions Pvt Ltd Team, Great news! ...
=========================
```

**Note:** Currently emails are logged, not sent. To enable actual sending:
- Add SendGrid API key to Netlify environment variables
- Uncomment email sending code in `send-verification-email.mjs`

---

### Test 14: Builder Onboarding Checklist

**Steps:**
1. Login as NEW builder (pending verification)
2. Wait 2 seconds after page load
3. **Expected:** Onboarding checklist appears (top-right corner)

4. **Checklist should show:**
   - ✅ Complete your builder profile (checked)
   - ✅ Submit verification documents (checked)
   - ⬜ Get verified by Tharaga (unchecked, pending)
   - ⬜ Add your first property listing (unchecked)
   - ⬜ Upload company logo (unchecked)

5. Progress bar shows: "2 of 5 completed (40%)"

6. Click "Dismiss" button
7. **Expected:** Checklist disappears

8. Refresh page
9. **Expected:** Checklist does NOT reappear (dismissed)

**Console Logs:**
```
[onboarding] Builder onboarding checklist loaded
```

---

**Test B: Checklist after verification**

**Steps:**
1. Admin verifies the builder
2. Builder refreshes page
3. **Expected:** Checklist shows:
   - ✅ Complete your builder profile
   - ✅ Submit verification documents
   - ✅ Get verified by Tharaga (NOW CHECKED!)
   - ⬜ Add your first property listing
   - ⬜ Upload company logo

4. Progress: "3 of 5 completed (60%)"

---

**Test C: Reset checklist**

**Steps:**
1. Open browser console (F12)
2. Run: `BuilderOnboarding.reset()`
3. Run: `BuilderOnboarding.show()`
4. **Expected:** Checklist reappears

---

### Test 15: localStorage Persistence

**Steps:**
1. Login and switch to builder mode
2. Open DevTools → Application tab → Local Storage
3. **Expected keys:**
   - `tharaga_active_role`: `"builder"`
   - `thg_onboarding_dismissed`: `"true"` (if dismissed)

4. Refresh page
5. **Expected:** Active role persists

---

## Comprehensive Flow Tests

### Test 16: Complete New User Journey

**Full Flow:**
1. Sign up → Choose buyer role
2. Add builder role
3. Submit verification
4. Admin verifies
5. Checklist updates
6. Switch between roles
7. Access both dashboards

**Time:** ~5 minutes

---

### Test 17: Multi-Tab Synchronization

**Steps:**
1. Login in Tab 1
2. Open Tab 2 (same site, same user)
3. Switch role in Tab 1
4. **Expected:** Tab 2 detects change (via localStorage event)
5. Route guard re-checks access in Tab 2

**Console Logs (Tab 2):**
```
[route-guard] Role changed, re-verifying access
```

---

## Error Handling Tests

### Test 18: API Failures

**Test A: Network offline**

**Steps:**
1. Disconnect internet
2. Try switching roles
3. **Expected:**
   - ⏱️ Request times out after 10s
   - ❌ Error notification
   - ✅ UI rolls back to previous state

---

**Test B: Invalid data**

**Steps:**
1. Open builder form
2. Leave company name empty
3. Submit
4. **Expected:** Alert: "Please enter your company name"

---

### Test 19: Race Conditions

**Steps:**
1. Login
2. Rapidly click "Builder Mode" button multiple times
3. **Expected:**
   - ✅ Only one request sent
   - ✅ No duplicate modals
   - ✅ No errors in console

---

## Mobile Testing

### Test 20: Responsive Design

**Steps:**
1. Resize browser to 375px width (mobile)
2. Test:
   - ✅ Role selection modal stacks vertically
   - ✅ Buttons remain touch-friendly
   - ✅ Admin panel responsive
   - ✅ Onboarding checklist visible

3. Test on actual mobile device (Android/iOS)

---

## Performance Tests

### Test 21: Load Time

**Steps:**
1. Open DevTools → Network tab
2. Hard refresh (Ctrl+Shift+R)
3. **Expected:**
   - `role-manager-v2.js` loads in < 200ms
   - `route-guard.js` loads in < 150ms
   - `builder-onboarding-checklist.js` loads in < 150ms
   - Total page load < 2 seconds

---

### Test 22: Memory Leaks

**Steps:**
1. Open DevTools → Performance tab → Memory
2. Switch roles 20 times
3. Take heap snapshot
4. **Expected:** No significant memory growth

---

## Security Tests

### Test 23: RLS Policies

**Steps:**
1. Login as User A
2. Open DevTools → Console
3. Try accessing User B's data:
```javascript
const { data } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', 'user-b-id');

console.log(data); // Should be empty or error
```

4. **Expected:** RLS blocks access to other users' data

---

### Test 24: Admin Authorization

**Steps:**
1. Login as non-admin
2. Open DevTools → Console
3. Try admin API:
```javascript
const token = (await supabase.auth.getSession()).data.session.access_token;
const res = await fetch('/api/admin/builders', {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await res.json()); // Should show error
```

4. **Expected:** 403 Forbidden error

---

## Success Criteria

All phases pass when:

### Phase 1-2:
- [x] New users can select roles
- [x] Roles persist across sessions
- [x] Role switching works instantly
- [x] Portal menu updates dynamically
- [x] No duplicate modals
- [x] No unwanted redirects

### Phase 3:
- [x] Routes protected based on roles
- [x] Unauthorized access redirects
- [x] Route changes detected
- [x] Role switching updates access

### Phase 4:
- [x] Admin panel loads for admins only
- [x] Statistics accurate
- [x] Verify/reject builders works
- [x] Database updates correctly

### Phase 5:
- [x] Email notifications logged
- [x] Onboarding checklist shows for builders
- [x] Checklist dismisses permanently
- [x] Progress updates with verification

---

## Troubleshooting

### Issue: Modal appears 3 times
**Fix:** Check `initializingModal` and `hasShownOnboarding` flags

### Issue: Route guard not working
**Fix:** Verify `route-guard.js` loaded, check console for errors

### Issue: Admin panel 403 error
**Fix:** Run `add-admin-role.sql` to add admin role

### Issue: Email not sending
**Fix:** Check Netlify function logs, emails currently only logged

### Issue: Checklist not appearing
**Fix:** Wait 2 seconds after login, check `localStorage` for dismiss flag

---

## Test Checklist

Copy and check off as you test:

**Basic Functionality:**
- [ ] Test 1: New user onboarding (buyer)
- [ ] Test 2: New user onboarding (builder)
- [ ] Test 3: Add second role
- [ ] Test 4: Role switching

**Route Protection:**
- [ ] Test 5A: Access /builder without role
- [ ] Test 5B: Access /my-dashboard without role
- [ ] Test 5C: Access when not logged in
- [ ] Test 5D: Role switching updates access
- [ ] Test 6: Route change detection

**Admin Panel:**
- [ ] Test 7A: Access without admin role
- [ ] Test 7B: Access with admin role
- [ ] Test 8: Dashboard statistics
- [ ] Test 9: View builder details
- [ ] Test 10: Verify builder
- [ ] Test 11: Reject builder
- [ ] Test 12: Filter by status

**Advanced Features:**
- [ ] Test 13: Email notifications
- [ ] Test 14A: Onboarding checklist (pending)
- [ ] Test 14B: Checklist after verification
- [ ] Test 14C: Reset checklist
- [ ] Test 15: localStorage persistence

**Flow Tests:**
- [ ] Test 16: Complete user journey
- [ ] Test 17: Multi-tab sync

**Error Handling:**
- [ ] Test 18A: Network offline
- [ ] Test 18B: Invalid data
- [ ] Test 19: Race conditions

**Mobile & Performance:**
- [ ] Test 20: Responsive design
- [ ] Test 21: Load time
- [ ] Test 22: Memory leaks

**Security:**
- [ ] Test 23: RLS policies
- [ ] Test 24: Admin authorization

---

**Total Tests:** 24 test scenarios
**Estimated Time:** 2-3 hours for complete testing
**Status:** All phases implemented and ready for testing

🎉 **Happy Testing!**
