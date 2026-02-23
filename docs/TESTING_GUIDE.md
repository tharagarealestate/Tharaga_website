# 🧪 Complete Role System Testing Guide

## Prerequisites

✅ **Before Testing:**
1. Supabase migration completed (tables created)
2. Netlify deployed latest changes
3. Browser DevTools open (F12 → Console tab)
4. Test in **incognito mode** for fresh state

---

## 🎯 Test Scenarios

### **Scenario 1: New User Onboarding (First-Time Sign-Up)**

**Steps:**
1. Open https://tharaga.co.in in **incognito mode**
2. Click "Login / Signup" button (top-right header)
3. Click "Continue with Google"
4. Select Google account and complete OAuth
5. **Expected:** Role selection modal appears

**Role Selection Modal Should Show:**
- 🎉 Welcome message
- Two cards: "I'm Buying 🏠" and "I'm Building 🏗️"
- Smooth animations and hover effects
- Gold accent colors

**Test Path A - Select "I'm Buying":**
6. Click "I'm Buying" card
7. **Expected:**
   - Success notification appears
   - Redirect to `/my-dashboard` after 1 second
   - User is created with buyer role

**Test Path B - Select "I'm Building":**
6. Click "I'm Building" card
7. **Expected:** Builder verification form appears with:
   - Company Name field (required)
   - GSTIN field (optional)
   - RERA Number field (optional)
   - Back and Submit buttons
8. Fill in company name (e.g., "Test Constructions Pvt Ltd")
9. Click "Submit for Verification"
10. **Expected:**
    - Success notification appears
    - Redirect to `/builder` dashboard
    - Builder profile created with verification_status = 'pending'

**Console Logs to Verify:**
```
[role-manager-enhanced] Initializing for user: your@email.com
[role-manager-enhanced] User needs onboarding
[role-manager-enhanced] Adding role: buyer (or builder)
✅ Buyer/Builder role added successfully!
```

---

### **Scenario 2: Existing User with Single Role**

**Steps:**
1. Login with user who already has ONE role (buyer OR builder)
2. Click username button (top-right) to open dropdown
3. **Expected:** Menu shows:
   - User info with avatar
   - "Your Roles" section
   - Active role with checkmark ✓
   - "Add [Other Role]" button
   - Profile, Dashboard, Logout links

**Example for Buyer:**
```
Your Roles
  🏠 Buyer Mode ✓
  ➕ Add Builder Role

Profile
My Dashboard
Logout
```

4. Click "Add Builder Role" (or "Add Buyer Role")
5. **Expected:**
   - If adding builder: Verification form appears
   - If adding buyer: Direct addition with success notification
6. Complete the process
7. **Expected:** Page reloads, menu now shows BOTH roles

**Console Logs:**
```
[role-manager-enhanced] Fetching user roles...
[role-manager-enhanced] Roles fetched: { roles: ['buyer'], primaryRole: 'buyer' }
[role-manager-enhanced] Adding role: builder
✅ Builder role added successfully!
```

---

### **Scenario 3: User with Multiple Roles (Role Switching)**

**Steps:**
1. Login with user who has BOTH buyer AND builder roles
2. Click username to open dropdown
3. **Expected:** Menu shows:
   - Both roles listed
   - Active role highlighted with ✓
   - Inactive role clickable
   - Verified badge if builder is verified

**Example:**
```
Your Roles
  🏠 Buyer Mode ✓          ← Active (highlighted)
  🏗️ Builder Mode [✓ Verified]  ← Click to switch

Profile
My Dashboard             ← Goes to /my-dashboard
Logout
```

4. Click on inactive role (e.g., "Builder Mode")
5. **Expected:**
   - Loading state on that item
   - Success notification: "Switched to Builder mode"
   - Page reloads after 500ms
   - Menu now shows Builder as active ✓
   - Dashboard link changes to "Builder Dashboard"

6. Open dropdown again
7. **Expected:**
```
Your Roles
  🏠 Buyer Mode
  🏗️ Builder Mode [✓ Verified] ✓  ← Now active

Profile
Builder Dashboard        ← Now goes to /builder
Logout
```

**Console Logs:**
```
[role-manager-enhanced] Switching to role: builder
[role-manager-enhanced] Role switched successfully
Switched to builder mode
```

---

### **Scenario 4: Dashboard Access Based on Role**

**Test A - Buyer Role Active:**
1. Ensure buyer mode is active
2. Click "My Dashboard" from menu
3. **Expected:** Navigate to `/my-dashboard`
4. Verify buyer-specific features load

**Test B - Builder Role Active:**
1. Switch to builder mode (if not already)
2. Click "Builder Dashboard" from menu
3. **Expected:** Navigate to `/builder`
4. Verify builder-specific features load

**Test C - Direct URL Access:**
1. Try accessing `/builder` when buyer mode is active
2. Try accessing `/my-dashboard` when builder mode is active
3. **Expected:** Both should work (no route protection yet in Phase 2)

---

### **Scenario 5: Role Persistence Across Page Reloads**

**Steps:**
1. Login and switch to a specific role (e.g., Builder)
2. Note the active role in menu
3. Refresh page (F5)
4. Open dropdown menu again
5. **Expected:** Same role is still active ✓
6. Check localStorage:
   - Key: `tharaga_active_role`
   - Value: `"builder"` (or `"buyer"`)

**Console Logs:**
```
[role-manager-enhanced] Initializing role manager on page load
[role-manager-enhanced] Roles fetched: { roles: ['buyer', 'builder'], primaryRole: 'builder' }
```

