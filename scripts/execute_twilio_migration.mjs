#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync as readEnv } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env');
    const envContent = readEnv(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    // Set environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    // .env file not found, continue with existing env vars
  }
}

loadEnv();

// Read the SQL migration file
const sqlPath = join(__dirname, 'supabase/migrations/022_twilio_messaging.sql');
const sql = readFileSync(sqlPath, 'utf-8');

// Supabase project details
const SUPABASE_PROJECT_ID = 'wedevtjjmdvngyshqdro';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// Get connection details from environment
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🚀 Twilio Messaging Migration Executor\n');
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

    console.log('⚡ Executing Twilio messaging migration...');
    console.log('This may take a few moments...\n');
    
    await client.query(sql);

    console.log('\n✅ ✅ ✅ MIGRATION SUCCESSFUL! ✅ ✅ ✅\n');
    console.log('📊 Created/Updated:');
    console.log('   • message_templates table');
    console.log('   • message_campaigns table');
    console.log('   • Updated lead_interactions table');
    console.log('   • RLS policies');
    console.log('   • Indexes');
    console.log('   • Triggers\n');

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
        const position = parseInt(error.position);
        const snippet = sql.substring(Math.max(0, position - 200), position + 200);
        console.error('\nSQL snippet around error:');
        console.error(snippet);
      }
      if (error.code) {
        console.error('Error code:', error.code);
      }
      showManualInstructions();
      process.exit(1);
    }
  }
}

async function executeWithSupabaseAPI() {
  console.log('\n⚠️  Note: Supabase REST API cannot execute DDL statements');
  console.log('Please use manual execution method below.\n');
  showManualInstructions();
  process.exit(1);
}

function showManualInstructions() {
  console.log('\n📋 MANUAL EXECUTION INSTRUCTIONS:\n');
  console.log('1. Go to Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new\n');
  console.log('2. Open the migration file:');
  console.log('   supabase/migrations/022_twilio_messaging.sql\n');
  console.log('3. Copy the entire SQL content');
  console.log('4. Paste into Supabase SQL Editor');
  console.log('5. Click "Run" to execute\n');
  console.log('✅ The migration is safe to run multiple times (uses IF NOT EXISTS)\n');
}

