#!/usr/bin/env node

/**
 * Execute Search Schema SQL in Supabase
 * This script will execute the search_schema.sql file directly in Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = readFileSync(join(__dirname, '..', 'supabase', 'search_schema.sql'), 'utf8');

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

console.log('🚀 Executing Search Schema SQL...\n');

if (DATABASE_URL) {
  console.log('✅ Found DATABASE_URL - using direct PostgreSQL connection\n');
  await executeWithPg();
} else if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ Found Supabase credentials - trying Supabase REST API\n');
  await executeWithSupabase();
} else {
  console.log('❌ No database connection found\n');
  showManualInstructions();
  process.exit(1);
}

async function executeWithPg() {
  try {
    const pg = await import('pg');
    const { Client } = pg.default || pg;

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⚡ Executing SQL...');
    await client.query(sql);

    console.log('\n✅ ✅ ✅ SQL EXECUTED SUCCESSFULLY! ✅ ✅ ✅\n');
    console.log('📊 Created tables:');
    console.log('   • search_history');
    console.log('   • popular_searches');
    console.log('   • search_suggestions');
    console.log('   • voice_search_logs');
    console.log('   • map_search_areas\n');
    console.log('🔧 Created functions:');
    console.log('   • increment_search_count()');
    console.log('   • get_search_suggestions()');
    console.log('   • search_properties()');
    console.log('   • properties_within_radius()\n');

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
      console.error('\n❌ Error executing SQL:', error.message);
      if (error.position) {
        console.error('Error at position:', error.position);
      }
      showManualInstructions();
      process.exit(1);
    }
  }
}

async function executeWithSupabase() {
  console.log('⚠️  Direct SQL execution via REST API is limited.');
  console.log('Please use the Supabase Dashboard SQL Editor instead.\n');
  showManualInstructions();
}

function showManualInstructions() {
  console.log('📝 MANUAL EXECUTION INSTRUCTIONS:\n');
  console.log('1. Open Supabase Dashboard SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql/new\n');
  console.log('2. Copy the SQL from:');
  console.log('   supabase/search_schema.sql\n');
  console.log('3. Paste into SQL Editor and click "Run"\n');
  console.log('4. Verify tables were created in Table Editor\n');
}