---

### **Scenario 6: Verified Builder Badge**

**Steps:**
1. Login as builder with verified status
   (You'll need to manually verify in Supabase)
2. Open dropdown menu
3. **Expected:** Builder role shows:
   ```
   🏗️ Builder Mode [✓ Verified] ✓
   ```
   With green gradient badge

**Manual Verification in Supabase:**
1. Go to Supabase Table Editor
2. Open `builder_profiles` table
3. Find your user's row
4. Set `verification_status` = `'verified'`
5. Set `verified_at` = current timestamp
6. Save
7. Refresh Tharaga website
8. Check menu for verified badge

---

### **Scenario 7: Error Handling**

**Test A - API Failure:**
1. Temporarily break API endpoint (disconnect internet)
2. Try switching roles
3. **Expected:** Error notification appears
4. Role doesn't change
5. Console shows error message

**Test B - Invalid Data:**
1. Open builder form
2. Leave company name empty
3. Click Submit
4. **Expected:** Alert: "Please enter your company name"

**Test C - Duplicate Role:**
1. Try adding a role you already have (via console)
```javascript
await window.thgRoleManager.addRole('buyer')
```
2. **Expected:** Error notification or API returns error

---

### **Scenario 8: Mobile Responsive**

**Steps:**
1. Open site on mobile device or resize browser to mobile width
2. Click menu button
3. **Expected:**
   - Role cards stack vertically
   - Buttons remain touch-friendly
   - Text scales appropriately
   - No horizontal scroll

---

## 🔍 Console Commands for Manual Testing

Open browser console (F12) and try these:

```javascript
// Check role state
window.thgRoleManager.getState()

// Fetch roles manually
await window.thgRoleManager.fetchRoles()

// Switch role manually
await window.thgRoleManager.switchRole('builder')

// Add role manually
await window.thgRoleManager.addRole('buyer')

// Check if needs onboarding
await window.thgRoleManager.needsOnboarding()

// Show role selection modal manually
window.thgRoleManager.showRoleSelection()

// Rebuild menu manually
window.__thgUpdateMenu()

// Check stored active role
localStorage.getItem('tharaga_active_role')
```

---

## 📊 Database Verification

After each test, verify database state:

### Check Tables in Supabase

**user_roles:**
```sql
SELECT * FROM user_roles WHERE user_id = 'your-user-id';
```

**Expected Columns:**
- role (buyer/builder)
- is_primary (true for active role)
- verified (true for buyers, pending for builders)

**builder_profiles:**
```sql
SELECT * FROM builder_profiles WHERE user_id = 'your-user-id';
```

**Expected Data:**
- company_name
- gstin (optional)
- rera_number (optional)
- verification_status (pending/verified/rejected)

**buyer_profiles:**
```sql
SELECT * FROM buyer_profiles WHERE user_id = 'your-user-id';
```

---

## ✅ Success Criteria

### Phase 2 Complete When:

✅ **Onboarding:**
- [ ] New users see role selection modal
- [ ] Buyer role creates buyer_profile
- [ ] Builder form validates and creates builder_profile
- [ ] Redirects work correctly

✅ **Role Switcher:**
- [ ] Menu shows all user roles
- [ ] Active role highlighted with ✓
- [ ] Click switches role smoothly
- [ ] Notification appears on switch
- [ ] Menu rebuilds with correct dashboard link

✅ **Badges & Indicators:**
- [ ] Verified badge shows for verified builders
- [ ] Pending status visible (if implemented)
- [ ] Active indicator (✓) shows correctly

✅ **Persistence:**
- [ ] Active role persists across page reloads
- [ ] localStorage stores active role
- [ ] Database reflects primary role

✅ **Error Handling:**
- [ ] Empty fields show validation errors
- [ ] API errors show user-friendly messages
- [ ] Failed operations don't change state

✅ **UX:**
- [ ] Animations smooth and professional
- [ ] Loading states visible
- [ ] Hover effects work
- [ ] Mobile responsive

---

## 🐛 Common Issues & Fixes

### Issue: Modal doesn't appear
**Fix:** Check console for errors, verify role-manager-enhanced.js loaded

### Issue: Role switch doesn't work
**Fix:** Check API endpoint `/api/user/switch-role` returns 200, verify token

### Issue: Menu doesn't rebuild
**Fix:** Check `window.__thgUpdateMenu` function exists, UI stored globally

### Issue: Database not updating
**Fix:** Verify RLS policies allow user to update their own rows

### Issue: Verified badge not showing
**Fix:** Check `verification_status` = `'verified'` in builder_profiles table

---

## 📝 Test Checklist

Copy this checklist and mark as you test:

- [ ] **Scenario 1:** New user onboarding (buyer)
- [ ] **Scenario 1:** New user onboarding (builder)
- [ ] **Scenario 2:** Add second role
- [ ] **Scenario 3:** Switch between roles
- [ ] **Scenario 4:** Dashboard access
- [ ] **Scenario 5:** Role persistence
- [ ] **Scenario 6:** Verified badge
- [ ] **Scenario 7:** Error handling
- [ ] **Scenario 8:** Mobile responsive
- [ ] **Database:** Records created correctly
- [ ] **Console:** No errors during normal flow

---

## 🚀 Next Steps After Testing

Once all scenarios pass:
1. Document any bugs found
2. Test with multiple users
3. Verify production deployment
4. Monitor Netlify function logs
5. Check Supabase database growth
6. Prepare for Phase 3 (route protection)

---

**Happy Testing!** 🎉

Report issues with screenshots and console logs.
