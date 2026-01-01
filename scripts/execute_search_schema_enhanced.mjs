#!/usr/bin/env node

/**
 * Enhanced SQL Execution Script for Search Schema
 * Attempts multiple connection methods
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = readFileSync(join(__dirname, '..', 'supabase', 'search_schema.sql'), 'utf8');

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wedevtjjmdvngyshqdro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

console.log('🚀 Executing Search Schema SQL...\n');
console.log('📝 This will create:');
console.log('   • search_history table');
console.log('   • popular_searches table');
console.log('   • search_suggestions table');
console.log('   • voice_search_logs table');
console.log('   • map_search_areas table');
console.log('   • 4 database functions');
console.log('   • Indexes and RLS policies\n');

if (DATABASE_URL) {
  console.log('✅ Found DATABASE_URL - trying direct PostgreSQL connection\n');
  await executeWithPg();
} else if (SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ Found Supabase credentials - trying via REST API\n');
  await executeWithSupabaseAPI();
} else {
  console.log('❌ No database connection credentials found\n');
  console.log('📋 Please execute SQL manually in Supabase Dashboard:\n');
  console.log(`   ${SUPABASE_URL.replace('/rest/v1', '')}/sql/new\n`);
  console.log('   Or set DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable\n');
  process.exit(1);
}

async function executeWithPg() {
  try {
    const { default: pg } = await import('pg');
    const { Client } = pg.default || pg;

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⚡ Executing SQL...');
    // Split SQL into statements and execute one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement + ';');
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (err) {
          // Skip if already exists errors
          if (err.message.includes('already exists') || err.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1}: ${err.message.split('\n')[0]}`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ ✅ ✅ SQL EXECUTED SUCCESSFULLY! ✅ ✅ ✅\n');
    console.log('📊 Verification: Check Supabase Dashboard to confirm tables were created\n');

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
      console.error('\n❌ Error:', error.message);
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('\n⚠️  Direct connection failed. Please use Supabase Dashboard:\n');
        console.log(`   ${SUPABASE_URL.replace('/rest/v1', '')}/sql/new\n`);
      }
      process.exit(1);
    }
  }
}

async function executeWithSupabaseAPI() {
  console.log('⚠️  Supabase REST API does not support executing arbitrary SQL.\n');
  console.log('📋 Please execute SQL manually in Supabase Dashboard:\n');
  console.log(`   ${SUPABASE_URL.replace('/rest/v1', '')}/sql/new\n`);
  console.log('   Copy contents from: supabase/search_schema.sql\n');
  process.exit(1);
}






































