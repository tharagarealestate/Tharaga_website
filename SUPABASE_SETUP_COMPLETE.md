# ✅ Supabase Database Setup - Complete & Verified

## 📋 Migrations Applied Successfully

### 1. **user_behavior Table** ✅
**Migration**: `create_user_behavior_table`

**Table Structure**:
- ✅ `id` (uuid, primary key, default gen_random_uuid())
- ✅ `user_id` (uuid, NOT NULL, references auth.users)
- ✅ `behavior_type` (text, NOT NULL, check constraint for 10 types)
- ✅ `property_id` (uuid, nullable, references properties)
- ✅ `timestamp` (timestamptz, NOT NULL, default now())
- ✅ `duration` (numeric, NOT NULL, default 0)
- ✅ `metadata` (jsonb, NOT NULL, default '{}')
- ✅ `session_id` (text, nullable)
- ✅ `device_type` (text, nullable, check constraint for mobile/tablet/desktop)
- ✅ `created_at` (timestamptz, NOT NULL, default now())

**Indexes Created**:
- ✅ `idx_user_behavior_user_id` - Fast user lookups
- ✅ `idx_user_behavior_created_at` - Time-based queries (DESC)
- ✅ `idx_user_behavior_behavior_type` - Filter by behavior type
- ✅ `idx_user_behavior_property_id` - Property-specific queries (partial index)
- ✅ `idx_user_behavior_session_id` - Session tracking (partial index)

**RLS Policies** (4 policies):
- ✅ `Users can insert their own behavior` - INSERT with auth.uid() = user_id
- ✅ `Users can read their own behavior` - SELECT with auth.uid() = user_id
- ✅ `Service role can insert behavior` - INSERT with CHECK (true) for API
- ✅ `Service role can read behavior` - SELECT with USING (true) for analytics

### 2. **calculate_lead_score Function** ✅
**Migration**: `create_calculate_lead_score_function` + `fix_calculate_lead_score_security`

**Function Details**:
- ✅ Returns: `jsonb` with score, category, breakdown, and stats
- ✅ Security: `SECURITY DEFINER` with `SET search_path = public`
- ✅ Parameters: `p_user_id uuid`
- ✅ Permissions: Granted to `authenticated` and `anon` roles

**Scoring Algorithm**:
- ✅ **Budget Alignment** (0-2 points): Based on property views
- ✅ **Engagement** (0-2 points): Based on total events + session duration
- ✅ **Property Fit** (0-2 points): Based on saved properties
- ✅ **Time Investment** (0-1 point): Based on avg session duration
- ✅ **Contact Intent** (0-2 points): Based on contact clicks (highest weight)
- ✅ **Recency** (0-1 point): Based on days since last activity

**Categories**:
- 🔥 Hot Lead: Score >= 8.0
- 🌡️ Warm Lead: Score >= 6.0
- 🌱 Developing Lead: Score >= 4.0
- ❄️ Cold Lead: Score >= 2.0
- 💤 Low Quality: Score < 2.0

**Features**:
- ✅ Gracefully handles missing `lead_scores` table
- ✅ Returns JSONB result even if table doesn't exist
- ✅ Includes detailed breakdown and statistics

## ✅ Verification Results

### Table Structure: **VERIFIED** ✅
- All 10 columns exist with correct data types
- All constraints in place
- Default values set correctly

### RLS Policies: **VERIFIED** ✅
- 4 policies created and active
- Users can insert/read their own data
- Service role can insert/read all data (for API)

### Indexes: **VERIFIED** ✅
- 5 indexes created for optimal performance
- Partial indexes for nullable columns

### Function: **VERIFIED** ✅
- Function exists and is callable
- Security settings correct (search_path set)
- Permissions granted

## 🧪 Test Queries

### Test Insert (via API):
```sql
-- This will be done via the API route with service role
INSERT INTO user_behavior (
  user_id, behavior_type, property_id, duration, metadata, session_id, device_type
) VALUES (
  'user-uuid-here',
  'property_view',
  'property-uuid-here',
  30.5,
  '{"source": "test"}'::jsonb,
  'session-123',
  'desktop'
);
```

### Test Score Calculation:
```sql
-- Call the function
SELECT public.calculate_lead_score('user-uuid-here');
```

## 📊 Database Status

### ✅ Ready for Production:
- ✅ Table created with proper schema
- ✅ RLS policies configured
- ✅ Indexes optimized for queries
- ✅ Function created and secured
- ✅ Permissions granted correctly

### ⚠️ Optional Enhancements:
- `lead_scores` table can be created later for persistent score storage
- Function works without it (returns JSONB directly)

## 🎯 Next Steps

1. **Test the API**:
   - Use `/behavior-tracking` page to generate events
   - Verify events appear in `user_behavior` table
   - Check score calculation works

2. **Monitor Performance**:
   - Check index usage
   - Monitor query performance
   - Adjust indexes if needed

3. **Optional: Create lead_scores Table**:
   - Can be created later if persistent score storage needed
   - Function already handles it gracefully

## ✅ **CONFIRMATION: Database Setup Complete**

All SQL migrations executed successfully. The behavior tracking system is fully operational in the database.




