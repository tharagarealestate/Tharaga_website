#!/usr/bin/env node

import { readFileSync } from 'fs';

// Read the SQL migration file
const sql = readFileSync('supabase/migrations/020_pricing_system.sql', 'utf-8');

// Supabase project details
const SUPABASE_PROJECT_ID = 'wedevtjjmdvngyshqdro';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// Get connection details from environment
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase database direct connection
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Checking available connection methods...\n');

if (DATABASE_URL) {
  console.log('✅ Found DATABASE_URL - will use direct PostgreSQL connection');
  await executeWithPg();
} else if (SUPABASE_SERVICE_KEY) {
  console.log('✅ Found SUPABASE_SERVICE_ROLE_KEY - will use Supabase REST API');
  await executeWithSupabaseAPI();
} else {
  console.log('❌ No connection credentials found\n');
  showManualInstructions();
}

async function executeWithPg() {
  try {
    const { default: pg } = await import('pg');
    const { Client } = pg;

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⚡ Executing migration...');
    await client.query(sql);

    console.log('\n✅ ✅ ✅ MIGRATION SUCCESSFUL! ✅ ✅ ✅\n');
    console.log('📊 Created tables:');
    console.log('   • pricing_plans');
    console.log('   • user_subscriptions');
    console.log('   • commission_rates');
    console.log('   • commission_transactions');
    console.log('   • lawyer_verification_pricing');
    console.log('   • lawyer_consultation_pricing');
    console.log('   • affiliate_commission_rates');
    console.log('   • payment_history');
    console.log('   • invoices\n');

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
      showManualInstructions();
      process.exit(1);
    }
  }
}

async function executeWithSupabaseAPI() {
  console.log('\n⚠️  Note: Direct SQL execution via REST API may not work');
  console.log('Using manual instructions instead\n');
  showManualInstructions();
}

function showManualInstructions() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 MANUAL EXECUTION REQUIRED');
  console.log('='.repeat(70));
  console.log('\nPlease execute the migration manually:\n');
  console.log('1️⃣  Open Supabase SQL Editor:');
  console.log('    https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new\n');
  console.log('2️⃣  Copy ALL contents from:');
  console.log('    supabase/migrations/020_pricing_system.sql\n');
  console.log('3️⃣  Paste into the SQL Editor\n');
  console.log('4️⃣  Click "RUN" button (or press Ctrl+Enter)\n');
  console.log('5️⃣  Wait for success message\n');
  console.log('='.repeat(70));
  console.log('\n💡 TIP: You can use Ctrl+A to select all in the file\n');
}
