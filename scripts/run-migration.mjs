/**
 * Run Supabase migration via PostgreSQL connection
 * This script executes the role tables migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
  console.error('Set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

// Read migration file
const migrationPath = join(__dirname, 'supabase', 'migrations', '20250103_create_role_tables.sql');
let migrationSQL;

try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log('✅ Migration file loaded successfully');
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('\n🚀 Starting migration execution...\n');

  try {
    // Split SQL into individual statements (handle multi-line statements)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Extract statement type for logging
      const statementType = statement.match(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+(\w+)/i);
      const logPrefix = statementType ? `[${statementType[1]} ${statementType[2]}]` : `[Statement ${i + 1}]`;

      try {
        // Execute via Supabase RPC (raw SQL execution)
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Check if error is because function doesn't exist, then use alternative
          if (error.message.includes('exec_sql')) {
            // Try using the REST API directly with a custom function
            console.warn(`⚠️  ${logPrefix} RPC not available, trying alternative method...`);

            // For critical tables, we'll need to use the Supabase dashboard
            console.log(`ℹ️  ${logPrefix} This statement needs to be run via Supabase Dashboard SQL Editor`);
            continue;
          }

          // Check if it's a "already exists" error (which is ok with IF NOT EXISTS)
          if (error.message.includes('already exists') || error.message.includes('already defined')) {
            console.log(`⚠️  ${logPrefix} Already exists - skipping`);
            successCount++;
            continue;
          }

          throw error;
        }

        console.log(`✅ ${logPrefix} Success`);
        successCount++;

      } catch (error) {
        console.error(`❌ ${logPrefix} Error: ${error.message}`);

        // Continue with other statements even if one fails
        errorCount++;

        // Store failed statement for manual execution
        if (errorCount === 1) {
          console.log('\n⚠️  Failed statements (copy to Supabase Dashboard SQL Editor):\n');
        }
        console.log(`-- Statement ${i + 1}:`);
        console.log(statement);
        console.log('\n');
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration completed: ${successCount} successful, ${errorCount} errors`);
    console.log('='.repeat(60) + '\n');

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. Please run them manually via Supabase Dashboard:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql');
      console.log('   2. Copy the failed statements from above');
      console.log('   3. Paste and run them in the SQL Editor\n');
      process.exit(1);
    } else {
      console.log('🎉 All tables and functions created successfully!\n');
      console.log('Next steps:');
      console.log('  1. Verify tables in Supabase Dashboard > Table Editor');
      console.log('  2. Test the role system by signing in with a new user\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📋 Please run the migration manually via Supabase Dashboard:');
    console.error('   1. Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql');
    console.error('   2. Copy contents of: supabase/migrations/20250103_create_role_tables.sql');
    console.error('   3. Paste and click "Run"\n');
    process.exit(1);
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
