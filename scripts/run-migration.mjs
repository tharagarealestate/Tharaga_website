#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🔄 Running lead_pipeline migration...')

    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250203_lead_pipeline_table.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    // Execute migration using Supabase client
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      // Try direct execution via REST API
      console.log('Trying direct SQL execution...')

      // Split migration into statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      let successCount = 0
      let errorCount = 0

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('execute_sql', { query: statement + ';' })

          if (stmtError) {
            console.error(`❌ Error executing statement: ${stmtError.message}`)
            console.error(`   Statement: ${statement.substring(0, 100)}...`)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`❌ Exception: ${err.message}`)
          errorCount++
        }
      }

      console.log(`\n✅ Migration completed: ${successCount} statements succeeded, ${errorCount} failed`)

      if (errorCount > 0) {
        console.log('\n⚠️  Some statements failed. You may need to run the migration manually in Supabase SQL Editor.')
        console.log('   Migration file: supabase/migrations/20250203_lead_pipeline_table.sql')
      }
    } else {
      console.log('✅ Migration executed successfully!')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message)

    console.log('\n📝 MANUAL MIGRATION INSTRUCTIONS:')
    console.log('   1. Go to Supabase Dashboard: https://app.supabase.com')
    console.log('   2. Select your project')
    console.log('   3. Navigate to SQL Editor')
    console.log('   4. Create new query')
    console.log('   5. Copy contents of: supabase/migrations/20250203_lead_pipeline_table.sql')
    console.log('   6. Paste and run the query')

    process.exit(1)
  }
}

runMigration()
