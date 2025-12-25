# 🗄️ SQL Execution Instructions for Search Schema

## ✅ **SQL File Ready**
Location: `supabase/search_schema.sql`

## 🚀 **Quick Execution (Recommended)**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new
2. Or navigate: Dashboard → SQL Editor → New Query

### **Step 2: Copy SQL**
1. Open `supabase/search_schema.sql` in your editor
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)

### **Step 3: Execute**
1. Paste into Supabase SQL Editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait for success message

### **Step 4: Verify**
Check Table Editor to confirm these tables exist:
- ✅ `search_history`
- ✅ `popular_searches`
- ✅ `search_suggestions`
- ✅ `voice_search_logs`
- ✅ `map_search_areas`

---

## 🔧 **Alternative: Using Script**

If you have DATABASE_URL set:
```powershell
cd app
node ../scripts/execute_search_schema_enhanced.mjs
```

---

## 📊 **What This SQL Creates**

### **Tables:**
1. **search_history** - User search history
2. **popular_searches** - Trending searches
3. **search_suggestions** - Auto-suggest data
4. **voice_search_logs** - Voice search analytics
5. **map_search_areas** - Saved map searches

### **Functions:**
1. `increment_search_count()` - Update popular searches
2. `get_search_suggestions()` - Get suggestions
3. `search_properties()` - Advanced property search
4. `properties_within_radius()` - Map-based search

### **Security:**
- ✅ Row Level Security (RLS) enabled
- ✅ User-specific data protected
- ✅ Public data accessible to all

---

## ⚠️ **If You See Errors**

### **"relation already exists"**
✅ **Safe to ignore** - Table already created, script uses `IF NOT EXISTS`

### **"function already exists"**
✅ **Safe to ignore** - Function will be replaced with `CREATE OR REPLACE`

### **Permission denied**
❌ Check your Supabase project access level
- You need admin/service role access

### **Connection timeout**
❌ Network issue - Use Supabase Dashboard instead

---

## ✅ **Success Indicators**

After execution, you should see:
- ✅ "Success. No rows returned" message
- ✅ Tables visible in Table Editor
- ✅ Functions visible when querying `pg_proc`

---

**Estimated Time:** 30 seconds
**Difficulty:** Easy (Copy-paste-execute)
















