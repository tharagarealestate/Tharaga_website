// =============================================
// EXECUTE AUTOMATION SYSTEM MIGRATION
// =============================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationPath = join(__dirname, 'supabase', 'migrations', '025_automation_system.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('📋 Automation System Migration');
console.log('================================\n');
console.log('Migration file:', migrationPath);
console.log('SQL length:', sql.length, 'characters\n');

// Check for environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking connection credentials...\n');

if (!DATABASE_URL && !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ No database connection credentials found\n');
  console.log('=== MANUAL EXECUTION REQUIRED ===\n');
  console.log('Please execute the migration manually:\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new\n');
  console.log('2. Copy the SQL from:');
  console.log('   supabase/migrations/025_automation_system.sql\n');
  console.log('3. Paste and click "Run"\n');
  console.log('The migration will create:');
  console.log('  ✅ automations table');
  console.log('  ✅ automation_executions table');
  console.log('  ✅ automation_queue table');
  console.log('  ✅ Indexes and RLS policies\n');
  process.exit(0);
}

if (DATABASE_URL) {
  console.log('✅ Found DATABASE_URL - using direct PostgreSQL connection\n');
  await executeWithPg();
} else {
  console.log('⚠️  Direct SQL execution via API not supported');
  console.log('Please use Supabase SQL Editor (see instructions above)\n');
  process.exit(0);
}

async function executeWithPg() {
  try {
    const { default: pg } = await import('pg');
    const { Client } = pg;

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⚡ Executing migration...');
    await client.query(sql);

    console.log('\n✅ ✅ ✅ MIGRATION SUCCESSFUL! ✅ ✅ ✅\n');
    console.log('📊 Created/Updated:');
    console.log('   • automations table');
    console.log('   • automation_executions table');
    console.log('   • automation_queue table');
    console.log('   • Indexes and triggers');
    console.log('   • RLS policies\n');

    // Verify tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('automations', 'automation_executions', 'automation_queue')
      ORDER BY table_name;
    `);

    console.log('✅ Verified tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    await client.end();
    process.exit(0);

  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('\n⚠️  pg module not installed');
      console.log('Installing pg...\n');
      const { execSync } = await import('child_process');
      execSync('npm install pg', { stdio: 'inherit' });
      console.log('\n✅ Installed! Retrying...\n');
      await executeWithPg();
    } else {
      console.error('\n❌ Migration failed:', error.message);
      if (error.position) {
        console.error('Error at position:', error.position);
      }
      console.log('\n=== MANUAL EXECUTION REQUIRED ===');
      console.log('Please copy the SQL from: supabase/migrations/025_automation_system.sql');
      console.log('And paste it into: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new');
      process.exit(1);
    }
  }
}



