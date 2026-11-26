#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the SQL migration file
const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '022_analytics_suite.sql');
const sql = readFileSync(sqlPath, 'utf-8');

// Supabase project details
const SUPABASE_PROJECT_ID = 'wedevtjjmdvngyshqdro';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

console.log('\n' + '='.repeat(70));
console.log('📊 ANALYTICS SUITE SQL SCHEMA EXECUTION');
console.log('='.repeat(70));
console.log('\n✅ SQL file read successfully!');
console.log(`📄 File: ${sqlPath}`);
console.log(`📏 Size: ${(sql.length / 1024).toFixed(2)} KB`);
console.log(`🔤 Statements: ~${sql.split(';').filter(s => s.trim().length > 10).length} statements\n`);

console.log('🔍 Checking for DATABASE_URL...\n');

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  console.log('✅ Found DATABASE_URL - attempting direct connection...\n');
  try {
    const { default: pg } = await import('pg');
    const { Client } = pg;

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⚡ Executing analytics schema...');
    await client.query(sql);

    console.log('\n✅ ✅ ✅ MIGRATION SUCCESSFUL! ✅ ✅ ✅\n');
    console.log('📊 Created tables:');
    console.log('   • platform_metrics');
    console.log('   • revenue_metrics');
    console.log('   • user_events');
    console.log('   • conversion_funnels');
    console.log('   • ab_test_results\n');
    console.log('📊 Created functions:');
    console.log('   • calculate_mrr()');
    console.log('   • calculate_churn_rate()');
    console.log('   • track_event()');
    console.log('   • update_platform_metrics()\n');
    console.log('🔒 RLS policies enabled for all tables\n');

    await client.end();
    process.exit(0);

  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('⚠️  pg module not installed');
      console.log('⚠️  Falling back to manual execution...\n');
    } else {
      console.error('❌ Migration failed:', error.message);
      if (error.position) {
        console.error('Error at position:', error.position);
      }
      console.log('\n⚠️  Falling back to manual execution...\n');
    }
    showManualInstructions();
  }
} else {
  console.log('⚠️  No DATABASE_URL found\n');
  showManualInstructions();
}

function showManualInstructions() {
  console.log('='.repeat(70));
  console.log('📋 MANUAL EXECUTION REQUIRED');
  console.log('='.repeat(70));
  console.log('\nPlease execute the SQL schema manually:\n');
  console.log('1️⃣  Open Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new\n`);
  console.log('2️⃣  Copy ALL contents from:');
  console.log(`   ${sqlPath}\n`);
  console.log('3️⃣  Paste into the SQL Editor\n');
  console.log('4️⃣  Click "RUN" button (or press Ctrl+Enter)\n');
  console.log('5️⃣  Wait for success message (should take 2-5 seconds)\n');
  console.log('6️⃣  Verify tables were created in Table Editor:\n');
  console.log('   - platform_metrics');
  console.log('   - revenue_metrics');
  console.log('   - user_events');
  console.log('   - conversion_funnels');
  console.log('   - ab_test_results\n');
  console.log('='.repeat(70));
  console.log('\n💡 TIP: Use Ctrl+A to select all in the SQL file\n');
  console.log('📝 The SQL file contains:');
  console.log('   • 5 new analytics tables');
  console.log('   • 4 database functions');
  console.log('   • RLS policies for security');
  console.log('   • Indexes for performance\n');
}

