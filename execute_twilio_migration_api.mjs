#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
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
    
    Object.entries(envVars).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    // .env file not found
  }
}

loadEnv();

// Read the SQL migration file
const sqlPath = join(__dirname, 'supabase/migrations/022_twilio_messaging.sql');
const sql = readFileSync(sqlPath, 'utf-8');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wedevtjjmdvngyshqdro.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

console.log('🚀 Executing Twilio Messaging Migration via Supabase API\n');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  try {
    console.log('📝 Attempting to execute migration via Supabase API...\n');
    
    // Try using RPC function if available
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      console.log('⚠️  RPC method not available, trying alternative...\n');
      
      // Try using the Management API endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API execution failed:', errorText);
        throw new Error('API execution failed');
      }

      const result = await response.json();
      console.log('✅ Migration executed successfully via API!');
      console.log(result);
      return;
    }

    console.log('✅ Migration executed successfully!');
    console.log(data);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📋 Since API execution is not available, please use manual method:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new');
    console.log('2. Copy SQL from: supabase/migrations/022_twilio_messaging.sql');
    console.log('3. Paste and execute\n');
    process.exit(1);
  }
}

executeMigration();

