# 🚀 Automation System Migration Execution Guide

## Step 1: Execute SQL Migration

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new
   ```

2. **Copy the migration SQL:**
   - Open file: `supabase/migrations/025_automation_system.sql`
   - Select all (Ctrl+A) and copy (Ctrl+C)

3. **Paste and Execute:**
   - Paste into SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for execution (should take 2-3 seconds)

4. **Verify Success:**
   - You should see: `Success. No rows returned`
   - Check Table Editor to verify tables were created

### Option B: Via Command Line (If DATABASE_URL is set)

```bash
node execute_automation_migration.mjs
```

## Step 2: Verify Tables Created

### Check in Supabase Dashboard:

1. Go to **Table Editor**: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/editor

2. Verify these tables exist:
   - ✅ `automations`
   - ✅ `automation_executions`
   - ✅ `automation_queue`

### Expected Schema:

**automations:**
- id (uuid)
- builder_id (uuid)
- name (text)
- description (text)
- trigger_conditions (jsonb)
- actions (jsonb)
- priority (integer)
- is_active (boolean)
- tags (text[])
- total_executions (integer)
- successful_executions (integer)
- failed_executions (integer)
- last_execution_at (timestamptz)
- created_by (uuid)
- created_at (timestamptz)
- updated_at (timestamptz)

**automation_executions:**
- id (uuid)
- automation_id (uuid)
- trigger_event_id (uuid)
- lead_id (uuid)
- status (text)
- execution_time_ms (integer)
- records_processed (integer)
- records_succeeded (integer)
- records_failed (integer)
- output (jsonb)
- error_message (text)
- error_stack (text)
- logs (text[])
- executed_at (timestamptz)
- completed_at (timestamptz)

**automation_queue:**
- id (uuid)
- automation_id (uuid)
- trigger_event_id (uuid)
- context (jsonb)
- priority (integer)
- scheduled_for (timestamptz)
- status (text)
- attempts (integer)
- max_attempts (integer)
- last_error (text)
- started_at (timestamptz)
- completed_at (timestamptz)
- execution_id (uuid)
- created_at (timestamptz)

## Step 3: Test API Routes

Run the test script:
```bash
node test_automation_api.mjs
```

Or test manually:

### Test GET /api/automations
```bash
curl http://localhost:3000/api/automations?builder_id=YOUR_BUILDER_ID
```

### Test POST /api/automations
```bash
curl -X POST http://localhost:3000/api/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Automation",
    "trigger_conditions": {"and": [{"field": "score", "operator": "greater_than", "value": 7}]},
    "actions": [{"type": "send_email", "config": {"template": "welcome"}}]
  }'
```

## Step 4: Test Queue System

The queue system will be tested automatically when automations are triggered. You can also test it programmatically:

```typescript
import { AutomationQueue } from '@/lib/automation/queue/automationQueue';

// Queue an automation
const jobId = await AutomationQueue.queueAutomation({
  automation_id: 'automation-id',
  trigger_event_id: 'event-id',
  context: { lead_id: 'lead-id' },
  priority: 5
});

// Get pending jobs
const pending = await AutomationQueue.getPendingJobs(10);
```

## Troubleshooting

### Migration Errors

If you see errors like "relation already exists":
- This is OK - the migration uses `IF NOT EXISTS`
- The tables may have been created by a previous migration

### RLS Policy Errors

If RLS policies fail:
- Check that `auth.users` table exists
- Verify you're logged in as a builder user

### API Errors

If API routes return 401:
- Ensure you're authenticated
- Check that `builder_id` matches your user ID

## Success Checklist

- [ ] Migration executed successfully
- [ ] All 3 tables created
- [ ] Indexes created
- [ ] RLS policies active
- [ ] API routes respond correctly
- [ ] Queue system can queue jobs
- [ ] No TypeScript errors
- [ ] No linting errors





