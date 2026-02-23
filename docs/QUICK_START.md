# 🚀 Quick Start - Tharaga Role System

## 5-Minute Setup

### Step 1: Run Database Migration (2 minutes)

**Click this link:** https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new

**Then:**
1. Open `E:\Tharaga_website\Tharaga_website\supabase\migrations\20250103_create_role_tables.sql`
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste in Supabase SQL Editor
4. Click **"Run"** button (green, top-right)
5. Wait for "Success" message

**Verify:**
- Go to https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/editor
- Check for 3 new tables: `user_roles`, `builder_profiles`, `buyer_profiles`

---

### Step 2: Wait for Deployment (2 minutes)

**Check Netlify:** https://app.netlify.com/

Latest commits should auto-deploy:
- ✅ `c78d5e8` - feat(Phase 2): complete role switcher UI
- ✅ `cc0784c` - feat: implement professional role-based access control (Phase 1)
- ✅ `881a3e8` - docs: add migration instructions

Wait for green checkmark ✓ on deployment.

---

### Step 3: Test It! (1 minute)

**Open:** https://tharaga.co.in (in **incognito mode**)

1. Click "Login / Signup"
2. Click "Continue with Google"
3. **You should see:**
   - ✨ Beautiful role selection modal
   - Choose "I'm Buying" or "I'm Building"
   - Get redirected to dashboard

**Already logged in?**
1. Click your username (top-right)
2. See role switcher in dropdown menu
3. Switch between buyer/builder modes

---

## ✅ What You Get

### For NEW Users:
```
Sign in → Role Selection Modal → Choose Role → Dashboard
```

### For EXISTING Users:
```
Click Name → See Roles → Switch Modes → Dynamic Menu
```

### Features:
✅ Multi-role support (buyer AND builder)
✅ Beautiful role switcher in dropdown
✅ Verified builder badges
✅ Dynamic dashboard links
✅ Smooth animations
✅ Mobile responsive

---

## 🎯 Quick Test Scenarios

### Test 1: Onboarding (30 seconds)
```
Incognito → Login → See Modal → Pick Role → Dashboard ✓
```

### Test 2: Role Switching (20 seconds)
```
Login → Click Name → See Roles → Click Other Role → Switch ✓
```

### Test 3: Add Second Role (40 seconds)
```
Login → Click Name → "Add [Role]" → Fill Form → Submit ✓
```

---

## 📱 Quick Commands

**Check role state:**
```javascript
window.thgRoleManager.getState()
```

**Switch role:**
```javascript
await window.thgRoleManager.switchRole('builder')
```

**Show modal manually:**
```javascript
window.thgRoleManager.showRoleSelection()
```

---

## 🐛 Quick Troubleshooting

**Modal doesn't show?**
→ Check console (F12), verify role-manager-enhanced.js loaded

**Can't switch roles?**
→ Check /api/user/switch-role endpoint, verify auth token

**Database error?**
→ Re-run migration SQL in Supabase dashboard

**Still stuck?**
→ See `TESTING_GUIDE.md` for detailed troubleshooting

---

## 📊 Quick Status Check

**✅ If working correctly:**
- New users see onboarding modal
- Dropdown shows role switcher
- Switching changes dashboard link
- Roles persist on refresh
- No console errors

**❌ If not working:**
1. Check Netlify deployment completed
2. Verify Supabase tables exist
3. Clear browser cache (Ctrl+Shift+R)
4. Check console for errors
5. See `TESTING_GUIDE.md`

---

## 🎉 Success!

If you can:
1. ✓ Sign in and see role selection
2. ✓ Switch between roles from menu
3. ✓ Dashboard link changes with role

**Then it's working perfectly!**

**Next:** See `TESTING_GUIDE.md` for comprehensive testing.

---

**Total Setup Time:** ~5 minutes
**Difficulty:** Easy
**Status:** Production Ready 🚀
