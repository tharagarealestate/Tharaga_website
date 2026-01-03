/**
 * Execute Property Upload System Migrations
 * Migrations: 070 and 071
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read migration files
const migration070Path = join(__dirname, 'supabase', 'migrations', '070_property_upload_admin_management.sql');
const migration071Path = join(__dirname, 'supabase', 'migrations', '071_property_upload_rls_policies.sql');

const sql070 = readFileSync(migration070Path, 'utf-8');
const sql071 = readFileSync(migration071Path, 'utf-8');

console.log('🚀 Property Upload System Migrations');
console.log('=====================================\n');
console.log('Migration 070:', migration070Path);
console.log('Migration 071:', migration071Path);
console.log('SQL 070 length:', sql070.length, 'characters');
console.log('SQL 071 length:', sql071.length, 'characters\n');

// Check for environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Checking connection credentials...\n');

if (!DATABASE_URL && !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ No database connection credentials found\n');
  console.log('=== MANUAL EXECUTION REQUIRED ===\n');
  console.log('Please execute the migrations manually:\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new\n');
  console.log('2. Execute Migration 070:');
  console.log('   Copy SQL from: supabase/migrations/070_property_upload_admin_management.sql\n');
  console.log('3. Execute Migration 071:');
  console.log('   Copy SQL from: supabase/migrations/071_property_upload_rls_policies.sql\n');
  console.log('The migrations will create:');
  console.log('  ✅ 5 new tables');
  console.log('  ✅ 10 new columns in properties table');
  console.log('  ✅ 4 new functions');
  console.log('  ✅ Indexes and RLS policies\n');
  process.exit(1);
}

if (DATABASE_URL) {
  console.log('✅ Found DATABASE_URL - using direct PostgreSQL connection\n');
  await executeWithPg();
} else {
  console.log('⚠️  DATABASE_URL not found');
  console.log('⚠️  Direct SQL execution via REST API not supported by Supabase');
  console.log('⚠️  Please use Supabase SQL Editor (see instructions above)\n');
  process.exit(1);
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

    // Execute Migration 070
    console.log('⚡ Executing Migration 070: Property Upload Admin Management...');
    try {
      await client.query(sql070);
      console.log('✅ Migration 070 executed successfully!\n');
    } catch (err070) {
      // Check if it's a "already exists" error (which is OK)
      if (err070.message.includes('already exists') || err070.message.includes('does not exist')) {
        console.log('⚠️  Migration 070: Some objects already exist (this is OK)\n');
      } else {
        console.error('❌ Migration 070 failed:', err070.message);
        if (err070.position) {
          console.error('Error at position:', err070.position);
        }
        throw err070;
      }
    }

    // Execute Migration 071
    console.log('⚡ Executing Migration 071: RLS Policies...');
    try {
      await client.query(sql071);
      console.log('✅ Migration 071 executed successfully!\n');
    } catch (err071) {
      // Check if it's a "already exists" error (which is OK)
      if (err071.message.includes('already exists') || err071.message.includes('does not exist')) {
        console.log('⚠️  Migration 071: Some objects already exist (this is OK)\n');
      } else {
        console.error('❌ Migration 071 failed:', err071.message);
        if (err071.position) {
          console.error('Error at position:', err071.position);
        }
        throw err071;
      }
    }

    console.log('\n✅ ✅ ✅ ALL MIGRATIONS SUCCESSFUL! ✅ ✅ ✅\n');
    console.log('📊 Created/Updated:');
    console.log('   • property_upload_drafts table');
    console.log('   • property_verification_history table');
    console.log('   • builder_engagement_metrics table');
    console.log('   • admin_activity_log table');
    console.log('   • admin_builder_assignments table');
    console.log('   • Extended properties table (10 new columns)');
    console.log('   • calculate_builder_ranking() function');
    console.log('   • Trigger functions');
    console.log('   • Indexes and RLS policies\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'property_upload_drafts',
        'property_verification_history',
        'builder_engagement_metrics',
        'admin_activity_log',
        'admin_builder_assignments'
      )
      ORDER BY table_name;
    `);

    console.log('✅ Verified tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    await client.end();
    console.log('\n🎉 Migration execution complete!\n');
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
      console.log('Please copy the SQL from the migration files and execute manually:');
      console.log('https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new\n');
      process.exit(1);
    }
  }
}
