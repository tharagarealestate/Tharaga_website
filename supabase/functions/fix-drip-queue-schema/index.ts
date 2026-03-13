// One-shot edge function: fix email_sequence_queue schema
// Problems:
//   1) lead_id is UUID but leads.id is BIGINT
//   2) builder_id is UUID NOT NULL but public leads may have null builder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ has_db_url: !!dbUrl }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!dbUrl) {
    return new Response(JSON.stringify({ success: false, error: 'No SUPABASE_DB_URL' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts")
    const client = new Client(dbUrl)
    await client.connect()

    const fixes: string[] = []

    // Step 1: Check if table exists
    const tableCheck = await client.queryArray(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'email_sequence_queue'
      ) AS exists
    `)
    const tableExists = tableCheck.rows[0]?.[0]
    if (!tableExists) {
      await client.end()
      return new Response(JSON.stringify({ success: false, error: 'email_sequence_queue table does not exist' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Step 2: Check current lead_id type
    const typeCheck = await client.queryArray(`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'email_sequence_queue'
        AND column_name = 'lead_id'
    `)
    const currentType = typeCheck.rows[0]?.[0] as string
    fixes.push(`current lead_id type: ${currentType}`)

    if (currentType !== 'bigint') {
      // Drop FK on lead_id
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          DROP CONSTRAINT IF EXISTS email_sequence_queue_lead_id_fkey;
      `)

      // Drop NOT NULL temporarily
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          ALTER COLUMN lead_id DROP NOT NULL;
      `)

      // Delete rows that can't be cast (non-numeric UUIDs)
      await client.queryArray(`
        DELETE FROM public.email_sequence_queue
        WHERE lead_id IS NULL
           OR lead_id::TEXT NOT SIMILAR TO '[0-9]+';
      `)

      // Change type UUID → BIGINT
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          ALTER COLUMN lead_id TYPE BIGINT USING lead_id::TEXT::BIGINT;
      `)

      // Restore NOT NULL
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          ALTER COLUMN lead_id SET NOT NULL;
      `)

      // Add FK back with BIGINT type
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          ADD CONSTRAINT email_sequence_queue_lead_id_fkey
          FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
      `)

      fixes.push('lead_id: UUID → BIGINT + FK re-added')
    } else {
      fixes.push('lead_id already BIGINT — skipped')
    }

    // Step 3: Make builder_id nullable
    const nullableCheck = await client.queryArray(`
      SELECT is_nullable FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'email_sequence_queue'
        AND column_name = 'builder_id'
    `)
    const isNullable = nullableCheck.rows[0]?.[0] as string

    if (isNullable === 'NO') {
      // Drop FK first
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          DROP CONSTRAINT IF EXISTS email_sequence_queue_builder_id_fkey;
      `)

      // Drop NOT NULL
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          ALTER COLUMN builder_id DROP NOT NULL;
      `)

      // Re-add FK (nullable)
      await client.queryArray(`
        ALTER TABLE public.email_sequence_queue
          ADD CONSTRAINT email_sequence_queue_builder_id_fkey
          FOREIGN KEY (builder_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      `)

      fixes.push('builder_id: NOT NULL removed, FK re-added as nullable')
    } else {
      fixes.push('builder_id already nullable — skipped')
    }

    await client.end()

    return new Response(JSON.stringify({
      success: true,
      message: 'email_sequence_queue schema fixed',
      fixes,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message, stack: err.stack }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
